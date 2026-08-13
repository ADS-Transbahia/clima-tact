-- Fase 2: Survey Engine genérico, com identidade separada de resposta.
-- Referência: docs/SPECIFICATION.md secoes 4.3/4.4.

-- ---------------------------------------------------------------------------
-- Pesquisas
-- ---------------------------------------------------------------------------

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'poll'
    check (type in (
      'climate', 'safety', 'satisfaction', 'event', 'training',
      'leadership', 'benefits', 'communication', 'poll', 'evaluation', 'quiz'
    )),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_anonymous boolean not null default true,
  require_unique_response boolean not null default true,
  is_priority boolean not null default false,
  show_progress boolean not null default false,
  min_responses_to_show_results integer not null default 5,
  target_audience jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index surveys_company_status_idx on public.surveys (company_id, status);

create trigger surveys_set_updated_at
  before update on public.surveys
  for each row execute function public.set_updated_at();

create table public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  "order" integer not null default 0,
  text text not null,
  required boolean not null default true,
  type text not null check (type in (
    'single_choice', 'multi_choice', 'scale_1_5', 'scale_0_10',
    'nps', 'text', 'yes_no', 'stars', 'matrix', 'category_rating'
  )),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index survey_questions_survey_idx on public.survey_questions (survey_id, "order");

create table public.survey_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  label text not null,
  "order" integer not null default 0,
  value text
);
create index survey_question_options_question_idx on public.survey_question_options (question_id);

-- ---------------------------------------------------------------------------
-- Anonimização: participação e respostas em tabelas sem FK entre si.
-- ---------------------------------------------------------------------------

-- Hash determinístico por (usuário, pesquisa) — permite checar "já
-- respondeu?" sem guardar o vínculo usuário -> resposta em lugar nenhum.
-- O segredo abaixo é interno à instância; quem tem acesso de DBA sempre
-- consegue recalcular o hash, mas a aplicação nunca expõe esse vínculo.
create or replace function public.survey_participant_hash(p_survey_id uuid)
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select encode(
    extensions.hmac(auth.uid()::text || ':' || p_survey_id::text, 'clima-tact-participation-secret-v1', 'sha256'),
    'hex'
  );
$$;

create table public.survey_participation (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  participant_hash text not null,
  completed_at timestamptz not null default now(),
  unique (survey_id, participant_hash)
);

create or replace function public.set_participant_hash()
returns trigger
language plpgsql
as $$
begin
  if new.participant_hash is null then
    new.participant_hash := public.survey_participant_hash(new.survey_id);
  end if;
  return new;
end;
$$;

create trigger survey_participation_set_hash
  before insert on public.survey_participation
  for each row execute function public.set_participant_hash();

-- response_group_id agrupa as respostas de um mesmo envio, sem relação
-- com participant_hash ou com o usuário.
create table public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  response_group_id uuid not null,
  answer jsonb not null,
  created_at timestamptz not null default now()
);
create index survey_answers_survey_question_idx on public.survey_answers (survey_id, question_id);

-- Insere participação + respostas na mesma transação (security invoker,
-- roda com as policies do próprio usuário). Se a participação já existir
-- (unique violation), a transação inteira falha e nenhuma resposta é
-- gravada — bloqueio de reenvio sem checagem manual/condição de corrida.
create or replace function public.submit_survey_response(
  p_survey_id uuid,
  p_answers jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_answer jsonb;
begin
  insert into public.survey_participation (survey_id) values (p_survey_id);

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    insert into public.survey_answers (survey_id, question_id, response_group_id, answer)
    values (
      p_survey_id,
      (v_answer ->> 'question_id')::uuid,
      v_group_id,
      v_answer -> 'answer'
    );
  end loop;
end;
$$;

grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_question_options enable row level security;
alter table public.survey_participation enable row level security;
alter table public.survey_answers enable row level security;

create policy surveys_select on public.surveys
  for select using (
    company_id = public.current_company_id()
    and (status in ('active', 'closed') or public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
  );

create policy surveys_write on public.surveys
  for all
  using (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
  with check (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'));

create policy survey_questions_select on public.survey_questions
  for select using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id
        and s.company_id = public.current_company_id()
        and (s.status in ('active', 'closed') or public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
    )
  );

create policy survey_questions_write on public.survey_questions
  for all using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id
        and s.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );

create policy survey_question_options_select on public.survey_question_options
  for select using (
    exists (
      select 1 from public.survey_questions q
      join public.surveys s on s.id = q.survey_id
      where q.id = question_id
        and s.company_id = public.current_company_id()
        and (s.status in ('active', 'closed') or public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
    )
  );

create policy survey_question_options_write on public.survey_question_options
  for all using (
    exists (
      select 1 from public.survey_questions q
      join public.surveys s on s.id = q.survey_id
      where q.id = question_id
        and s.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );

create policy survey_participation_select_own on public.survey_participation
  for select using (participant_hash = public.survey_participant_hash(survey_id));

create policy survey_participation_insert_own on public.survey_participation
  for insert with check (
    participant_hash = public.survey_participant_hash(survey_id)
    and exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.company_id = public.current_company_id() and s.status = 'active'
    )
  );

create policy survey_answers_insert on public.survey_answers
  for insert with check (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.company_id = public.current_company_id() and s.status = 'active'
    )
  );

create policy survey_answers_select_admin on public.survey_answers
  for select using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id
        and s.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );

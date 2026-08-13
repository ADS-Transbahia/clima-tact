-- Rascunho de resposta (permite retomar de onde parou) + agrupamento
-- de perguntas por seção (fidelidade a pesquisas longas migradas de papel).
--
-- Importante sobre anonimato: enquanto a pesquisa está em rascunho, o
-- sistema PRECISA saber de quem é aquele rascunho (é assim que "retomar
-- de onde parei" funciona, inclusive em outro dispositivo). O vínculo com
-- a identidade existe só durante o preenchimento. Ao concluir, as
-- respostas migram para survey_answers (sem vínculo com o usuário, como
-- já funcionava) e o rascunho é apagado — o rastro identificável some.

alter table public.survey_questions add column section text;

create table public.survey_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create trigger survey_drafts_set_updated_at
  before update on public.survey_drafts
  for each row execute function public.set_updated_at();

alter table public.survey_drafts enable row level security;

create policy survey_drafts_select_own on public.survey_drafts
  for select using (user_id = auth.uid());

create policy survey_drafts_delete_own on public.survey_drafts
  for delete using (user_id = auth.uid());

create policy survey_drafts_write_own on public.survey_drafts
  for insert with check (
    user_id = auth.uid()
    and company_id = public.current_company_id()
    and exists (select 1 from public.surveys s where s.id = survey_id and s.status = 'active')
  );

create policy survey_drafts_update_own on public.survey_drafts
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and company_id = public.current_company_id()
    and exists (select 1 from public.surveys s where s.id = survey_id and s.status = 'active')
  );

-- Apaga o rascunho do usuário como parte da mesma transação que grava
-- as respostas anônimas e a participação — se a participação já existir
-- (reenvio bloqueado), tudo é revertido, inclusive esta exclusão.
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

  delete from public.survey_drafts where survey_id = p_survey_id and user_id = auth.uid();
end;
$$;

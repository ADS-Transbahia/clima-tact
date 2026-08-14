-- Cadastro público pendente de aprovação (RH/TI) + conteúdo modular
-- para comunicações (notícias expansíveis).

-- ---------------------------------------------------------------------------
-- Solicitações de acesso
-- ---------------------------------------------------------------------------

-- auth.users é criado imediatamente no momento da solicitação (via admin
-- client, sem confirmação de e-mail), mas a linha em public.users só é
-- criada na aprovação — até lá, current_company_id()/current_role() do
-- solicitante retornam null e nenhuma policy libera dados da empresa.
create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  cpf text not null,
  email text not null,
  department text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz
);
create index access_requests_company_status_idx on public.access_requests (company_id, status);

alter table public.access_requests enable row level security;

-- Sem policy de insert/update para authenticated: essa tabela só é escrita
-- pelo servidor via client admin (o solicitante ainda não tem perfil, e a
-- aprovação precisa do client admin de qualquer forma pra criar o usuário
-- de auth e o perfil). Só leitura é exposta via RLS normal.
create policy access_requests_select_admin on public.access_requests
  for select using (
    company_id = public.current_company_id()
    and public.current_role() in ('hr_admin', 'company_admin')
  );

-- ---------------------------------------------------------------------------
-- Blocos de conteúdo modulares para comunicações
-- ---------------------------------------------------------------------------

create table public.communication_blocks (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  "order" integer not null default 0,
  type text not null check (type in ('text', 'image', 'file', 'button', 'checklist')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index communication_blocks_communication_idx on public.communication_blocks (communication_id, "order");

alter table public.communication_blocks enable row level security;

create policy communication_blocks_select on public.communication_blocks
  for select using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and c.company_id = public.current_company_id()
        and (c.status = 'published' or public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
    )
  );

create policy communication_blocks_write on public.communication_blocks
  for all using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and c.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );

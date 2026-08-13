-- Fase 1: Comunicação — companies, org structure, communications, notifications
-- Referência: docs/SPECIFICATION.md

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organização
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index departments_company_id_idx on public.departments (company_id);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index positions_company_id_idx on public.positions (company_id);

-- Perfil do usuário, 1:1 com auth.users. Linha só é criada pelo fluxo de
-- convite do admin (service role), nunca por auto-cadastro — por isso não
-- existe policy de INSERT para o usuário autenticado nesta tabela.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  department_id uuid references public.departments(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  role text not null default 'employee'
    check (role in ('employee', 'hr_admin', 'sms_admin', 'company_admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index users_company_id_idx on public.users (company_id);

-- Funções auxiliares para RLS. SECURITY DEFINER + dono da função (postgres)
-- ignora RLS ao consultar public.users, evitando recursão nas policies
-- da própria tabela users.
create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.users where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Comunicação (notícias + comunicados unificados)
-- ---------------------------------------------------------------------------

create table public.communication_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('news', 'announcement')),
  title text not null,
  body text not null,
  cover_image_url text,
  category_id uuid references public.communication_categories(id) on delete set null,
  author_id uuid not null references public.users(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  require_read_confirmation boolean not null default false,
  publish_at timestamptz,
  expire_at timestamptz,
  show_on_tv boolean not null default false,
  target_audience jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index communications_company_status_idx
  on public.communications (company_id, status, publish_at);

create trigger communications_set_updated_at
  before update on public.communications
  for each row execute function public.set_updated_at();

create table public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  url text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table public.communication_reads (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  viewed_at timestamptz,
  confirmed_at timestamptz,
  unique (communication_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Notificações e auditoria
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.users enable row level security;
alter table public.communication_categories enable row level security;
alter table public.communications enable row level security;
alter table public.communication_attachments enable row level security;
alter table public.communication_reads enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy companies_select_own on public.companies
  for select using (id = public.current_company_id());

create policy departments_select on public.departments
  for select using (company_id = public.current_company_id());
create policy departments_write on public.departments
  for all
  using (company_id = public.current_company_id() and public.current_role() = 'company_admin')
  with check (company_id = public.current_company_id() and public.current_role() = 'company_admin');

create policy positions_select on public.positions
  for select using (company_id = public.current_company_id());
create policy positions_write on public.positions
  for all
  using (company_id = public.current_company_id() and public.current_role() = 'company_admin')
  with check (company_id = public.current_company_id() and public.current_role() = 'company_admin');

create policy users_select_same_company on public.users
  for select using (company_id = public.current_company_id());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy users_admin_manage on public.users
  for all
  using (company_id = public.current_company_id() and public.current_role() = 'company_admin')
  with check (company_id = public.current_company_id() and public.current_role() = 'company_admin');

create policy comm_categories_select on public.communication_categories
  for select using (company_id = public.current_company_id());
create policy comm_categories_write on public.communication_categories
  for all
  using (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
  with check (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'));

create policy communications_select_published on public.communications
  for select using (
    company_id = public.current_company_id()
    and (status = 'published' or public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
  );
create policy communications_write on public.communications
  for all
  using (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'))
  with check (company_id = public.current_company_id() and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin'));

create policy comm_attachments_select on public.communication_attachments
  for select using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id and c.company_id = public.current_company_id()
    )
  );
create policy comm_attachments_write on public.communication_attachments
  for all using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and c.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );

create policy comm_reads_select_own on public.communication_reads
  for select using (user_id = auth.uid());
create policy comm_reads_select_admin on public.communication_reads
  for select using (
    exists (
      select 1 from public.communications c
      where c.id = communication_id
        and c.company_id = public.current_company_id()
        and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    )
  );
create policy comm_reads_insert_own on public.communication_reads
  for insert with check (user_id = auth.uid());
create policy comm_reads_update_own on public.communication_reads
  for update using (user_id = auth.uid());

create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

create policy audit_logs_select_admin on public.audit_logs
  for select using (company_id = public.current_company_id() and public.current_role() = 'company_admin');

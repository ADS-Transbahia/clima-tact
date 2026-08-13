-- Permite que admins criem notificações para colegas da própria empresa
-- (ex.: avisar todo mundo quando uma comunicação é publicada).
create policy notifications_insert_admin on public.notifications
  for insert
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('hr_admin', 'sms_admin', 'company_admin')
    and exists (
      select 1 from public.users u
      where u.id = user_id and u.company_id = company_id
    )
  );

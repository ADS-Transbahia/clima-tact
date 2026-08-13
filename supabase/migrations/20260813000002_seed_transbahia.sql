insert into public.companies (name, slug)
values ('Transbahia', 'transbahia')
on conflict (slug) do nothing;

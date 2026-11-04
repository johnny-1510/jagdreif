create or replace function public.admin_users()
returns table(email text, created_at timestamptz, last_sign_in_at timestamptz, confirmed boolean, karten int, lerntage int, aktualisiert timestamptz)
language sql security definer set search_path = '' as $$
  select u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
    (select count(*) from jsonb_each(coalesce(p.data->'srs','{}'::jsonb)) e where jsonb_typeof(e.value)='object' and (e.value->>'box')::int >= 3)::int,
    (select count(*) from jsonb_object_keys(coalesce(p.data->'days','{}'::jsonb)))::int,
    p.updated_at
  from auth.users u left join public.progress p on p.user_id = u.id
  where (auth.jwt()->>'email') = 'johannes.fersch@googlemail.com'
  order by u.created_at desc;
$$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

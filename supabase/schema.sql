-- Jagdreif: Lernstand pro Benutzer (im Supabase SQL-Editor einmal ausführen)
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
drop policy if exists "eigener Lernstand" on public.progress;
create policy "eigener Lernstand" on public.progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

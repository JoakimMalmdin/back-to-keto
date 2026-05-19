create table if not exists public.keto_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entries jsonb not null default '[]'::jsonb,
  goal_weight numeric,
  updated_at timestamptz not null default now()
);

alter table public.keto_profiles enable row level security;

drop policy if exists "Users can read own keto profile" on public.keto_profiles;
create policy "Users can read own keto profile"
on public.keto_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own keto profile" on public.keto_profiles;
create policy "Users can insert own keto profile"
on public.keto_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own keto profile" on public.keto_profiles;
create policy "Users can update own keto profile"
on public.keto_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

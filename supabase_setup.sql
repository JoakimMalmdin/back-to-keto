create extension if not exists pgcrypto with schema extensions;

create table if not exists public.keto_sync_profiles (
  sync_key_hash text primary key,
  entries jsonb not null default '[]'::jsonb,
  goal_weight numeric,
  updated_at timestamptz not null default now()
);

alter table public.keto_sync_profiles enable row level security;

revoke all on public.keto_sync_profiles from anon, authenticated;

create or replace function public.keto_sync_hash(sync_key text)
returns text
language sql
immutable
strict
as $$
  select encode(extensions.digest(sync_key, 'sha256'), 'hex')
$$;

create or replace function public.keto_sync_pull(sync_key text)
returns table(entries jsonb, goal_weight numeric, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.entries, p.goal_weight, p.updated_at
  from public.keto_sync_profiles p
  where p.sync_key_hash = public.keto_sync_hash(sync_key);
$$;

create or replace function public.keto_sync_push(
  sync_key text,
  profile_entries jsonb,
  profile_goal_weight numeric
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.keto_sync_profiles (sync_key_hash, entries, goal_weight, updated_at)
  values (
    public.keto_sync_hash(sync_key),
    coalesce(profile_entries, '[]'::jsonb),
    profile_goal_weight,
    now()
  )
  on conflict (sync_key_hash)
  do update set
    entries = excluded.entries,
    goal_weight = excluded.goal_weight,
    updated_at = now();
$$;

revoke all on function public.keto_sync_hash(text) from public;
grant execute on function public.keto_sync_pull(text) to anon, authenticated;
grant execute on function public.keto_sync_push(text, jsonb, numeric) to anon, authenticated;

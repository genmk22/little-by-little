-- Stores only information the visitor explicitly chooses to save.
create table if not exists public.mood_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  mood_tags text[] not null check (cardinality(mood_tags) between 1 and 8),
  activity_ids text[] not null check (cardinality(activity_ids) between 1 and 5)
);

create index if not exists mood_sessions_user_created_at_idx
  on public.mood_sessions (user_id, created_at desc);

alter table public.mood_sessions enable row level security;

create policy "People can view their own saved check-ins"
  on public.mood_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "People can save their own check-ins"
  on public.mood_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "People can delete their own saved check-ins"
  on public.mood_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- BuddyPlan — Supabase Schema
-- รัน SQL นี้ใน Supabase Dashboard > SQL Editor

-- ─── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text,
  goal          text not null check (goal in ('lose', 'maintain', 'gain')),
  budget_per_week  int not null default 1400,
  target_calories  int not null default 1800,
  diet_tags     text[] default '{}',
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ─── week_plans ────────────────────────────────────────────────────────────
create table if not exists public.week_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  plan_data     jsonb not null,
  generated_at  timestamptz not null,
  created_at    timestamptz default now()
);

create index on public.week_plans (user_id, generated_at desc);

alter table public.week_plans enable row level security;

create policy "Users can read own plans"
  on public.week_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.week_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on public.week_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on public.week_plans for delete
  using (auth.uid() = user_id);

-- ─── shopping_checked ──────────────────────────────────────────────────────
create table if not exists public.shopping_checked (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  checked_items jsonb not null default '{}',
  updated_at    timestamptz default now()
);

alter table public.shopping_checked enable row level security;

create policy "Users can read own shopping"
  on public.shopping_checked for select
  using (auth.uid() = user_id);

create policy "Users can upsert own shopping"
  on public.shopping_checked for insert
  with check (auth.uid() = user_id);

create policy "Users can update own shopping"
  on public.shopping_checked for update
  using (auth.uid() = user_id);

create policy "Users can delete own shopping"
  on public.shopping_checked for delete
  using (auth.uid() = user_id);

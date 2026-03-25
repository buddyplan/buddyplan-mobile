-- BuddyPlan Database Schema
-- Run this in the Supabase SQL Editor before deploying

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  goal            text not null,
  budget_per_week numeric not null,
  target_calories numeric not null,
  diet_tags       text[] not null default '{}',
  is_premium      boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can upsert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete using (auth.uid() = id);


-- ─── week_plans ───────────────────────────────────────────────────────────────
create table if not exists week_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan_data    jsonb not null,
  generated_at timestamptz not null default now()
);

create index if not exists week_plans_user_id_generated_at_idx
  on week_plans (user_id, generated_at desc);

alter table week_plans enable row level security;

create policy "Users can read own plans"
  on week_plans for select using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on week_plans for insert with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on week_plans for update using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on week_plans for delete using (auth.uid() = user_id);


-- ─── shopping_checked ─────────────────────────────────────────────────────────
create table if not exists shopping_checked (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  checked_items jsonb not null default '{}',
  updated_at    timestamptz not null default now()
);

alter table shopping_checked enable row level security;

create policy "Users can read own shopping"
  on shopping_checked for select using (auth.uid() = user_id);

create policy "Users can upsert own shopping"
  on shopping_checked for insert with check (auth.uid() = user_id);

create policy "Users can update own shopping"
  on shopping_checked for update using (auth.uid() = user_id);

create policy "Users can delete own shopping"
  on shopping_checked for delete using (auth.uid() = user_id);


-- ─── user_preferences ─────────────────────────────────────────────────────────
create table if not exists user_preferences (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  favorites          jsonb not null default '[]',
  theme              text check (theme in ('light', 'dark')),
  notification_prefs jsonb,
  regen_count        integer not null default 0,
  regen_year_month   text,
  updated_at         timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "Users can read own preferences"
  on user_preferences for select using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on user_preferences for insert with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on user_preferences for update using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on user_preferences for delete using (auth.uid() = user_id);

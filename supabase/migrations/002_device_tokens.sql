-- Migration 002: Device Tokens for Push Notifications

create table if not exists device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null,
  platform   text check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

create index if not exists device_tokens_user_id_idx
  on device_tokens (user_id);

alter table device_tokens enable row level security;

create policy "Users can read own tokens"
  on device_tokens for select using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on device_tokens for insert with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on device_tokens for update using (auth.uid() = user_id);

create policy "Users can delete own tokens"
  on device_tokens for delete using (auth.uid() = user_id);

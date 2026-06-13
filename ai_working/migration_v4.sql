-- v4 migration: 子供情報テーブル + conversations に child_id 追加
-- Supabase ダッシュボードの SQL Editor で実行してください

-- 1. 子供情報テーブル
create table if not exists public.children (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  birth_year int,
  gender     text,
  created_at timestamptz default now()
);

alter table public.children enable row level security;

create policy "Users manage own children"
  on public.children for all using (auth.uid() = user_id);

-- 2. conversations に child_id を追加
alter table public.conversations
  add column if not exists child_id uuid references public.children(id) on delete set null;

-- 3. category を null 許容に（既存データ保持）
alter table public.conversations
  alter column category drop not null;

-- v4 migration: 子供情報テーブル + conversations に child_id 追加
-- Supabase ダッシュボードの SQL Editor で実行してください
-- ※ children テーブルをリセットして再作成します

-- 1. 既存の children テーブルを削除（存在する場合）
drop table if exists public.children cascade;

-- 2. 子供情報テーブル（birth_date で生年月日管理）
create table public.children (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  birth_date date,
  gender     text,
  created_at timestamptz default now()
);

alter table public.children enable row level security;

create policy "Users manage own children"
  on public.children for all using (auth.uid() = user_id);

-- 3. conversations に child_id を追加（なければ追加）
alter table public.conversations
  add column if not exists child_id uuid references public.children(id) on delete set null;

-- 4. category を null 許容に（既存データ保持）
alter table public.conversations
  alter column category drop not null;

-- 5. 既存の child_id をリセット（外部キー参照先が消えたため）
update public.conversations set child_id = null;

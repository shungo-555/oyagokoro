-- oyagokoro 会話ログ テーブル
-- Supabase ダッシュボード → SQL Editor に貼り付けて Run

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_input text not null,
  empathy text not null,
  alternatives jsonb not null,
  insight text not null,
  tip text not null,
  category text not null default 'その他',
  created_at timestamptz not null default now()
);

create index if not exists conversations_created_at_idx
  on public.conversations (created_at desc);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id);

alter table public.conversations enable row level security;

-- RLS: 自分のデータだけ読める
create policy "Users can read own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

-- RLS: 自分のデータだけ書ける
create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);


-- =============================================
-- v2 → v3 マイグレーション（既存テーブルへの適用）
-- 既にテーブルがある場合は以下を実行
-- =============================================

-- alter table public.conversations
--   add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- create index if not exists conversations_user_id_idx
--   on public.conversations (user_id);

-- create policy "Users can read own conversations"
--   on public.conversations for select
--   using (auth.uid() = user_id);

-- create policy "Users can insert own conversations"
--   on public.conversations for insert
--   with check (auth.uid() = user_id);

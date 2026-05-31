-- oyagokoro 会話ログ テーブル
-- Supabase ダッシュボード → SQL Editor に貼り付けて Run

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
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

alter table public.conversations enable row level security;

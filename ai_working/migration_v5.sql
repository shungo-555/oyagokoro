-- v5 migration: entry_type カラム追加
-- Supabase SQL Editor で実行してください

alter table public.conversations
  add column if not exists entry_type text not null default 'incident';

-- 既存データはすべて incident 扱い（default値で自動設定済み）

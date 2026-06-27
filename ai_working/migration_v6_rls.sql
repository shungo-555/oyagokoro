-- v6 migration: conversations に UPDATE ポリシーを追加
-- Supabase ダッシュボードの SQL Editor で実行してください

drop policy if exists "Users can update own conversations" on public.conversations;

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- conversations テーブルに DELETE ポリシーを追加
-- Supabase ダッシュボードの SQL Editor で実行してください

-- 既存ポリシーを確認（参考）
-- select policyname, cmd from pg_policies where tablename = 'conversations';

-- DELETE ポリシーを追加（既存なら上書き）
drop policy if exists "Users can delete own conversations" on public.conversations;

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

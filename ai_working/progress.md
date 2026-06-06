# oyagokoro 開発メモ

## v3 完了（2026-06-06）

### やったこと

- **Supabase Auth OTP 認証**
  - `@supabase/ssr` を追加
  - `lib/supabase.ts` — `createSupabaseBrowserClient`（ブラウザ用 anon key）
  - `lib/supabase-server.ts` — API routes 用サーバーサイドクライアント
  - `proxy.ts` — セッション自動更新（Next.js 16 の新 Proxy 規約）
  - `components/LoginScreen.tsx` — メール入力 → OTP コード入力の 2 ステップ画面

- **認証フロー**
  - `app/page.tsx` — セッション確認、未ログイン時に LoginScreen を表示
  - ログイン後はセッションが自動更新され、再ログイン不要

- **API routes を認証対応**
  - `app/api/chat/route.ts` — 認証必須（401）、user_id を Supabase に保存
  - `app/api/history/route.ts` — 認証必須（401）、RLS で自分のデータのみ取得

- **スキーマ更新**
  - `assets/schema.sql` — `user_id` カラム追加、RLS ポリシー追加
  - v2 → v3 マイグレーション SQL もコメントで記載

- **環境変数**
  - `SUPABASE_SERVICE_ROLE_KEY` を削除（不要に）
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加

### 現在の画面構成

```
LoginScreen（未ログイン時）
  ↓ OTP 認証
Home（話してみる / 振り返りを見る）
  ↓ 話してみる
Input（テキスト入力）
  ↓ 送信
Response（AI応答 → Supabase に user_id 付きで保存）

Home
  ↓ 振り返りを見る
History（カレンダー + グラフ + 一覧）
```

### Supabase ダッシュボードで必要な作業

1. **Authentication → Providers → Email** で「Enable Email provider」がオンになっているか確認
2. **Authentication → Email Templates** でメール文面をカスタマイズ（任意）
3. **SQL Editor** でマイグレーション SQL を実行（`assets/schema.sql` の v3 マイグレーション部分）
4. **Vercel 環境変数** に `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加

---

## v2 完了（2026-05-31）

### やったこと

- **Gemini API 連携**
  - `lib/gemini.ts` — Gemini 2.5 Flash でAI応答を生成
  - `app/api/chat/route.ts` — POST エンドポイント（AI呼び出し + Supabase保存）
  - ResponseScreen のモックAI（`lib/mockAI.ts`）を本物のAPIに置き換え

- **Supabase 連携**
  - `lib/supabase.ts` — サーバーサイドクライアント
  - `app/api/history/route.ts` — 履歴取得エンドポイント
  - `assets/schema.sql` — `conversations` テーブル定義
  - Vercel から Supabase を Connect（環境変数は自動投入）

- **振り返り画面**
  - `components/HistoryScreen.tsx` — 新規追加
    - 合計・今月の件数サマリ
    - カテゴリ別横棒グラフ
    - 月カレンダー（会話があった日にドット表示、タップで絞り込み）
    - 会話一覧（タップで展開、AI応答全文を確認可能）
  - HomeScreen に「振り返りを見る」ボタン追加

---

## v4 候補（次にやること）

### 優先度 中
- [ ] **Vercel 環境変数に NEXT_PUBLIC_SUPABASE_ANON_KEY を追加してデプロイ確認**
- [ ] **週次サマリ**（今週何回振り返ったか、よく出たカテゴリ）
- [ ] **グラフの強化**（時系列ライングラフ、週ごとの頻度）

### 優先度 低
- [ ] **プッシュ通知**（帰宅時間に「今日の自分天気チェック」）
- [ ] **パートナー共有**（家族で同じアカウントを使う）
- [ ] **エクスポート**（会話ログをCSV/PDF でダウンロード）

# oyagokoro（おやごころ）

子どもに強く当たってしまった親のための、感情サポート・振り返りアプリ。

**本番URL:** https://oyagokoro.vercel.app

---

## コンセプト

「ミスったな…」と思ったとき、その気持ちを話せる場所。  
振り返れるあなたは、十分いい親です。

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| スタイリング | Tailwind CSS v4 |
| AI | Gemini 2.5 Flash (Google Generative AI) |
| DB / Auth | Supabase (PostgreSQL + Supabase Auth) |
| デプロイ | Vercel（GitHub 連携で自動デプロイ） |

---

## 画面構成（v3 現在）

```
[未ログイン]
  LoginScreen — Googleでログイン

[ログイン済み]
  HomeScreen — 話してみる / 振り返りを見る / ログアウト
    ↓ 話してみる
  InputScreen — テキスト入力（最大500文字）
    ↓ 送信
  ResponseScreen — AI応答（共感 / 代替フレーズ / 洞察 / アドバイス）
    → Supabase に保存

  HomeScreen
    ↓ 振り返りを見る
  HistoryScreen — カレンダー + カテゴリ別グラフ + 会話一覧
```

---

## 主要ファイル

```
app/
  page.tsx              # サーバーコンポーネント（Supabase設定をクライアントへ渡す）
  layout.tsx
  api/
    chat/route.ts       # POST: Gemini呼び出し + Supabase保存（認証必須）
    history/route.ts    # GET: 自分の会話履歴取得（認証必須）
    auth/callback/route.ts  # Google OAuth コールバック（PKCEコード交換）

components/
  ClientApp.tsx         # メインアプリロジック（認証チェック・画面遷移）
  LoginScreen.tsx       # Googleログイン画面
  HomeScreen.tsx        # ホーム画面
  InputScreen.tsx       # テキスト入力画面
  ResponseScreen.tsx    # AI応答表示画面
  HistoryScreen.tsx     # 振り返り画面

lib/
  supabase.ts           # createSupabaseBrowserClient（ブラウザ用）
  supabase-server.ts    # createSupabaseServerClient（API routes用）
  gemini.ts             # Gemini API呼び出し・プロンプト定義

middleware.ts           # セッション自動更新（@supabase/ssr）
assets/
  schema.sql            # DBスキーマ定義・マイグレーションSQL
```

---

## DBスキーマ（現在）

```sql
conversations
  id          uuid PK
  user_id     uuid FK → auth.users
  user_input  text       -- ユーザーが入力した文章
  empathy     text       -- AI: 共感
  alternatives jsonb     -- AI: 代替フレーズ（配列）
  insight     text       -- AI: なぜそうなったか
  tip         text       -- AI: 次のために
  category    text       -- ※v4で廃止予定
  created_at  timestamptz
```

**RLS:** `auth.uid() = user_id`（自分のデータのみ読み書き可）

---

## 環境変数

| 変数名 | 用途 | 設定場所 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Vercel-Supabase連携で自動 |
| `SUPABASE_ANON_KEY` | Supabase anon key | Vercel-Supabase連携で自動 |
| `GEMINI_API_KEY` | Gemini API | Vercelに手動設定 |

> **注意:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` はVercel-Supabase連携の競合で使えないことがある。  
> `next.config.ts` で `SUPABASE_ANON_KEY` をフォールバックとして使用している。  
> サーバーコンポーネント（page.tsx）から props 経由でクライアントに渡す設計。

---

## ローカル開発

```bash
npm install
cp .env.local.example .env.local
# .env.local に NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY を設定
npm run dev
```

---

## Supabase 設定（初回セットアップ）

1. SQL Editor で `assets/schema.sql` を実行
2. Authentication → Sign In / Providers → Google をオンにし、Client ID / Secret を設定
3. Authentication → URL Configuration:
   - Site URL: `https://oyagokoro.vercel.app`
   - Redirect URLs: `https://oyagokoro.vercel.app/**`
4. Google Cloud Console で OAuth クライアントを作成し、リダイレクト URI に Supabase の callback URL を追加

---

## バージョン履歴

| バージョン | 日付 | 主な内容 |
|---|---|---|
| v1 | 2026-05 初期 | Next.js セットアップ、モックAI、基本UI |
| v2 | 2026-05-31 | Gemini API連携、Supabase保存、振り返り画面 |
| v3 | 2026-06-06〜07 | Google認証、ログアウト、RLS対応 |
| v4 | 予定 | 子供情報管理、ポジティブ記録、プッシュ通知 |

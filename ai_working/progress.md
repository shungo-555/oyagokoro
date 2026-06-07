# oyagokoro 開発メモ

## v3 完了（2026-06-06〜07）

### やったこと

- **Supabase Auth — Google OAuth**
  - `@supabase/ssr` 導入
  - `middleware.ts` — セッション自動更新
  - `components/LoginScreen.tsx` — Googleでログインボタン
  - `app/auth/callback/route.ts` — PKCEコード交換
  - `components/ClientApp.tsx` — 認証チェック・画面遷移ロジック

- **ログアウト機能**
  - HomeScreen 右上にログアウトボタン追加

- **認証設計の重要な決定事項**
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` は Vercel-Supabase 連携の env var グループと競合し使えない
  - `SUPABASE_ANON_KEY`（連携で確実に設定される）を `next.config.ts` 経由でフォールバックとして使用
  - `app/page.tsx` をサーバーコンポーネントにし、env var を props 経由でクライアントへ渡す設計が最終解
  - Supabase の Site URL と Redirect URLs を Vercel URL に設定することが必須

- **API routes を認証対応**
  - `/api/chat` — 認証必須（401）、user_id を保存
  - `/api/history` — 認証必須（401）、RLS で自分のデータのみ

---

## v2 完了（2026-05-31）

### やったこと

- Gemini 2.5 Flash でAI応答（共感・代替フレーズ・洞察・アドバイス）
- Supabase に会話データを保存
- 振り返り画面（カレンダー + カテゴリ別グラフ + 会話一覧）

---

## v4 開発計画

### 優先順位と設計方針

#### 1. 子供情報の登録とカテゴリ廃止

**背景:** 現在の `category` フィールド（勉強・食事・片付けなど）はユーザーにとって直感的でない。代わりに「誰への対応だったか」を記録できるようにする。

**DB変更（マイグレーション必要）:**

```sql
-- 新テーブル: 子供情報
create table public.children (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,         -- 名前 or ニックネーム
  birth_year int,                   -- 生まれ年（年齢計算用）
  gender     text,                  -- 'boy' | 'girl' | 'other' | null
  created_at timestamptz default now()
);

-- conversations に child_id を追加、category を廃止
alter table public.conversations
  add column child_id uuid references public.children(id) on delete set null;
-- ※ category カラムは残して null 許容にする（既存データ保持）
```

**RLS追加:**
```sql
create policy "Users manage own children"
  on public.children for all using (auth.uid() = user_id);
```

**新しい画面フロー:**
```
HomeScreen
  ↓ 話してみる
ChildSelectScreen（子供を選ぶ、または「未設定」）
  ↓
InputScreen（現在と同じ）
  ↓
ResponseScreen（現在と同じ、child_id を POST に追加）
```

**HistoryScreen の変更:**
- カテゴリ別グラフ → 子供別グラフ
- 子供でフィルタできるタブ or セレクタ

**子供設定画面:**
- HomeScreen から「子供を管理」へアクセス
- 追加・編集・削除

---

#### 2. ポジティブ記録と連続日数カウント

**背景:** 怒ってしまったときだけ記録するアプリではなく、日記的に使えるように。「何もなかった」「よくできた」「うれしかった」も記録できると、連続で怒らなかった日数を可視化できる。

**DB変更:**

```sql
-- conversations の entry_type を追加
alter table public.conversations
  add column entry_type text not null default 'incident';
  -- 'incident'（怒ってしまった）
  -- 'calm'（何もなかった）
  -- 'good'（よくできた・うれしかったこと）
```

**entry_type によるAI応答の違い:**
- `incident`: 現在の応答（共感・代替フレーズ・洞察・アドバイス）
- `calm` / `good`: 短い承認メッセージ（「よかったですね、続けましょう」的な）

**HomeScreen の変更:**
```
[話してみる（incident）]  [よかったことを記録（calm/good）]
```

**連続日数カウント（HistoryScreen）:**
- 「incident」エントリがない日 = "怒らなかった日"
- または「calm」か「good」エントリがある日を "よかった日" としてカウント
- 現在の連続日数と最長記録を表示

---

#### 3. ブラウザプッシュ通知

**方針:** メール通知なし、Web Push（Service Worker）を使用。

**技術:**
- `next-pwa` または手動で `public/sw.js`（Service Worker）を実装
- `PushManager.subscribe()` で通知を購読
- Supabase Edge Function または Vercel Cron で定時送信

**通知タイミング（ユーザーが設定可能）:**
- デフォルト：毎晩20時「今日の振り返りを記録しませんか？」
- 連続記録中：「〇日連続記録中！今日はどうでした？」

**DB追加:**
```sql
-- push通知サブスクリプション保存
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null,
  keys        jsonb not null,
  created_at  timestamptz default now()
);
```

---

### v4 実装順序（推奨）

1. **子供情報登録 + カテゴリ廃止**（DB変更あり、既存データへの影響を確認）
2. **ポジティブ記録 + 連続日数**（DB変更あり、UI変更大）
3. **プッシュ通知**（Service Worker + バックエンド処理が必要）

---

### 既存データについての確認事項

- `category` フィールドを持つ既存の `conversations` レコードをどうするか？
  - **リセットOK** → マイグレーション不要、テーブル再作成でシンプル
  - **保持したい** → ALTER TABLE でカラム追加、category は null 許容のまま残す

---

### 設計上の注意点

- **`NEXT_PUBLIC_` の問題:** Vercel-Supabase 連携を使う限り、env var は `SUPABASE_ANON_KEY`（プレフィックスなし）を使うこと。`page.tsx` はサーバーコンポーネントのまま維持する。
- **Supabase の Redirect URLs:** 新しいドメインを追加した場合は必ず Supabase の URL Configuration に追加すること。
- **RLS は必須:** 新しいテーブルには必ず RLS ポリシーを追加すること。
- **子供情報は sensitive:** 子供の名前・年齢はプライバシーに関わるため、RLS を厳密に。

# oyagokoro 開発メモ

## v4 完了（2026-06-13）

### やったこと

- **子供情報管理（SettingsScreen）**
  - `children` テーブル新設（id, user_id, name, birth_date, gender）
  - RLS ポリシー設定
  - 設定画面から追加・編集・削除
  - 生年月日入力で正確な年齢計算（誕生日通過済みかを考慮）

- **会話前の子供選択（ChildSelectScreen）**
  - 「話してみる」後に誰のことか選べる画面を追加
  - 子供が登録されていない場合はスキップして InputScreen へ
  - 「スキップ」ボタンで選択しないまま進める

- **AIによる自動紐づけ**
  - 子供を選択しなかった場合、Gemini が会話テキストから子供名を検出
  - 登録済み子供と照合して `child_id` を自動セット
  - `/api/chat` に `detected_child_name` ロジックを実装

- **履歴画面の更新**
  - カテゴリ別グラフ → 子どもごとグラフに変更
  - 会話カードに子供名バッジを表示
  - `category` フィールドは null 許容として既存データ保持

- **振り返りの削除機能**
  - 個別削除：カードを展開した下部に「この記録を削除する」ボタン
  - 一括削除：「編集」ボタンでチェックボックスモード → 「全選択/全解除」→「X件を削除する」
  - 削除前に必ず確認モーダル（「この操作は取り消せません」）
  - `DELETE /api/history` に IDs 配列を送る実装

- **バグ修正**
  - RLS の DELETE ポリシーが未設定で削除がサイレント失敗していた問題を修正
  - `migration_v4_fix_rls.sql` を追加

### DB マイグレーション（Supabase で実行済み）
- `migration_v4.sql` — children テーブル作成、conversations に child_id 追加
- `migration_v4_fix_rls.sql` — conversations の DELETE ポリシー追加

### 重要な決定事項
- `birth_year int` → `birth_date date` に変更（生年月日で正確な年齢計算）
- children テーブルは v4 途中でリセット（birth_year → birth_date 変更のため）

---

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

## v5 完了（2026-06-24）

### やったこと

- **A. ポジティブ記録 + 連続日数**
  - `conversations.entry_type text default 'incident'` カラム追加（migration_v5.sql）
  - HomeScreen に「よかったことを記録」ボタン追加（グリーンのボタン）
  - InputScreen に `entryType` props追加（タイトル・プレースホルダー・ボタン色を切り替え）
  - ResponseScreen に `entryType` props追加（good版は短い承認メッセージのみ）
  - Gemini に `getGoodAIResponse()`（軽量）と `getChildTrendComment()` を追加
  - `/api/chat` が `entry_type` を受け取り、good/incident で処理分岐
  - HistoryScreen に連続日数バナー（現在の連続日数 + 最長記録）
  - カレンダーの色分け：incident=ピンク、good=緑 + 凡例追加
  - ConversationCard に `よかった` バッジ表示

- **B. 子供ごとの詳細振り返り**
  - HistoryScreen の子どもバーをタップ → ChildDetailScreen へ遷移
  - ChildDetailScreen（新規）: 子供プロフィール、記録比率グラフ、AIの傾向コメント、会話一覧
  - `/api/child-trend` エンドポイント追加（Gemini でinsightを要約）
  - ClientApp に `child-detail` 画面追加、ChildDetailScreenWrapper でhistory fetchを内包

- **C. AI信頼性の改善**
  - `thinkingBudget: 0` で Gemini 2.5 Flash の thinking モードを無効化（20〜40秒 → 3〜5秒）
  - `export const maxDuration = 60` を `/api/chat`・`/api/child-trend` に追加
  - `parseJSON()` でマークダウンコードブロック混入を安全に除去
  - `withRetry()` で失敗時に1回自動リトライ（`lib/gemini.ts`）

- **D. テキスト消失バグの修正**
  - `InputScreen` に `initialText?: string` propを追加
  - `ClientApp` が `userInput` state を保持し、`initialText={userInput}` で渡す
  - 新規開始（handleStartIncident/handleStartGood）時のみ `userInput` をクリア
  - エラー画面に「入力した文章はそのまま残っています」メッセージ追加

- **E. モバイルUX・段階的開示**
  - `LoadingFlower` コンポーネント：花絵文字アニメーション + ローテーションメッセージ
  - `app/globals.css` に `flower-bloom`・`msg-fade` keyframes 追加
  - incident フロー結果画面の構成変更：
    - 「あなたの気持ち」（empathy）→ ヒーローカードとして常時表示
    - 「こう言えばよかったかも」（alternatives）→ 常時表示（empathyの直後）
    - 「なぜそうなったか」（insight）→ 個別トグル、デフォルト折りたたみ
    - 「次のために」（tip）→ 個別トグル、デフォルト折りたたみ

### DB マイグレーション（Supabase で実行済み）
- `ai_working/migration_v5.sql` — conversations に entry_type カラム追加

---

## v6 提案（次回開始用）

### 優先度 高

**A. Supabase Auth の強化（完了 2026-06-27）**
- 全 API ルートの認証チェック監査 → 全て問題なし
- RLS ポリシー監査結果：
  - conversations: SELECT/INSERT/DELETE は既存、UPDATE のみ未設定 → migration_v6_rls.sql で追加
  - children: ALL ポリシーで全操作カバー済み
- セッション切れ：middleware + onAuthStateChange で正常に対応済み、改善不要
- **Supabase SQL Editor で `ai_working/migration_v6_rls.sql` を実行してください**

**B. プッシュ通知 / PWA 化**
- Web Push API + Service Worker で毎晩リマインダー
- Vercel Cron か Supabase Edge Function で定時送信
- `push_subscriptions` テーブル追加が必要
- 「○日連続！今日はどうでした？」など連続記録を活かした文言

**C. 音声入力対応**
- Web Speech API（ブラウザ標準）でマイクボタンを InputScreen に追加
- 子育て中は手が離せないシーンが多く、ニーズ高
- DB変更なし、フロントのみの実装

### 優先度 中

**D. 月次サマリー**
- HistoryScreen に「今月のまとめを見る」ボタン追加
- Gemini にその月の会話一覧を渡して要約・成長ポイントを生成
- DB変更なし

**E. ストリーク強化・ゲーミフィケーション**
- 「7日連続達成！」などのマイルストーン通知
- バッジやアチーブメント表示
- 現在の `calcStreak()` を拡張するだけで実装可能

**F. テンプレート入力**
- InputScreen に「よくあるシーン」タップで入力補助
  - 「宿題でキレた」「食事中に怒鳴った」「兄弟喧嘩に巻き込まれた」等
- 入力ハードルを下げて継続率向上

### 優先度 低（将来）

**G. 初回オンボーディング**
- アプリコンセプト（「振り返れる親はいい親」）を最初に伝えるチュートリアル
- 子供登録への誘導

**H. パートナー共有**
- 招待コードで家族と記録を共有
- `families` テーブル新設が必要、設計複雑

---

## v5 機能案（元の計画）

### A. ポジティブ記録 ＋ 連続日数（旧 v4 計画から繰越）

怒ってしまった日だけでなく、「何もなかった」「よくできた」も記録できるように。

**DB 変更:**
```sql
alter table public.conversations
  add column entry_type text not null default 'incident';
  -- 'incident'（怒ってしまった）
  -- 'calm'（何もなかった日）
  -- 'good'（よかったこと）
```

**UI 変更:**
- HomeScreen に「よかったことを記録」ボタンを追加
- `calm` / `good` の場合は短い承認メッセージのみ返す（Gemini 呼び出しは軽量化）
- HistoryScreen に「怒らなかった日の連続記録」と「最長記録」を表示

---

### B. ブラウザプッシュ通知（旧 v4 計画から繰越）

毎晩振り返りを促す通知。

**技術:**
- Web Push API（Service Worker）
- Supabase Edge Function か Vercel Cron で定時送信
- `push_subscriptions` テーブル追加

**通知タイミング:**
- デフォルト：毎晩20時「今日の振り返りを記録しませんか？」
- 連続記録中：「○日連続！今日はどうでした？」

---

### C. 子供ごとの詳細振り返り

子供を選んで、その子との記録だけを見られる画面。

**内容:**
- 子供プロフィールページ（名前・年齢・記録数）
- その子との会話一覧
- よかった日 vs 怒ってしまった日の比率グラフ
- 「最近の傾向」をAIが一言でコメント

---

### D. AIによる月次レポート

月末に「今月の振り返り」を自動生成。

**内容:**
- 今月何回記録したか
- 多かった状況のパターン
- 成長ポイント（前月比で怒った回数が減ったなど）
- 来月へのひとことアドバイス

**実装:** HistoryScreen か別画面で「今月のまとめを見る」ボタン → Gemini に会話一覧を要約させる

---

### E. パートナー共有（家族で使う）

同じ家族で記録を共有できる機能。

**概要:**
- 招待コードを発行して家族を招待
- 家族の記録も見られる（または自分の記録のみ共有可能な設定）
- 「パパも同じ悩みを持っている」という気づきを促す

**DB 変更:** `families` テーブル + `family_id` を user に付与

---

### v5 推奨実装順序

1. **A（ポジティブ記録 + 連続日数）** — UX 向上、DBは軽微な変更のみ
2. **C（子供ごと詳細）** — 既存データを活かせる、DB変更なし
3. **D（月次レポート）** — DB変更なし、Gemini だけで実装可能
4. **B（プッシュ通知）** — Service Worker の設定が必要、やや工数大
5. **E（パートナー共有）** — 設計が複雑、後回し推奨

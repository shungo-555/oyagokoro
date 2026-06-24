import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// thinking を無効化して応答速度を改善（2.5-flash はデフォルトで thinking ON = 20〜40s）
const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } } as never;

type ChildRef = { name: string };

function buildIncidentPrompt(children?: ChildRef[]) {
  const hasChildren = children && children.length > 0;
  const childList = hasChildren ? children.map(c => c.name).join('、') : '';

  const childField = hasChildren
    ? `"detected_child_name": "以下のリストから会話に登場する子どもの名前を返す。確信がなければ null。リスト：${childList}"`
    : '"detected_child_name": null';

  return `あなたは「おやごころ」というアプリの感情サポートAIです。
子どもに強く当たってしまった後、罪悪感や後悔を抱える親の気持ちに寄り添い、
前向きになれるアドバイスを提供します。

ユーザーが状況を話してくれたら、以下のJSON形式だけで返してください（コードブロック不要）：
{
  "empathy": "ユーザーの気持ちへの共感（2〜3文、温かく。完璧な親はいないという前提で）",
  "alternatives": ["こう言えばよかった言葉1", "こう言えばよかった言葉2", "こう言えばよかった言葉3"],
  "insight": "なぜそうなったかの優しい分析（2〜3文。自己否定を促さない）",
  "tip": "次のための具体的な一歩（2〜3文。すぐ実践できること）",
  ${childField}
}

注意：
- 親を責めない
- 振り返れる親は十分いい親だと伝える
- 実践しやすい言葉かけの具体例を出す`;
}

const GOOD_SYSTEM_PROMPT = `あなたは「おやごころ」というアプリの感情サポートAIです。
子育てのよかった瞬間を記録しようとしている親に、温かい承認メッセージを返します。

ユーザーが話してくれたことに対して、以下のJSON形式だけで返してください（コードブロック不要）：
{
  "message": "温かく短い承認メッセージ（2〜3文。その行動を具体的にほめ、続けられるよう後押しする）"
}

注意：
- ポジティブで温かいトーンで
- 具体的な行動をほめる
- 完璧じゃなくてもいいと伝える`;

const CHILD_TREND_PROMPT = `あなたは「おやごころ」というアプリの感情サポートAIです。
以下は、ある子どもに関する最近の振り返り記録です。
この子との関わりについて、親への温かいフィードバックを一言で返してください。

以下のJSON形式だけで返してください（コードブロック不要）：
{
  "trend": "最近の傾向と励ましのひとこと（2〜3文。具体的かつポジティブに）"
}`;

// コードブロックや余分なテキストが混入しても JSON を安全に取り出す
function parseJSON(text: string): unknown {
  // ```json ... ``` を除去
  const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
  // まず全体をパース試行
  try { return JSON.parse(stripped); } catch { /* fall through */ }
  // JSONオブジェクトを抽出して再試行
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AIの応答にJSONが含まれていません');
  return JSON.parse(match[0]);
}

// 失敗時に1回リトライ
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('Gemini first attempt failed, retrying...', err);
    return await fn();
  }
}

export interface AIResponse {
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
  detected_child_name: string | null;
}

export interface GoodAIResponse {
  message: string;
}

export interface ChildTrendResponse {
  trend: string;
}

export async function getAIResponse(
  userInput: string,
  children?: ChildRef[]
): Promise<AIResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildIncidentPrompt(children),
    generationConfig: NO_THINKING,
  });

  return withRetry(async () => {
    const result = await model.generateContent(userInput);
    const parsed = parseJSON(result.response.text()) as Record<string, unknown>;
    return {
      empathy: parsed.empathy as string,
      alternatives: parsed.alternatives as string[],
      insight: parsed.insight as string,
      tip: parsed.tip as string,
      detected_child_name: (parsed.detected_child_name as string | null) ?? null,
    };
  });
}

export async function getGoodAIResponse(userInput: string): Promise<GoodAIResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: GOOD_SYSTEM_PROMPT,
    generationConfig: NO_THINKING,
  });

  return withRetry(async () => {
    const result = await model.generateContent(userInput);
    const parsed = parseJSON(result.response.text()) as Record<string, unknown>;
    return { message: parsed.message as string };
  });
}

export async function getChildTrendComment(recentInsights: string[]): Promise<ChildTrendResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: CHILD_TREND_PROMPT,
    generationConfig: NO_THINKING,
  });

  const content = recentInsights.map((ins, i) => `記録${i + 1}: ${ins}`).join('\n');
  try {
    const result = await model.generateContent(content);
    const parsed = parseJSON(result.response.text()) as Record<string, unknown>;
    return { trend: (parsed.trend as string) ?? '' };
  } catch {
    return { trend: '' };
  }
}

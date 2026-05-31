import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `あなたは「おやごころ」というアプリの感情サポートAIです。
子どもに強く当たってしまった後、罪悪感や後悔を抱える親の気持ちに寄り添い、
前向きになれるアドバイスを提供します。

ユーザーが状況を話してくれたら、以下のJSON形式だけで返してください（コードブロック不要）：
{
  "empathy": "ユーザーの気持ちへの共感（2〜3文、温かく。完璧な親はいないという前提で）",
  "alternatives": ["こう言えばよかった言葉1", "こう言えばよかった言葉2", "こう言えばよかった言葉3"],
  "insight": "なぜそうなったかの優しい分析（2〜3文。自己否定を促さない）",
  "tip": "次のための具体的な一歩（2〜3文。すぐ実践できること）",
  "category": "以下から最も近いもの1つだけ: 勉強/食事/片付け/兄弟げんか/ゲーム/朝の準備/その他"
}

注意：
- 親を責めない
- 振り返れる親は十分いい親だと伝える
- 実践しやすい言葉かけの具体例を出す`;

export interface AIResponse {
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
  category: string;
}

export async function getAIResponse(userInput: string): Promise<AIResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(userInput);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AIの応答形式が不正です');

  return JSON.parse(jsonMatch[0]) as AIResponse;
}

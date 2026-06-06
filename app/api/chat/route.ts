import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse } from '@/lib/gemini';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== 'string' || userInput.length > 500) {
      return NextResponse.json({ error: '入力が不正です' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const response = await getAIResponse(userInput);

    await supabase.from('conversations').insert({
      user_id: user.id,
      user_input: userInput,
      empathy: response.empathy,
      alternatives: response.alternatives,
      insight: response.insight,
      tip: response.tip,
      category: response.category,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'AI応答の取得に失敗しました' }, { status: 500 });
  }
}

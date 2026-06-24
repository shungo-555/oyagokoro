import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse, getGoodAIResponse } from '@/lib/gemini';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { userInput, child_id: providedChildId, entry_type } = await req.json();

    if (!userInput || typeof userInput !== 'string' || userInput.length > 500) {
      return NextResponse.json({ error: '入力が不正です' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const isGood = entry_type === 'good';

    if (isGood) {
      const response = await getGoodAIResponse(userInput);

      await supabase.from('conversations').insert({
        user_id: user.id,
        user_input: userInput,
        empathy: response.message,
        alternatives: [],
        insight: '',
        tip: '',
        child_id: providedChildId ?? null,
        entry_type: 'good',
      });

      return NextResponse.json({ message: response.message });
    }

    // incident フロー
    const { data: children } = providedChildId
      ? { data: null }
      : await supabase.from('children').select('id, name, birth_year').eq('user_id', user.id);

    const childrenForDetection = (!providedChildId && children && children.length > 0)
      ? children
      : undefined;

    const response = await getAIResponse(userInput, childrenForDetection);

    let child_id: string | null = providedChildId ?? null;
    if (!child_id && response.detected_child_name && children) {
      const detected = response.detected_child_name.toLowerCase();
      const matched = children.find(c =>
        c.name.toLowerCase().includes(detected) || detected.includes(c.name.toLowerCase())
      );
      if (matched) child_id = matched.id;
    }

    await supabase.from('conversations').insert({
      user_id: user.id,
      user_input: userInput,
      empathy: response.empathy,
      alternatives: response.alternatives,
      insight: response.insight,
      tip: response.tip,
      child_id,
      entry_type: 'incident',
    });

    return NextResponse.json({
      empathy: response.empathy,
      alternatives: response.alternatives,
      insight: response.insight,
      tip: response.tip,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'AI応答の取得に失敗しました' }, { status: 500 });
  }
}

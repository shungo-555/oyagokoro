import { NextRequest, NextResponse } from 'next/server';
import { getChildTrendComment } from '@/lib/gemini';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get('child_id');
    if (!childId) return NextResponse.json({ error: 'child_id が必要です' }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { data: conversations } = await supabase
      .from('conversations')
      .select('insight, entry_type')
      .eq('user_id', user.id)
      .eq('child_id', childId)
      .eq('entry_type', 'incident')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ trend: '' });
    }

    const insights = conversations
      .map(c => c.insight as string)
      .filter(Boolean);

    if (insights.length === 0) return NextResponse.json({ trend: '' });

    const result = await getChildTrendComment(insights);
    return NextResponse.json(result);
  } catch (error) {
    console.error('child-trend API error:', error);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

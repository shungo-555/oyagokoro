import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: '履歴の取得に失敗しました' }, { status: 500 });
  }
}

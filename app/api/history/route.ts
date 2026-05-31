import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const supabase = getSupabaseAdmin();
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

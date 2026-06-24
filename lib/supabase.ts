import { createBrowserClient } from '@supabase/ssr';

export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  user_input: string;
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
  category: string | null;
  child_id: string | null;
  entry_type: 'incident' | 'good';
  created_at: string;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

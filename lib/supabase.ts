import { createClient } from '@supabase/supabase-js';

export interface Conversation {
  id: string;
  user_input: string;
  empathy: string;
  alternatives: string[];
  insight: string;
  tip: string;
  category: string;
  created_at: string;
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

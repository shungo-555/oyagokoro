import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // SUPABASE_ANON_KEY（Vercel-Supabase 連携で確実に設定される）を
    // ブラウザ向けに公開する
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  },
};

export default nextConfig;

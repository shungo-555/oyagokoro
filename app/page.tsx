import ClientApp from '@/components/ClientApp'

export default function Page() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  return <ClientApp supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
}

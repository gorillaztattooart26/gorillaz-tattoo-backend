import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).',
  )
}

/**
 * Shared Supabase client, built on the public anon key so it's safe to
 * import from Server Components, Server Actions, and Client Components
 * alike — access is governed entirely by Row Level Security policies on
 * the Supabase project, not by anything in this file. No auth/session
 * handling is wired up yet (per-request cookie sync via @supabase/ssr
 * is the next step once sign-in is actually built).
 *
 * Typed against `Database` (types/supabase.ts) so `.from('inquiries')`
 * etc. are checked at compile time — see that file for how to regenerate
 * it once the Supabase CLI is available.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

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
 * Once a schema exists, run `supabase gen types typescript` and pass the
 * generated `Database` type in here (`createClient<Database>(...)`) for
 * fully typed `.from()` queries — left untyped for now since no tables
 * exist yet.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

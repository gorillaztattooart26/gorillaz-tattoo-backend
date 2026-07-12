import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let cachedClient: SupabaseClient<Database> | null = null

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * ONLY call this from trusted server-to-server code that has no client
 * input in its trust path, e.g. the PayMongo webhook route handler, which
 * authenticates the caller via signature verification before ever touching
 * this client. Never call it from a Server Action a browser can invoke, a
 * Server Component, or anywhere reachable (even indirectly) by a request
 * whose authenticity isn't independently verified first — doing so would
 * let anyone bypass every RLS policy in the project.
 *
 * Deliberately a separate module from lib/supabase.ts (the anon client used
 * everywhere else) so the two can never be confused at the import site.
 *
 * Built lazily (not a module-level `const`) so the missing-env-var check
 * only fires when a request actually needs this client, not whenever this
 * module is merely imported — `next build` imports every route module
 * during page-data collection regardless of whether it's ever hit, and an
 * eager throw there would fail the entire build before the webhook secret
 * even exists (it can't, until this is deployed and registered with
 * PayMongo).
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role secret) in ' +
        '.env.local (see .env.example). Never expose SUPABASE_SERVICE_ROLE_KEY with a ' +
        'NEXT_PUBLIC_ prefix.',
    )
  }

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey)
  return cachedClient
}

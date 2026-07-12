import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Server-side Supabase client for staff auth — Server Components, Server
 * Actions, and Route Handlers. Anon key only; always create a fresh client
 * per request (never share/cache across requests).
 *
 * `rememberMe: false` strips `maxAge`/`expires` from any cookie this client
 * writes, turning the session cookie into a browser-session-only cookie
 * (cleared when the browser closes) instead of Supabase's normal persistent
 * expiry. Only `loginAction` (app/staff/actions.ts) ever needs this — every
 * other caller should call `createClient()` with no arguments.
 */
export async function createClient(options?: { rememberMe?: boolean }) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).',
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            const finalOptions =
              options?.rememberMe === false
                ? { ...cookieOptions, maxAge: undefined, expires: undefined }
                : cookieOptions
            cookieStore.set(name, value, finalOptions)
          })
        } catch {
          // Called from a Server Component during render, where `cookies()`
          // is read-only. Safe to ignore — middleware refreshes the session
          // on every /staff/* request, so cookies stay in sync regardless.
        }
      },
    },
  })
}

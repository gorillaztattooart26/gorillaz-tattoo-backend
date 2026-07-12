import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Pages under /staff/* reachable without an active session. */
const PUBLIC_STAFF_PAGES = [
  '/staff/login',
  '/staff/forgot-password',
  '/staff/reset-password',
  '/staff/auth/confirm',
]

/**
 * Runs on every /staff/* request (see middleware.ts's matcher). Refreshes
 * the Supabase session (via `getUser()`, which validates against the Auth
 * server rather than trusting the cookie blindly) and redirects based on
 * auth state. The request/response cookie dance below is the standard
 * Supabase SSR pattern — refreshed cookies must be written to both the
 * outgoing request (so this request's own downstream rendering sees them)
 * and the response (so the browser gets them); skipping either half causes
 * sessions to silently break after the access token's ~1hr expiry.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).',
    )
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicStaffPage = PUBLIC_STAFF_PAGES.includes(pathname)

  if (!user && !isPublicStaffPage) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/staff/login'
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublicStaffPage) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/staff/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

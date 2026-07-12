import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Landing point for Supabase's password-recovery email link. Supabase's
 * own hosted verify endpoint validates the emailed token first, then
 * redirects here with a PKCE `code` (this is what `resetPasswordForEmail`'s
 * `redirectTo` in app/staff/actions.ts points at) — this route exchanges
 * that code for an active (recovery) session, writing the session cookie
 * via the server client, then hands off to the actual "set a new password"
 * form. /staff/reset-password can't do this exchange itself since by the
 * time a page component renders, it's too late to reliably write cookies
 * for a code that arrived on this same request.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/staff/reset-password`)
    }
  }

  return NextResponse.redirect(`${origin}/staff/login`)
}

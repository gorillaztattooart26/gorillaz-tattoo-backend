import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/staff/LoginForm'

export const metadata: Metadata = {
  title: 'Staff Login | Gorillaz Tattoo Art',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

/**
 * Middleware already redirects an authenticated user away from this page,
 * but that only runs on navigation — this check covers the case where the
 * page is server-rendered directly (e.g. a hard refresh) and is a second,
 * cheap layer of the same guarantee.
 */
export default async function StaffLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/staff/dashboard')
  }

  return <LoginForm />
}

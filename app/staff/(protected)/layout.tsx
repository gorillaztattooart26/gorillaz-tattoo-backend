import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffNav } from '@/components/staff/StaffNav'

/**
 * Shell for every authenticated staff page (Dashboard, Inquiries, Bookings,
 * Payments, Gallery, Artists, Settings). Middleware (lib/supabase/
 * middleware.ts) already redirects unauthenticated requests away before
 * they reach here, but a Server Component layout shouldn't assume a
 * guarantee it can't verify itself — this re-checks and redirects as a
 * second, defense-in-depth layer.
 */
export default async function ProtectedStaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/staff/login')
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <StaffNav userEmail={user.email ?? ''} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

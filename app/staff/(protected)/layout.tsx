import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

/**
 * Shell for every authenticated staff page (Dashboard, Inquiries, Bookings,
 * Payments, Portfolio, Artists, Settings). Middleware (lib/supabase/
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

  const artist = await getCurrentStaffArtist()

  return (
    <div className="flex min-h-screen w-full">
      <StaffSidebar userEmail={user.email ?? ''} isOwner={artist?.is_owner ?? false} />
      <main className="min-w-0 flex-1 pl-16">{children}</main>
    </div>
  )
}

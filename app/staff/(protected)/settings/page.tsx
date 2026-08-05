import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { ChangePasswordForm } from '@/components/staff/ChangePasswordForm'

export const metadata: Metadata = {
  title: 'Settings | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/staff/login')
  }

  const artist = await getCurrentStaffArtist()

  return (
    <div>
      <StaffPageHeader title="Settings" description="Manage your account." />
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Account</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--foreground)]/50">Email</dt>
              <dd className="text-[var(--foreground)]">{user.email}</dd>
            </div>
            {artist && (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--foreground)]/50">Artist profile</dt>
                <dd className="capitalize text-[var(--foreground)]">{artist.name}</dd>
              </div>
            )}
          </dl>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  )
}

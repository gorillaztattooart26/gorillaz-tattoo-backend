import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { MaintenanceActionCard } from '@/components/staff/MaintenanceActionCard'
import { ClearTestDataPanel } from '@/components/staff/ClearTestDataPanel'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import {
  archiveOldCompletedBookingsAction,
  deleteOldArchivedInquiriesAction,
  deleteOldArchivedBookingsAction,
  deleteOldArchivedPendingPaymentsAction,
} from '@/app/staff/(protected)/system/actions'

export const metadata: Metadata = {
  title: 'System | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

/**
 * Owner-only "Database Maintenance" + "Data Management" tools. This is the
 * first page in the staff dashboard gated by a page-level redirect rather
 * than a conditional in-page section (the pattern gallery/page.tsx uses
 * for its owner-only homepage-media manager) — appropriate here since,
 * unlike Gallery, there is no non-owner-facing content on this page at
 * all; every Server Action it calls independently re-checks requireOwner()
 * regardless (see system/actions.ts), so this redirect is a UX nicety on
 * top of a real server-side guard, not a replacement for one.
 */
export default async function StaffSystemPage() {
  const artist = await getCurrentStaffArtist()

  if (!artist || !artist.is_owner) {
    redirect('/staff/dashboard')
  }

  return (
    <div>
      <StaffPageHeader title="System" description="Owner-only database maintenance and data management tools." />

      <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
        <section>
          <h2 className="hero-title text-lg font-medium text-[var(--foreground)]">Database Maintenance</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Bulk archive/delete jobs for old records. Each one requires confirmation and only ever touches Bookings,
            Inquiries, and Payments.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MaintenanceActionCard
              title="Archive completed bookings"
              description="Archives every completed booking with an appointment date older than the threshold. Payments and reference images are untouched."
              actionLabel="archive"
              confirmMessage={(months) => `Archive every completed booking older than ${months} month(s)?`}
              onRun={archiveOldCompletedBookingsAction}
              formatResult={(count) => `${count} booking(s) archived.`}
            />
            <MaintenanceActionCard
              title="Delete archived inquiries"
              description="Permanently deletes archived inquiries (and their reference images) older than the threshold."
              actionLabel="delete"
              confirmMessage={(months) => `Permanently delete archived inquiries older than ${months} month(s)? This can't be undone.`}
              onRun={deleteOldArchivedInquiriesAction}
              formatResult={(count) => `${count} inquiry(ies) permanently deleted.`}
            />
            <MaintenanceActionCard
              title="Delete archived bookings"
              description="Permanently deletes archived bookings (and their reference images) older than the threshold. Skips any booking that still has payment records."
              actionLabel="delete"
              confirmMessage={(months) => `Permanently delete archived bookings older than ${months} month(s)? This can't be undone.`}
              onRun={deleteOldArchivedBookingsAction}
              formatResult={(result) =>
                `${result.deleted} booking(s) permanently deleted.${
                  result.skippedHasPayments > 0 ? ` ${result.skippedHasPayments} skipped (has payment records).` : ''
                }`
              }
            />
            <MaintenanceActionCard
              title="Delete archived pending payments"
              description="Permanently deletes archived pending/failed payments older than the threshold. Paid and refunded payments are never deleted here."
              actionLabel="delete"
              confirmMessage={(months) => `Permanently delete archived pending/failed payments older than ${months} month(s)? This can't be undone.`}
              onRun={deleteOldArchivedPendingPaymentsAction}
              formatResult={(count) => `${count} payment(s) permanently deleted.`}
            />
          </div>
        </section>

        <section>
          <h2 className="hero-title text-lg font-medium text-[var(--foreground)]">Data Management</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Pre-launch test-data cleanup.</p>

          <div className="mt-4">
            <ClearTestDataPanel />
          </div>
        </section>
      </div>
    </div>
  )
}

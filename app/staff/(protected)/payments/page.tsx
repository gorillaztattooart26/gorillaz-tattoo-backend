import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { ArchiveViewTabs } from '@/components/staff/ArchiveViewTabs'
import { PaymentsDataTable } from '@/components/staff/PaymentsDataTable'
import { getPaymentsForStaffArtist } from '@/lib/staff/payments'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const metadata: Metadata = {
  title: 'Payments | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Payments"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can see payments."
        icon={CreditCard}
      />
    )
  }

  const { view: viewParam } = await searchParams
  const view = viewParam === 'archived' && artist.is_owner ? 'archived' : 'active'

  const [activePayments, archivedPayments] = await Promise.all([
    getPaymentsForStaffArtist(artist, 'active'),
    artist.is_owner ? getPaymentsForStaffArtist(artist, 'archived') : Promise.resolve([]),
  ])

  const payments = view === 'archived' ? archivedPayments : activePayments

  return (
    <div>
      <StaffPageHeader
        title="Payments"
        description={
          artist.is_owner
            ? `${activePayments.length} total — every artist's payments`
            : `${activePayments.length} total — payments for bookings assigned to you`
        }
      />

      <div className="px-4 py-6 md:px-8">
        {artist.is_owner && (
          <div className="mb-4">
            <ArchiveViewTabs
              basePath="/staff/payments"
              view={view}
              activeCount={activePayments.length}
              archivedCount={archivedPayments.length}
            />
          </div>
        )}

        <PaymentsDataTable payments={payments} isOwner={artist.is_owner} view={view} />
      </div>
    </div>
  )
}

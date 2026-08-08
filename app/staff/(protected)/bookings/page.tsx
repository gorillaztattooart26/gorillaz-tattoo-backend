import type { Metadata } from 'next'
import { CalendarCheck } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { ArchiveViewTabs } from '@/components/staff/ArchiveViewTabs'
import { BookingsDataTable } from '@/components/staff/BookingsDataTable'
import { getBookingsForStaffArtist } from '@/lib/staff/bookings'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { getBaseUrl } from '@/lib/url'

export const metadata: Metadata = {
  title: 'Bookings | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Bookings"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can see bookings."
        icon={CalendarCheck}
      />
    )
  }

  const { view: viewParam } = await searchParams
  const view = viewParam === 'archived' && artist.is_owner ? 'archived' : 'active'

  const [activeBookings, archivedBookings, baseUrl] = await Promise.all([
    getBookingsForStaffArtist(artist, 'active'),
    artist.is_owner ? getBookingsForStaffArtist(artist, 'archived') : Promise.resolve([]),
    getBaseUrl(),
  ])

  const bookings = view === 'archived' ? archivedBookings : activeBookings

  return (
    <div>
      <StaffPageHeader
        title="Bookings"
        description={
          artist.is_owner
            ? `${activeBookings.length} total — every artist's bookings`
            : `${activeBookings.length} total — bookings assigned to you`
        }
      />

      <div className="px-4 py-6 md:px-8">
        {artist.is_owner && (
          <div className="mb-4">
            <ArchiveViewTabs
              basePath="/staff/bookings"
              view={view}
              activeCount={activeBookings.length}
              archivedCount={archivedBookings.length}
            />
          </div>
        )}

        <BookingsDataTable bookings={bookings} baseUrl={baseUrl} isOwner={artist.is_owner} view={view} />
      </div>
    </div>
  )
}

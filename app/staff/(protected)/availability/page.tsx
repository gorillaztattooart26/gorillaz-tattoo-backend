import type { Metadata } from 'next'
import { CalendarOff } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { AvailabilityDataTable } from '@/components/staff/AvailabilityDataTable'
import { getAvailabilityBlocksForStaffArtist } from '@/lib/staff/availability'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const metadata: Metadata = {
  title: 'Availability | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

/**
 * Stage 2A — read-only. Staff can see existing availability blocks; there
 * is no create/edit/delete UI yet (that's Stage 2B/2C), so unlike
 * app/staff/(protected)/bookings/page.tsx this page needs no Server
 * Actions, no archive/view toggle, and no baseUrl.
 */
export default async function StaffAvailabilityPage() {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Availability"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can see availability blocks."
        icon={CalendarOff}
      />
    )
  }

  const blocks = await getAvailabilityBlocksForStaffArtist(artist)

  return (
    <div>
      <StaffPageHeader
        title="Availability"
        description={
          artist.is_owner
            ? `${blocks.length} total — every artist's blocked periods`
            : `${blocks.length} total — periods you're marked unavailable`
        }
      />

      <div className="px-4 py-6 md:px-8">
        <AvailabilityDataTable blocks={blocks} isOwner={artist.is_owner} />
      </div>
    </div>
  )
}

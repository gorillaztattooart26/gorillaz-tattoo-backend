import type { Metadata } from 'next'
import { CalendarOff } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { AvailabilityDataTable } from '@/components/staff/AvailabilityDataTable'
import { AvailabilityBlockDialog } from '@/components/staff/AvailabilityBlockDialog'
import { getAvailabilityBlocksForStaffArtist } from '@/lib/staff/availability'
import { getCurrentStaffArtist, getAllArtistsForStaff } from '@/lib/staff/artists'

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
 * Stage 2A added the read-only list; Stage 2B adds "Block Time" (create
 * only — edit/delete are still Stage 2C). No archive/view toggle and no
 * baseUrl are needed here, unlike app/staff/(protected)/bookings/page.tsx.
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

  // Only the owner's form needs the full artist list (the artist selector) —
  // a non-owner's dialog never renders or submits an artist field at all.
  const [blocks, artists] = await Promise.all([
    getAvailabilityBlocksForStaffArtist(artist),
    artist.is_owner ? getAllArtistsForStaff() : Promise.resolve([]),
  ])

  return (
    <div>
      <StaffPageHeader
        title="Availability"
        description={
          artist.is_owner
            ? `${blocks.length} total — every artist's blocked periods`
            : `${blocks.length} total — periods you're marked unavailable`
        }
        action={<AvailabilityBlockDialog isOwner={artist.is_owner} artists={artists} />}
      />

      <div className="px-4 py-6 md:px-8">
        <AvailabilityDataTable blocks={blocks} isOwner={artist.is_owner} />
      </div>
    </div>
  )
}

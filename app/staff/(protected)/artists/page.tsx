import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { ArtistProfileForm } from '@/components/staff/ArtistProfileForm'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const metadata: Metadata = {
  title: 'Artists | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffArtistsPage() {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Artists"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it."
        icon={Users}
      />
    )
  }

  return (
    <div>
      <StaffPageHeader title="My Profile" description="Edits here update your public artist page on the homepage." />
      <div className="px-4 py-6 md:px-8">
        <ArtistProfileForm artist={artist} />
      </div>
    </div>
  )
}

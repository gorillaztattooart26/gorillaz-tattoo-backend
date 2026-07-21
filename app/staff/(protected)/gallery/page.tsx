import type { Metadata } from 'next'
import { Image as ImageIcon } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { GalleryManager } from '@/components/staff/GalleryManager'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { getStaffGalleryItems } from '@/lib/staff/gallery'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const metadata: Metadata = {
  title: 'Gallery | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffGalleryPage() {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Gallery"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can manage your gallery."
        icon={ImageIcon}
      />
    )
  }

  const items = await getStaffGalleryItems(artist.name)

  return (
    <div>
      <StaffPageHeader
        title={`${artist.name}'s Gallery`}
        description={`${items.length} pieces live on the public site`}
      />
      <div className="px-4 py-6 md:px-8">
        <GalleryManager items={items} />
      </div>
    </div>
  )
}

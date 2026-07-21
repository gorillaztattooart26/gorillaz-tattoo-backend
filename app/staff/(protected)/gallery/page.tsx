import type { Metadata } from 'next'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { GalleryManager } from '@/components/staff/GalleryManager'
import { getStaffGalleryItems } from '@/lib/staff/gallery'
import { getArtists } from '@/lib/artists'

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
  const [items, artists] = await Promise.all([getStaffGalleryItems(), getArtists()])

  return (
    <div>
      <StaffPageHeader title="Gallery" description={`${items.length} pieces live on the public site`} />
      <div className="px-4 py-6 md:px-8">
        <GalleryManager items={items} artists={artists} />
      </div>
    </div>
  )
}

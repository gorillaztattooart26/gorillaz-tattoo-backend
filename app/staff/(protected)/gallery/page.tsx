import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Gallery | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffGalleryPage() {
  return (
    <PlaceholderSection
      title="Gallery"
      description="Managing the public portfolio/gallery images from here is coming soon."
    />
  )
}

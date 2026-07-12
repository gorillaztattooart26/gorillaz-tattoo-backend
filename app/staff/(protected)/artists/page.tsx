import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Artists | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffArtistsPage() {
  return (
    <PlaceholderSection
      title="Artists"
      description="Managing the artist roster from this dashboard is coming soon."
    />
  )
}

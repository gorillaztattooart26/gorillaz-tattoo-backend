import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Inquiries | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffInquiriesPage() {
  return (
    <PlaceholderSection
      title="Inquiries"
      description="Reviewing and responding to customer inquiries is coming soon."
    />
  )
}

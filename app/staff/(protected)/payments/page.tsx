import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Payments | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffPaymentsPage() {
  return (
    <PlaceholderSection
      title="Payments"
      description="Tracking down payments and balances from this dashboard is coming soon."
    />
  )
}

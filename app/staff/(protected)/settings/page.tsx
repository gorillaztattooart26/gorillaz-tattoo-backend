import type { Metadata } from 'next'
import { Settings as SettingsIcon } from 'lucide-react'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Settings | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffSettingsPage() {
  return (
    <PlaceholderSection
      title="Settings"
      description="Studio settings are coming soon."
      icon={SettingsIcon}
    />
  )
}

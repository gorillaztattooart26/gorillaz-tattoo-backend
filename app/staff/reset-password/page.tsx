import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/staff/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Password | Gorillaz Tattoo Art',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffResetPasswordPage() {
  return <ResetPasswordForm />
}

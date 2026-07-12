import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/staff/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password | Gorillaz Tattoo Art',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffForgotPasswordPage() {
  return <ForgotPasswordForm />
}

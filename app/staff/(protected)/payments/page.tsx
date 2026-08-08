import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { getPaymentsForStaffArtist } from '@/lib/staff/payments'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { formatCurrency, formatDate } from '@/lib/staff/format'

export const metadata: Metadata = {
  title: 'Payments | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffPaymentsPage() {
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Payments"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can see payments."
        icon={CreditCard}
      />
    )
  }

  const payments = await getPaymentsForStaffArtist(artist)

  return (
    <div>
      <StaffPageHeader
        title="Payments"
        description={
          artist.is_owner
            ? `${payments.length} total — every artist's payments`
            : `${payments.length} total — payments for bookings assigned to you`
        }
      />

      <div className="px-4 py-6 md:px-8">
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
                <th scope="col" className="px-5 py-3 font-medium">Booking</th>
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="px-5 py-3 font-medium">Amount</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Method</th>
                <th scope="col" className="px-5 py-3 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--foreground)]/5">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                    No payments yet.
                  </td>
                </tr>
              )}
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4 font-medium text-[var(--foreground)]">{payment.bookingRef}</td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">{payment.customerName}</td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-5 py-4 capitalize text-[var(--foreground)]/70">{payment.method ?? '—'}</td>
                  <td className="px-5 py-4 text-[var(--foreground)]/40">
                    {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

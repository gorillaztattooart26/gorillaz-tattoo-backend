import type { Metadata } from 'next'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { getPayments } from '@/lib/staff/payments'
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
  const payments = await getPayments()

  return (
    <div>
      <StaffPageHeader title="Payments" description={`${payments.length} total`} />

      <div className="px-8 py-6">
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-5 py-3 font-medium">Booking</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                    No payments yet.
                  </td>
                </tr>
              )}
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4 font-medium text-white">{payment.bookingRef}</td>
                  <td className="px-5 py-4 text-white/70">{payment.customerName}</td>
                  <td className="px-5 py-4 text-white/70">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-5 py-4 capitalize text-white/70">{payment.method ?? '—'}</td>
                  <td className="px-5 py-4 text-white/40">
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

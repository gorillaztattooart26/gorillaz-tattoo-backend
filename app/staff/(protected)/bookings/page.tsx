import type { Metadata } from 'next'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { getBookings } from '@/lib/staff/bookings'
import { formatCurrency, formatDate } from '@/lib/staff/format'

export const metadata: Metadata = {
  title: 'Bookings | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffBookingsPage() {
  const bookings = await getBookings()

  return (
    <div>
      <StaffPageHeader title="Bookings" description={`${bookings.length} total`} />

      <div className="px-4 py-6 md:px-8">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-900/60 md:rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Artist</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Appointment</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Down Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-white/40">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{booking.customerName}</p>
                    <p className="text-xs text-white/40">{booking.bookingId}</p>
                  </td>
                  <td className="px-5 py-4 capitalize text-white/70">{booking.artistName}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-5 py-4 text-white/70">
                    {formatDate(booking.appointmentDate)}
                    <span className="ml-1 text-xs text-white/40">{booking.appointmentTime}</span>
                  </td>
                  <td className="px-5 py-4 text-white/70">
                    {formatCurrency(booking.estimatedPrice, booking.currency)}
                  </td>
                  <td className="px-5 py-4 text-white/70">
                    {formatCurrency(booking.downPaymentAmount, booking.currency)}
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

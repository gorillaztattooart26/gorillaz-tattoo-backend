import type { Metadata } from 'next'
import { CalendarCheck } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { CopyBookingLink } from '@/components/staff/CopyBookingLink'
import { BookingActionsMenu } from '@/components/staff/BookingActionsMenu'
import { getBookingsForStaffArtist } from '@/lib/staff/bookings'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { formatCurrency, formatDate } from '@/lib/staff/format'
import { getBaseUrl } from '@/lib/url'

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
  const artist = await getCurrentStaffArtist()

  if (!artist) {
    return (
      <PlaceholderSection
        title="Bookings"
        description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can see bookings."
        icon={CalendarCheck}
      />
    )
  }

  const [bookings, baseUrl] = await Promise.all([getBookingsForStaffArtist(artist), getBaseUrl()])

  return (
    <div>
      <StaffPageHeader
        title="Bookings"
        description={
          artist.is_owner
            ? `${bookings.length} total — every artist's bookings`
            : `${bookings.length} total — bookings assigned to you`
        }
      />

      <div className="px-4 py-6 md:px-8">
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="px-5 py-3 font-medium">Artist</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Appointment</th>
                <th scope="col" className="px-5 py-3 font-medium">Price</th>
                <th scope="col" className="px-5 py-3 font-medium">Down Payment</th>
                <th scope="col" className="px-5 py-3 font-medium">Booking Link</th>
                <th scope="col" className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--foreground)]/5">
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[var(--foreground)]">{booking.customerName}</p>
                    <p className="text-xs text-[var(--foreground)]/40">{booking.bookingId}</p>
                  </td>
                  <td className="px-5 py-4 capitalize text-[var(--foreground)]/70">{booking.artistName}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">
                    {formatDate(booking.appointmentDate)}
                    <span className="ml-1 text-xs text-[var(--foreground)]/40">{booking.appointmentTime}</span>
                  </td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">
                    {formatCurrency(booking.estimatedPrice, booking.currency)}
                  </td>
                  <td className="px-5 py-4 text-[var(--foreground)]/70">
                    {formatCurrency(booking.downPaymentAmount, booking.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <CopyBookingLink url={`${baseUrl}/booking/${booking.token}`} />
                  </td>
                  <td className="px-5 py-4">
                    <BookingActionsMenu booking={booking} />
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

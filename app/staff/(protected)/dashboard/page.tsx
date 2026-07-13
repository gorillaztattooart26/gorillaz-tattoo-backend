import type { Metadata } from 'next'
import Link from 'next/link'
import { Inbox, CalendarCheck, CreditCard, CheckCircle2 } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { StatCard } from '@/components/staff/StatCard'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { createClient } from '@/lib/supabase/server'
import { getInquiryCount, getRecentInquiries } from '@/lib/staff/inquiries'
import { getBookingCounts, getRecentBookings } from '@/lib/staff/bookings'
import { getPaymentCounts } from '@/lib/staff/payments'
import { formatCurrency, formatDate } from '@/lib/staff/format'

export const metadata: Metadata = {
  title: 'Dashboard | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [inquiryCount, bookingCounts, paymentCounts, recentInquiries, recentBookings] = await Promise.all([
    getInquiryCount(),
    getBookingCounts(),
    getPaymentCounts(),
    getRecentInquiries(5),
    getRecentBookings(5),
  ])

  const staffName = user?.email?.split('@')[0] ?? 'there'

  return (
    <div>
      <StaffPageHeader
        title={`Welcome back, ${staffName}`}
        description={`${inquiryCount} total inquiries · ${paymentCounts.pending} pending payments · ${bookingCounts.confirmed} confirmed bookings`}
      />

      <div className="grid grid-cols-1 gap-4 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Total Inquiries" value={inquiryCount} />
        <StatCard icon={CalendarCheck} label="Total Bookings" value={bookingCounts.total} />
        <StatCard icon={CreditCard} label="Pending Payments" value={paymentCounts.pending} />
        <StatCard icon={CheckCircle2} label="Confirmed Bookings" value={bookingCounts.confirmed} />
      </div>

      <div className="grid grid-cols-1 gap-4 px-8 pb-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Inquiries</h2>
            <Link href="/staff/inquiries" className="text-xs text-[#fabb42] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-white/5">
            {recentInquiries.length === 0 && (
              <p className="py-6 text-center text-sm text-white/40">No inquiries yet.</p>
            )}
            {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">{inquiry.full_name}</p>
                  <p className="text-xs text-white/50">
                    {inquiry.tattoo_type} · {inquiry.preferred_artist}
                  </p>
                </div>
                <span className="text-xs text-white/40">{formatDate(inquiry.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
          <h2 className="text-base font-semibold text-white">Payment Status</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <StatusBadge status="paid" />
              <span className="text-sm font-semibold text-white">{paymentCounts.paid}</span>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status="pending" />
              <span className="text-sm font-semibold text-white">{paymentCounts.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status="failed" />
              <span className="text-sm font-semibold text-white">{paymentCounts.failed}</span>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status="refunded" />
              <span className="text-sm font-semibold text-white">{paymentCounts.refunded}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-10">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
            <Link href="/staff/bookings" className="text-xs text-[#fabb42] hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Artist</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Appointment</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-white/40">
                      No bookings yet.
                    </td>
                  </tr>
                )}
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{booking.customerName}</p>
                      <p className="text-xs text-white/40">{booking.bookingId}</p>
                    </td>
                    <td className="py-3 pr-4 text-white/70">{booking.artistName}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="py-3 pr-4 text-white/70">{formatDate(booking.appointmentDate)}</td>
                    <td className="py-3 pr-4 text-white/70">
                      {formatCurrency(booking.estimatedPrice, booking.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

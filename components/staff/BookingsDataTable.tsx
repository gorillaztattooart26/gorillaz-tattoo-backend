'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { CopyBookingLink } from '@/components/staff/CopyBookingLink'
import { BookingActionsMenu } from '@/components/staff/BookingActionsMenu'
import { RecordArchiveControls } from '@/components/staff/RecordArchiveControls'
import { BulkActionBar } from '@/components/staff/BulkActionBar'
import { useRowSelection } from '@/hooks/useRowSelection'
import { formatCurrency, formatDate } from '@/lib/staff/format'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StaffBooking } from '@/lib/staff/bookings'
import {
  archiveBookingAction,
  restoreBookingAction,
  deleteBookingAction,
  bulkArchiveBookingsAction,
  bulkRestoreBookingsAction,
  bulkDeleteBookingsAction,
} from '@/app/staff/(protected)/bookings/actions'

interface BookingsDataTableProps {
  bookings: StaffBooking[]
  baseUrl: string
  isOwner: boolean
  view: 'active' | 'archived'
}

/** Mirrors formatAcceptedAt in components/booking/WaiverAndPayment.tsx — same date/time convention shown to the customer. */
function formatWaiverAcceptedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Reuses StatusBadge's pill styling (emerald = confirmed, amber = needs action) since waiver status isn't a booking `status` value. */
function WaiverStatusBadge({ accepted, acceptedAt }: { accepted: boolean; acceptedAt: string | null }) {
  if (accepted) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Badge className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', 'bg-emerald-500/15 text-emerald-300')}>
          Waiver Signed
        </Badge>
        {acceptedAt && <span className="text-xs text-[var(--foreground)]/40">{formatWaiverAcceptedAt(acceptedAt)}</span>}
      </div>
    )
  }
  return (
    <Badge className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', 'bg-amber-500/15 text-amber-300')}>
      Waiver Pending
    </Badge>
  )
}

/**
 * Table body for the Bookings tab — extracted from page.tsx into a Client
 * Component so the bulk-select checkboxes and per-row Archive/Restore/
 * Delete controls can carry interactive state. Non-owners get the exact
 * same table as before this feature (no checkbox column, no archive
 * controls) — only the Owner ever sees the data-management additions,
 * since Archive/Delete/bulk actions are Owner-only.
 */
export function BookingsDataTable({ bookings, baseUrl, isOwner, view }: BookingsDataTableProps) {
  const ids = bookings.map((b) => b.id)
  const selection = useRowSelection(ids)

  const columnCount = isOwner ? 10 : 9

  return (
    <div>
      {isOwner && (
        <BulkActionBar
          count={selection.count}
          view={view}
          itemNoun="booking"
          onArchive={() => bulkArchiveBookingsAction(selection.selectedIds)}
          onRestore={() => bulkRestoreBookingsAction(selection.selectedIds)}
          onDelete={() => bulkDeleteBookingsAction(selection.selectedIds)}
          onDone={selection.clear}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
              {isOwner && (
                <th scope="col" className="w-10 px-5 py-3">
                  <Checkbox
                    checked={selection.allSelected}
                    onCheckedChange={() => selection.toggleAll()}
                    aria-label="Select all bookings"
                  />
                </th>
              )}
              <th scope="col" className="px-5 py-3 font-medium">Customer</th>
              <th scope="col" className="px-5 py-3 font-medium">Artist</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 font-medium">Waiver</th>
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
                <td colSpan={columnCount} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                  {view === 'archived' ? 'No archived bookings.' : 'No bookings yet.'}
                </td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking.id}>
                {isOwner && (
                  <td className="px-5 py-4">
                    <Checkbox
                      checked={selection.isSelected(booking.id)}
                      onCheckedChange={() => selection.toggle(booking.id)}
                      aria-label={`Select ${booking.bookingId}`}
                    />
                  </td>
                )}
                <td className="px-5 py-4">
                  <p className="font-medium text-[var(--foreground)]">{booking.customerName}</p>
                  <p className="text-xs text-[var(--foreground)]/40">{booking.bookingId}</p>
                </td>
                <td className="px-5 py-4 capitalize text-[var(--foreground)]/70">{booking.artistName}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-5 py-4">
                  <WaiverStatusBadge accepted={booking.waiverAccepted} acceptedAt={booking.waiverAcceptedAt} />
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
                  <div className="flex flex-col items-start gap-3">
                    {view === 'active' && <BookingActionsMenu booking={booking} />}
                    {isOwner && (
                      <RecordArchiveControls
                        view={view}
                        itemLabel={booking.bookingId}
                        onArchive={() => archiveBookingAction(booking.id)}
                        onRestore={() => restoreBookingAction(booking.id)}
                        onDelete={() => deleteBookingAction(booking.id)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/staff/StatusBadge'
import { RecordArchiveControls } from '@/components/staff/RecordArchiveControls'
import { BulkActionBar } from '@/components/staff/BulkActionBar'
import { useRowSelection } from '@/hooks/useRowSelection'
import { formatCurrency, formatDate } from '@/lib/staff/format'
import type { StaffPayment } from '@/lib/staff/payments'
import {
  archivePaymentAction,
  restorePaymentAction,
  deletePaymentAction,
  bulkArchivePaymentsAction,
  bulkRestorePaymentsAction,
  bulkDeletePaymentsAction,
} from '@/app/staff/(protected)/payments/actions'

interface PaymentsDataTableProps {
  payments: StaffPayment[]
  isOwner: boolean
  view: 'active' | 'archived'
}

/** Table body for the Payments tab — extracted from page.tsx so bulk-select and per-row Archive/Restore/Delete can carry client state. Non-owners see the exact same table as before this feature. */
export function PaymentsDataTable({ payments, isOwner, view }: PaymentsDataTableProps) {
  const ids = payments.map((p) => p.id)
  const selection = useRowSelection(ids)

  const columnCount = isOwner ? 8 : 6

  return (
    <div>
      {isOwner && (
        <BulkActionBar
          count={selection.count}
          view={view}
          itemNoun="payment"
          onArchive={() => bulkArchivePaymentsAction(selection.selectedIds)}
          onRestore={() => bulkRestorePaymentsAction(selection.selectedIds)}
          onDelete={() => bulkDeletePaymentsAction(selection.selectedIds)}
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
                    aria-label="Select all payments"
                  />
                </th>
              )}
              <th scope="col" className="px-5 py-3 font-medium">Booking</th>
              <th scope="col" className="px-5 py-3 font-medium">Customer</th>
              <th scope="col" className="px-5 py-3 font-medium">Amount</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 font-medium">Method</th>
              <th scope="col" className="px-5 py-3 font-medium">Paid</th>
              {isOwner && <th scope="col" className="px-5 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--foreground)]/5">
            {payments.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                  {view === 'archived' ? 'No archived payments.' : 'No payments yet.'}
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr key={payment.id}>
                {isOwner && (
                  <td className="px-5 py-4">
                    <Checkbox
                      checked={selection.isSelected(payment.id)}
                      onCheckedChange={() => selection.toggle(payment.id)}
                      aria-label={`Select payment for ${payment.bookingRef}`}
                    />
                  </td>
                )}
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
                {isOwner && (
                  <td className="px-5 py-4">
                    <RecordArchiveControls
                      view={view}
                      itemLabel={`this payment for ${payment.bookingRef}`}
                      onArchive={() => archivePaymentAction(payment.id)}
                      onRestore={() => restorePaymentAction(payment.id)}
                      onDelete={() => deletePaymentAction(payment.id)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

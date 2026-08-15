'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { InquiryDetailButton } from '@/components/staff/InquiryDetailButton'
import { RecordArchiveControls } from '@/components/staff/RecordArchiveControls'
import { RowActionsMenu } from '@/components/staff/RowActionsMenu'
import { BulkActionBar } from '@/components/staff/BulkActionBar'
import { useRowSelection } from '@/hooks/useRowSelection'
import { formatDate } from '@/lib/staff/format'
import type { StaffInquiry } from '@/lib/staff/inquiries'
import {
  archiveInquiryAction,
  restoreInquiryAction,
  deleteInquiryAction,
  bulkArchiveInquiriesAction,
  bulkRestoreInquiriesAction,
  bulkDeleteInquiriesAction,
} from '@/app/staff/(protected)/inquiries/actions'

interface InquiriesDataTableProps {
  inquiries: StaffInquiry[]
  isOwner: boolean
  view: 'active' | 'archived'
}

/** Table body for the Inquiries tab — extracted from page.tsx so bulk-select and per-row Archive/Restore/Delete can carry client state. Non-owners see the exact same table as before this feature. */
export function InquiriesDataTable({ inquiries, isOwner, view }: InquiriesDataTableProps) {
  const ids = inquiries.map((i) => i.id)
  const selection = useRowSelection(ids)

  const columnCount = isOwner ? 13 : 12

  return (
    <div>
      {isOwner && (
        <BulkActionBar
          count={selection.count}
          view={view}
          itemNoun="inquiry"
          onArchive={() => bulkArchiveInquiriesAction(selection.selectedIds)}
          onRestore={() => bulkRestoreInquiriesAction(selection.selectedIds)}
          onDelete={() => bulkDeleteInquiriesAction(selection.selectedIds)}
          onDone={selection.clear}
        />
      )}

      <div className="relative overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
              {isOwner && (
                <th scope="col" className="w-10 px-5 py-3">
                  <Checkbox
                    checked={selection.allSelected}
                    onCheckedChange={() => selection.toggleAll()}
                    aria-label="Select all inquiries"
                  />
                </th>
              )}
              <th scope="col" className="min-w-[110px] px-5 py-3 font-medium">Actions</th>
              <th scope="col" className="min-w-[150px] px-5 py-3 font-medium">Name</th>
              <th scope="col" className="min-w-[190px] px-5 py-3 font-medium">Contact</th>
              <th scope="col" className="min-w-[120px] px-5 py-3 font-medium">Artist</th>
              <th scope="col" className="min-w-[110px] px-5 py-3 font-medium">Style</th>
              <th scope="col" className="min-w-[110px] px-5 py-3 font-medium">Placement</th>
              <th scope="col" className="min-w-[90px] px-5 py-3 font-medium">Size</th>
              <th scope="col" className="min-w-[80px] px-5 py-3 font-medium">Height</th>
              <th scope="col" className="min-w-[80px] px-5 py-3 font-medium">Weight</th>
              <th scope="col" className="min-w-[240px] px-5 py-3 font-medium">Description</th>
              <th scope="col" className="min-w-[130px] px-5 py-3 font-medium">Reference</th>
              <th scope="col" className="min-w-[110px] px-5 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--foreground)]/5">
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                  {view === 'archived' ? 'No archived inquiries.' : 'No inquiries yet.'}
                </td>
              </tr>
            )}
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                {isOwner && (
                  <td className="px-5 py-4 align-top">
                    <Checkbox
                      checked={selection.isSelected(inquiry.id)}
                      onCheckedChange={() => selection.toggle(inquiry.id)}
                      aria-label={`Select inquiry from ${inquiry.full_name}`}
                    />
                  </td>
                )}
                <td className="px-5 py-4 align-top">
                  <RowActionsMenu label={`Actions for the inquiry from ${inquiry.full_name}`}>
                    <InquiryDetailButton inquiry={inquiry} />
                    {view === 'active' && (
                      <Link
                        href={`/staff/create-booking?fromInquiry=${inquiry.id}`}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
                      >
                        convert to booking
                      </Link>
                    )}
                    {isOwner && (
                      <RecordArchiveControls
                        view={view}
                        itemLabel={`the inquiry from ${inquiry.full_name}`}
                        onArchive={() => archiveInquiryAction(inquiry.id)}
                        onRestore={() => restoreInquiryAction(inquiry.id)}
                        onDelete={() => deleteInquiryAction(inquiry.id)}
                      />
                    )}
                  </RowActionsMenu>
                </td>
                <td className="px-5 py-4 align-top break-words font-medium leading-relaxed text-[var(--foreground)]">{inquiry.full_name}</td>
                <td className="px-5 py-4 align-top break-words leading-relaxed text-[var(--foreground)]/70">
                  <p className="break-all">{inquiry.email}</p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/40">{inquiry.phone}</p>
                </td>
                <td className="px-5 py-4 align-top break-words capitalize leading-relaxed text-[var(--foreground)]/70">{inquiry.preferred_artist}</td>
                <td className="px-5 py-4 align-top break-words capitalize leading-relaxed text-[var(--foreground)]/70">{inquiry.tattoo_type}</td>
                <td className="px-5 py-4 align-top break-words leading-relaxed text-[var(--foreground)]/70">{inquiry.placement}</td>
                <td className="px-5 py-4 align-top break-words leading-relaxed text-[var(--foreground)]/70">{inquiry.size}</td>
                <td className="px-5 py-4 align-top leading-relaxed text-[var(--foreground)]/70">{inquiry.height || '—'}</td>
                <td className="px-5 py-4 align-top leading-relaxed text-[var(--foreground)]/70">{inquiry.weight || '—'}</td>
                <td className="px-5 py-4 align-top text-[var(--foreground)]/70">
                  <p className="w-64 max-w-full whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--background)]/20 px-3 py-2 leading-relaxed">
                    {inquiry.message}
                  </p>
                </td>
                <td className="px-5 py-4 align-top">
                  {inquiry.images.length === 0 ? (
                    <span className="text-xs text-[var(--foreground)]/30">none</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {inquiry.images.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border)] transition-opacity hover:opacity-80"
                        >
                          <Image
                            src={url}
                            alt={`Reference image ${index + 1} of ${inquiry.images.length} from ${inquiry.full_name}`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 align-top text-[var(--foreground)]/40">{formatDate(inquiry.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--foreground)]/30 md:hidden">
        <span aria-hidden>↔</span> Scroll sideways to see every column
      </p>
    </div>
  )
}

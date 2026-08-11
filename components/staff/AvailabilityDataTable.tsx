import type { StaffAvailabilityBlock } from '@/lib/staff/availability'
import { AvailabilityBlockDeleteButton } from '@/components/staff/AvailabilityBlockDeleteButton'

const MANILA_TIME_ZONE = 'Asia/Manila'

/**
 * `starts_at`/`ends_at` are stored as UTC `timestamptz` instants (Stage 1)
 * — every formatter below passes an explicit `timeZone: 'Asia/Manila'` so
 * the displayed date/time reflects the studio's local time regardless of
 * where this renders (Vercel's server clock, a staff member's browser in
 * another timezone, etc.). Deliberately NOT copying the timezone-less
 * `toLocaleDateString`/`toLocaleString` calls used for `bookings.appointment_date`/
 * `appointment_time` elsewhere in this codebase (e.g. lib/staff/format.ts) —
 * those are naive by design (see the Stage 2 investigation); this feature
 * intentionally introduces the studio's fixed timezone instead.
 */
function formatManilaDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: MANILA_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatManilaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: MANILA_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** en-CA gives a sortable/comparable YYYY-MM-DD string — used only to compare Manila calendar dates, never displayed. */
const manilaDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Whether starts_at and ends_at fall on the same Manila calendar day — decides whether the end date needs repeating. */
function isSameManilaDay(startsAt: string, endsAt: string): boolean {
  return manilaDateKeyFormatter.format(new Date(startsAt)) === manilaDateKeyFormatter.format(new Date(endsAt))
}

/**
 * "Aug 20, 2026 / 10:00 AM – 2:00 PM" for a same-day block, or
 * "Aug 20, 2026 – Aug 25, 2026 / 12:00 AM – 12:00 AM" for a multi-day one
 * — avoids repeating the date unnecessarily, per the Stage 2A spec.
 */
function formatAvailabilityRange(startsAt: string, endsAt: string): { dateLine: string; timeLine: string } {
  const sameDay = isSameManilaDay(startsAt, endsAt)
  return {
    dateLine: sameDay
      ? formatManilaDate(startsAt)
      : `${formatManilaDate(startsAt)} – ${formatManilaDate(endsAt)}`,
    timeLine: `${formatManilaTime(startsAt)} – ${formatManilaTime(endsAt)}`,
  }
}

interface AvailabilityDataTableProps {
  blocks: StaffAvailabilityBlock[]
  isOwner: boolean
}

/**
 * Table for the Availability tab. Stage 2A made this read-only; Stage 2C
 * adds a per-row delete control. The table itself stays a plain Server
 * Component — only AvailabilityBlockDeleteButton is a Client Component,
 * so the interactive surface stays as small as possible.
 */
export function AvailabilityDataTable({ blocks, isOwner }: AvailabilityDataTableProps) {
  const columnCount = (isOwner ? 3 : 2) + 1

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--foreground)]/40">
            {isOwner && <th scope="col" className="px-5 py-3 font-medium">Artist</th>}
            <th scope="col" className="px-5 py-3 font-medium">Date / Time</th>
            <th scope="col" className="px-5 py-3 font-medium">Reason</th>
            <th scope="col" className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--foreground)]/5">
          {blocks.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-5 py-10 text-center text-[var(--foreground)]/40">
                No availability blocks yet.
              </td>
            </tr>
          )}
          {blocks.map((block) => {
            const { dateLine, timeLine } = formatAvailabilityRange(block.startsAt, block.endsAt)
            return (
              <tr key={block.id}>
                {isOwner && (
                  <td className="px-5 py-4 capitalize text-[var(--foreground)]/70">{block.artistName}</td>
                )}
                <td className="px-5 py-4 text-[var(--foreground)]/70">
                  <p className="font-medium text-[var(--foreground)]">{dateLine}</p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/50">{timeLine}</p>
                </td>
                <td className="px-5 py-4 text-[var(--foreground)]/70">{block.reason}</td>
                <td className="px-5 py-4">
                  <AvailabilityBlockDeleteButton blockId={block.id} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

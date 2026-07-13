import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Covers both booking and payment statuses in one place, reusing the
 * exact color convention already established for customers in
 * components/booking/BookingStatus.tsx (amber = needs action, emerald =
 * good/confirmed, red = failed/cancelled, neutral = done/inert).
 */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  awaiting_down_payment: { label: 'Awaiting Down Payment', className: 'bg-[#fabb42] text-black' },
  appointment_confirmed: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-300' },
  completed: { label: 'Completed', className: 'bg-white/10 text-white/70' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-300' },
  pending: { label: 'Pending', className: 'bg-[#fabb42] text-black' },
  paid: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-300' },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-300' },
  refunded: { label: 'Refunded', className: 'bg-white/10 text-white/70' },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-white/10 text-white/70' }
  return (
    <Badge
      className={cn(
        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  )
}

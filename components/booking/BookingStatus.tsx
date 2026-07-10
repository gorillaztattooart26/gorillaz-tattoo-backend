import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BookingStatus as BookingStatusValue } from '@/types/booking-portal'

const STATUS_CONFIG: Record<BookingStatusValue, { label: string; className: string }> = {
  awaiting_down_payment: {
    label: 'Awaiting Down Payment',
    className: 'bg-[#fabb42] text-black',
  },
  appointment_confirmed: {
    label: 'Appointment Confirmed',
    className: 'bg-emerald-500/15 text-emerald-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-white/10 text-white/70',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/15 text-red-300',
  },
}

export function BookingStatus({
  status,
  className,
}: {
  status: BookingStatusValue
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      className={cn(
        'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide',
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  )
}

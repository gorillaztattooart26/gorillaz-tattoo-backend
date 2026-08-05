import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  value: string
  className?: string
}

/** Label + value pair reused across CustomerCard, TattooDetails, AppointmentCard. */
export function Field({ label, value, className }: FieldProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--foreground)]/40">{label}</p>
      <p className={cn('mt-1 text-sm text-[var(--foreground)]', className)}>{value}</p>
    </div>
  )
}

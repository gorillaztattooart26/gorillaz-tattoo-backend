import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-5 md:rounded-2xl">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className="hero-title mt-2 text-3xl font-medium text-[var(--foreground)]">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}

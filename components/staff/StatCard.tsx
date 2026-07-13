import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
        <p className="hero-title mt-2 text-3xl font-medium text-white">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fabb42]/10 text-[#fabb42]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}

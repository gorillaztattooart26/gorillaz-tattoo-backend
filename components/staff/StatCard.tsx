import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  href?: string
}

export function StatCard({ icon: Icon, label, value, href }: StatCardProps) {
  const content = (
    <>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className="hero-title mt-2 text-3xl font-medium text-[var(--foreground)]">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-5 transition-colors hover:border-[var(--foreground)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] md:rounded-2xl"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-5 md:rounded-2xl">
      {content}
    </div>
  )
}

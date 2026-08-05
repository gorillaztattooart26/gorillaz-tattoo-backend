import type { ReactNode } from 'react'

interface StaffPageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Pure Server Component — the date is computed once at render time, never re-run client-side, so there's no hydration-mismatch risk. */
export function StaffPageHeader({ title, description, action }: StaffPageHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
      <div>
        <h1 className="hero-title text-2xl font-medium text-[var(--foreground)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>}
      </div>
      <div className="flex items-center gap-4">
        {action}
        <span className="text-xs text-[var(--muted-foreground)]">{today}</span>
      </div>
    </div>
  )
}

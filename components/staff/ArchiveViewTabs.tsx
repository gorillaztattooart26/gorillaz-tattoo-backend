import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ArchiveViewTabsProps {
  basePath: string
  view: 'active' | 'archived'
  activeCount: number
  archivedCount: number
}

/** Active/Archived tab pair — added to Bookings, Inquiries, Payments so archived records stay out of the default view but stay reachable for Restore/Delete. Owner-only (Artists never see archived records). */
export function ArchiveViewTabs({ basePath, view, activeCount, archivedCount }: ArchiveViewTabsProps) {
  const tabClass = (isActive: boolean) =>
    cn(
      'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
      isActive
        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
        : 'border border-[var(--border)] text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/5',
    )

  return (
    <div className="flex items-center gap-2">
      <Link href={basePath} className={tabClass(view === 'active')}>
        Active ({activeCount})
      </Link>
      <Link href={`${basePath}?view=archived`} className={tabClass(view === 'archived')}>
        Archived ({archivedCount})
      </Link>
    </div>
  )
}

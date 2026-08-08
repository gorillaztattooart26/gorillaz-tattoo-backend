'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  CalendarCheck,
  CreditCard,
  Image as ImageIcon,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/staff/actions'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Inquiries', href: '/staff/inquiries', icon: Inbox },
  { label: 'Bookings', href: '/staff/bookings', icon: CalendarCheck },
  { label: 'Payments', href: '/staff/payments', icon: CreditCard },
  { label: 'Portfolio', href: '/staff/gallery', icon: ImageIcon },
  { label: 'Artists', href: '/staff/artists', icon: Users },
  { label: 'Settings', href: '/staff/settings', icon: Settings },
]

interface StaffSidebarProps {
  userEmail: string
}

/**
 * Icon-only rail that reveals labels on hover (desktop). Mobile has no
 * hover, so a toggle button pins it open instead. Fixed and layered above
 * the page rather than pushing it, so expanding never shifts the layout —
 * `<main>` just reserves the collapsed width via padding.
 *
 * Labels are hidden with `opacity-0` (not just clipped by the container's
 * `overflow-hidden`) — clipping alone still lets the first character or
 * two of each label render before the cut line, since the icon + gap
 * don't fill the full collapsed width.
 */
export function StaffSidebar({ userEmail }: StaffSidebarProps) {
  const pathname = usePathname()
  const [pinned, setPinned] = useState(false)
  const asideRef = useRef<HTMLElement>(null)

  // On touch devices the rail has no hover state, so a tap pins it open —
  // without this, tapping anywhere else on the page would leave it stuck open.
  useEffect(() => {
    if (!pinned) return

    const handlePointerDown = (event: PointerEvent) => {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        setPinned(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [pinned])

  const labelClass = cn(
    'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
    pinned && 'opacity-100',
  )

  return (
    <aside
      ref={asideRef}
      className={cn(
        'group fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] py-6 transition-all duration-200',
        pinned ? 'w-56' : 'w-16 hover:w-56',
      )}
    >
      <div className="flex justify-center px-2">
        <Link href="/staff/dashboard" aria-label="Gorillaz Tattoo Art staff home" className="shrink-0">
          <Image src="/icon.svg" alt="Gorillaz Tattoo Art" width={36} height={36} className="rounded-lg" />
        </Link>
      </div>

      <div className="mt-3 flex justify-center px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setPinned((prev) => !prev)}
          aria-label={pinned ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={pinned}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
        >
          {pinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 px-2">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={labelClass}>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={labelClass}>Logout</span>
          </button>
        </form>
        <p className={cn('mt-2 truncate px-3 text-xs text-[var(--muted-foreground)]', labelClass)}>{userEmail}</p>
      </div>
    </aside>
  )
}

'use client'

import { useState } from 'react'
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
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/staff/actions'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Inquiries', href: '/staff/inquiries', icon: Inbox },
  { label: 'Bookings', href: '/staff/bookings', icon: CalendarCheck },
  { label: 'Payments', href: '/staff/payments', icon: CreditCard },
  { label: 'Gallery', href: '/staff/gallery', icon: ImageIcon },
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

  const labelClass = cn(
    'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
    pinned && 'opacity-100',
  )

  return (
    <aside
      className={cn(
        'group fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden border-r border-white/10 bg-neutral-950 py-6 transition-all duration-200',
        pinned ? 'w-56' : 'w-16 hover:w-56',
      )}
    >
      <div className="flex justify-center px-2">
        <Link href="/staff/dashboard" aria-label="Gorillaz Tattoo Art staff home" className="shrink-0">
          <Image src="/icon.svg" alt="Gorillaz Tattoo Art" width={36} height={36} className="rounded-lg" />
        </Link>
      </div>

      <div className="mt-3 flex justify-center px-2 md:hidden">
        <button
          type="button"
          onClick={() => setPinned((prev) => !prev)}
          aria-label={pinned ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={pinned}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          {pinned ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
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
              className={cn(
                'flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-[#fabb42] text-black' : 'text-white/60 hover:bg-white/5 hover:text-white',
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
            className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={labelClass}>Logout</span>
          </button>
        </form>
        <p className={cn('mt-2 truncate px-3 text-xs text-white/40', labelClass)}>{userEmail}</p>
      </div>
    </aside>
  )
}

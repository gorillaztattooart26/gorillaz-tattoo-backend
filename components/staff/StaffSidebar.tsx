'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Inbox, CalendarCheck, CreditCard, Image as ImageIcon, Users, Settings, LogOut } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
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

export function StaffSidebar({ userEmail }: StaffSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-neutral-950 px-4 py-6">
      <Link href="/staff/dashboard" className="flex items-center gap-2 px-2" aria-label="Gorillaz Tattoo Art staff home">
        <Logo className="h-8 w-auto" width={128} height={41} />
      </Link>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#fabb42] text-black'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
        <span className="truncate px-3 text-xs text-white/40">{userEmail}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  )
}

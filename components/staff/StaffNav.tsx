'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/staff/actions'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/staff/dashboard' },
  { label: 'Inquiries', href: '/staff/inquiries' },
  { label: 'Bookings', href: '/staff/bookings' },
  { label: 'Payments', href: '/staff/payments' },
  { label: 'Gallery', href: '/staff/gallery' },
  { label: 'Artists', href: '/staff/artists' },
  { label: 'Settings', href: '/staff/settings' },
]

interface StaffNavProps {
  userEmail: string
}

export function StaffNav({ userEmail }: StaffNavProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/10 bg-black/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#fabb42] text-black'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-white/40 md:inline">{userEmail}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}

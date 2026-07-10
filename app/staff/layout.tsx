import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/lib/routes'

/**
 * Internal staff tooling — no public nav, not linked from anywhere in
 * the site. No authentication yet (MVP); this is the natural place to
 * add an auth check once the admin dashboard exists, without touching
 * any page underneath.
 */
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black">
      <header className="flex items-center justify-center gap-3 px-6 pt-8">
        <Link href={ROUTES.home} aria-label="Gorillaz Tattoo Art home">
          <Logo className="h-10 w-auto" width={160} height={51} />
        </Link>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/50">
          staff
        </span>
      </header>
      <main>{children}</main>
    </div>
  )
}

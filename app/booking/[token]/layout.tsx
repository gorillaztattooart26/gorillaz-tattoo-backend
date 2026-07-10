import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/lib/routes'

/**
 * Deliberately minimal — no public nav links, no "book session" CTA.
 * This is a private, already-booked customer's payment flow; inviting
 * them back into the marketing site mid-checkout works against the
 * exclusive, distraction-free feel the page needs.
 */
export default function PrivateBookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black">
      <header className="flex justify-center px-6 pt-8">
        <Link href={ROUTES.home} aria-label="Gorillaz Tattoo Art home">
          <Logo className="h-10 w-auto" width={160} height={51} />
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}

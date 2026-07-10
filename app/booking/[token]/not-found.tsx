import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

/**
 * Co-located with the route (rather than relying on the distant root
 * app/not-found.tsx) so Next.js correctly returns a 404 status when
 * getBookingByToken() can't resolve the token — an invalid, expired, or
 * revoked link should never leak information via a 200 response.
 */
export default function BookingNotFound() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-widest text-white/50 md:text-sm">404</p>
      <h1 className="hero-title text-[13vw] font-medium text-white md:text-[5vw]">
        invalid booking
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-white/60">
        This booking link is invalid, expired, or has been revoked. Please
        check the link or contact the studio for a new one.
      </p>
      <Link
        href={ROUTES.home}
        className="mt-2 rounded-full bg-[#fabb42] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
      >
        back to home
      </Link>
    </div>
  )
}

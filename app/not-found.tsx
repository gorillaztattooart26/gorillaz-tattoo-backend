import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-black px-6 pt-24 text-center md:pt-32">
      <p className="text-xs md:text-sm text-white/50 uppercase tracking-widest">404</p>
      <h1 className="hero-title text-white font-medium text-[14vw] md:text-[6vw]">page not found</h1>
      <p className="max-w-md text-sm leading-relaxed text-white/60">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href={ROUTES.home}
        className="mt-2 bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
      >
        back to home
      </Link>
    </div>
  )
}

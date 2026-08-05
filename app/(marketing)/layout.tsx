import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollRevealProvider } from '@/components/providers/ScrollRevealProvider'
import '@/styles/gz-tokens.css'

/**
 * Typefaces for the public marketing design system. Scoped to this layout
 * (not app/layout.tsx), so the staff dashboard and booking portal keep
 * their own Readex Pro / shadcn look untouched — Next.js's route-based CSS
 * chunking means these fonts and gz-tokens.css are only ever loaded when a
 * visitor is on a marketing page.
 */
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-gz-display',
})

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-gz-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-gz-mono',
})

/**
 * Shared chrome for every public marketing page (home, about, artists,
 * portfolio, booking inquiry, contact, aftercare). Split out from the root
 * layout so the private booking portal (app/booking/[token]) can render
 * without the public nav/footer/design tokens.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bebasNeue.variable} ${geist.variable} ${geistMono.variable}`}>
      <Navbar />
      <main className="bg-[var(--gz-ink-950)] [font-family:var(--font-gz-sans)]">{children}</main>
      <Footer />
      <ScrollRevealProvider />
      {/* Portal target for MobileNav's full-screen overlay — a sibling of
          Navbar (not a descendant), so it escapes Navbar's transform-based
          entrance animation and can use position:fixed for the full
          viewport, while still living inside this div so it inherits the
          --font-gz-* variables above (document.body itself doesn't). */}
      <div id="gz-v2-portal-root" />
    </div>
  )
}

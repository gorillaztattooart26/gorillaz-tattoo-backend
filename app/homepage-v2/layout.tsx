import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { Navbar } from '@/components/homepage-v2/Navbar'
import { Footer } from '@/components/homepage-v2/Footer'
import { ScrollRevealProvider } from '@/components/providers/ScrollRevealProvider'
import '@/components/homepage-v2/tokens.css'

/**
 * Typefaces for the /homepage-v2 draft only. Scoped to this layout (not
 * app/layout.tsx), so the rest of the site keeps its Readex Pro body font
 * untouched — these are only ever loaded when a visitor is on this route.
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
 * Isolated layout for the /homepage-v2 draft — deliberately outside
 * app/(marketing)/, so it never inherits that group's Navbar/Footer/CSS.
 * Only the root app/layout.tsx (fonts default, global JSON-LD, globals.css)
 * is shared, same as every other route.
 */
export default function HomepageV2Layout({ children }: { children: React.ReactNode }) {
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

import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { Navbar } from '@/components/homepage-v2/Navbar'
import { Footer } from '@/components/homepage-v2/Footer'
import { ScrollRevealProvider } from '@/components/providers/ScrollRevealProvider'
import '@/components/homepage-v2/tokens.css'

/**
 * Typefaces for the /portfolio-v2 draft only, mirroring
 * app/homepage-v2/layout.tsx exactly — same design system, same isolated
 * scoping so the rest of the site keeps its Readex Pro body font untouched.
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
 * Isolated layout for the /portfolio-v2 draft — reuses homepage-v2's
 * Navbar/Footer/tokens directly (same design system) rather than
 * duplicating them, but stays outside app/(marketing)/ so the existing
 * production Portfolio page and its layout are never touched.
 */
export default function PortfolioV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bebasNeue.variable} ${geist.variable} ${geistMono.variable}`}>
      <Navbar />
      <main className="bg-[var(--gz-ink-950)] [font-family:var(--font-gz-sans)]">{children}</main>
      <Footer />
      <ScrollRevealProvider />
      <div id="gz-v2-portal-root" />
    </div>
  )
}

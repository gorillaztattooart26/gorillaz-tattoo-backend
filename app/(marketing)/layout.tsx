import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollRevealProvider } from '@/components/providers/ScrollRevealProvider'

/**
 * Shared chrome for every public marketing page (home, about, artists,
 * portfolio, gallery, booking inquiry, contact). Split out from the root
 * layout so the private booking portal (app/booking/[token]) can render
 * without the public nav/footer.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ScrollRevealProvider />
    </>
  )
}

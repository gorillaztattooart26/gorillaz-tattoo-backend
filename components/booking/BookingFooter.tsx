import { Logo } from '@/components/common/Logo'
import { siteConfig } from '@/lib/site-config'

/**
 * Bespoke footer for the private booking portal — deliberately not the
 * marketing site's Footer (components/layout/Footer.tsx), since this
 * route renders outside app/(marketing) and shouldn't invite the visitor
 * back into the public nav mid-checkout.
 */
export function BookingFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 pt-10 pb-16 text-center">
      <Logo className="mx-auto h-10 w-auto" width={160} height={51} />

      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-white/50">
        <p>Studio Hours: Tue–Sun, 11:00 AM – 8:00 PM (closed Mondays)</p>
        <p>Poblacion Arts District, Makati City, Metro Manila, Philippines</p>
        <div className="mt-2 flex items-center gap-4">
          <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            facebook
          </a>
          <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            instagram
          </a>
          <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
            email
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs text-white/30">
        © {new Date().getFullYear()} {siteConfig.name} — all rights reserved.
      </p>
    </footer>
  )
}

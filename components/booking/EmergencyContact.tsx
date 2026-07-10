import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/lib/site-config'

const CONTACT_LINKS = [
  { label: 'Studio Phone', value: '+63 917 000 0000', href: 'tel:+639170000000' },
  { label: 'Facebook', value: 'facebook.com/gorillaztattooart', href: siteConfig.social.facebook },
  { label: 'Instagram', value: 'instagram.com/gorillaztattooart', href: siteConfig.social.instagram },
  { label: 'Messenger', value: 'm.me/gorillaztattooart', href: siteConfig.social.facebook },
  { label: 'Email', value: siteConfig.email, href: `mailto:${siteConfig.email}` },
]

export function EmergencyContact() {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Need Help? Contact the Studio</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-2">
        {CONTACT_LINKS.map((contact) => (
          <a
            key={contact.label}
            href={contact.href}
            target={contact.href.startsWith('http') ? '_blank' : undefined}
            rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="rounded-xl border border-white/10 px-4 py-3 transition-colors hover:border-white/25"
          >
            <p className="text-xs uppercase tracking-wide text-white/40">{contact.label}</p>
            <p className="mt-1 text-sm text-white/80">{contact.value}</p>
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

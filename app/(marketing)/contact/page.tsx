import type { Metadata } from 'next'
import { ComingSoonSection } from '@/components/common/ComingSoonSection'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'Get in touch with gorillaz tattoo art — studio contact details and general inquiries. Coming soon.',
  path: ROUTES.contact,
})

export default function ContactPage() {
  return (
    <ComingSoonSection
      eyebrow="contact"
      title="a dedicated contact page is coming soon"
      description="For tattoo inquiries, use the booking form — it reaches us directly. Email, Instagram, and Facebook links are in the footer."
      breadcrumbs={[
        { name: 'Home', path: ROUTES.home },
        { name: 'Contact', path: ROUTES.contact },
      ]}
    />
  )
}

import type { LucideIcon } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'

interface PlaceholderSectionProps {
  title: string
  description?: string
  icon: LucideIcon
}

/** Staff-dashboard placeholder — matches the header + card visual
 * language of the real pages (Dashboard/Inquiries/Bookings/Payments)
 * instead of floating bare text in an otherwise empty page, which read
 * as broken rather than "not built yet." Distinct from the public-facing
 * components/common/ComingSoonSection.tsx, which hardcodes public
 * breadcrumbs and a "back to home" marketing CTA that don't belong in an
 * authenticated internal shell. */
export function PlaceholderSection({ title, description, icon: Icon }: PlaceholderSectionProps) {
  return (
    <div>
      <StaffPageHeader title={title} />
      <div className="px-4 py-6 md:px-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-neutral-900/60 px-6 py-24 text-center md:rounded-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fabb42]/10 text-[#fabb42]">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Coming soon</p>
            <p className="mt-1 max-w-sm text-sm text-white/50">
              {description ?? `${title} management isn't built yet.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

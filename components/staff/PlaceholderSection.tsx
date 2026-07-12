interface PlaceholderSectionProps {
  title: string
  description?: string
}

/** Minimal staff-dashboard placeholder — distinct from the public-facing
 * components/common/ComingSoonSection.tsx, which hardcodes public
 * breadcrumbs and a "back to home" marketing CTA that don't belong in an
 * authenticated internal shell. */
export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-16">
      <h1 className="hero-title text-3xl font-medium text-white">{title}</h1>
      <p className="text-sm text-white/50">{description ?? 'Coming soon.'}</p>
    </div>
  )
}

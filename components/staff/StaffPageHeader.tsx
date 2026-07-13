interface StaffPageHeaderProps {
  title: string
  description?: string
}

/** Pure Server Component — the date is computed once at render time, never re-run client-side, so there's no hydration-mismatch risk. */
export function StaffPageHeader({ title, description }: StaffPageHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-1 border-b border-white/10 px-8 py-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="hero-title text-2xl font-medium text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
      </div>
      <span className="text-xs text-white/40">{today}</span>
    </div>
  )
}

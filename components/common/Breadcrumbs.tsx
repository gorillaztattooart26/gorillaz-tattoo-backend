import Link from 'next/link'
import { buildBreadcrumbJsonLd, type BreadcrumbEntry } from '@/lib/seo'

interface BreadcrumbsProps {
  entries: BreadcrumbEntry[]
}

/** Visible breadcrumb trail + matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ entries }: BreadcrumbsProps) {
  const jsonLd = buildBreadcrumbJsonLd(entries)

  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--gz-ink-400)] md:text-sm">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex items-center gap-2">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1
          return (
            <li key={entry.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-[var(--gz-paper-050)]">
                  {entry.name}
                </span>
              ) : (
                <Link href={entry.path} className="transition-colors hover:text-[var(--gz-paper-050)]">
                  {entry.name}
                </Link>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

import Link from 'next/link'
import { buildBreadcrumbJsonLd, type BreadcrumbEntry } from '@/lib/seo'

interface BreadcrumbsProps {
  entries: BreadcrumbEntry[]
}

/** Visible breadcrumb trail + matching BreadcrumbList JSON-LD. */
export function Breadcrumbs({ entries }: BreadcrumbsProps) {
  const jsonLd = buildBreadcrumbJsonLd(entries)

  return (
    <nav aria-label="Breadcrumb" className="text-xs md:text-sm text-white/50">
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
                <span aria-current="page" className="text-white/80">
                  {entry.name}
                </span>
              ) : (
                <Link href={entry.path} className="hover:text-white transition-colors">
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

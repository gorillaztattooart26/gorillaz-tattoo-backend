import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionHeadingProps {
  eyebrow?: string
  children: ReactNode
  className?: string
  headingClassName?: string
}

/**
 * Shared eyebrow-label + heading pattern repeated across the Portfolio,
 * Artists, Studio, and FAQ sections. Callers control sizing/casing via
 * headingClassName so each section keeps its exact existing look.
 */
export function SectionHeading({
  eyebrow,
  children,
  className,
  headingClassName,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow && <p className="text-xs md:text-sm text-white/70 mb-3">{eyebrow}</p>}
      <h2 className={cn('hero-title text-white font-medium', headingClassName)}>
        {children}
      </h2>
    </div>
  )
}

import type { ReactNode } from 'react'

interface FaqSectionProps {
  id?: string
  ariaLabel: string
  children: ReactNode
}

/** Shared outer wrapper for every FAQ section on the site — keeps padding consistent, so any new FAQ section automatically matches the rest just by using this. */
export function FaqSection({ id, ariaLabel, children }: FaqSectionProps) {
  return (
    <section
      id={id}
      role="region"
      aria-label={ariaLabel}
      className="relative w-full px-8 md:px-20 lg:px-28 pb-24 md:pb-32"
    >
      {children}
    </section>
  )
}

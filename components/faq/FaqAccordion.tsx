'use client'

import { useState } from 'react'
import { AccordionItem } from '@/components/ui/Accordion'
import { ChevronIcon } from '@/components/common/icons'
import { cn } from '@/utils/cn'
import type { FaqItem } from '@/types/faq'

interface FaqAccordionProps {
  faqs: FaqItem[]
  initialCount?: number
  defaultOpenIndex?: number | null
}

/**
 * Interactive FAQ list (accordion + show more/read less). Receives its
 * data as props from the server-rendered FAQ section so this client
 * component stays purely presentational/stateful.
 */
export function FaqAccordion({ faqs, initialCount = 3, defaultOpenIndex = 1 }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex)
  const [showAll, setShowAll] = useState(false)

  const visibleFaqs = showAll ? faqs : faqs.slice(0, initialCount)

  return (
    <>
      <div className="reveal border-t border-white/10">
        {visibleFaqs.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

      {faqs.length > initialCount && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className={cn(
            'mx-auto mt-10 flex items-center gap-2 text-white transition-all duration-300',
            'hover:text-[#fabb42] hover:drop-shadow-[0_0_10px_rgba(250,187,66,0.7)]',
            'text-sm font-semibold uppercase tracking-wide',
          )}
        >
          {showAll ? 'read less' : 'show more'}
          <ChevronIcon className={cn('h-4 w-4 transition-transform duration-300', showAll && 'rotate-180')} />
        </button>
      )}
    </>
  )
}

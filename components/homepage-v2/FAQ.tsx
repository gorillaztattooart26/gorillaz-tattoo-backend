'use client'

import { useState } from 'react'
import { AccordionItem } from '@/components/ui/Accordion'
import type { FaqItem } from '@/types/faq'

const FAQS: FaqItem[] = [
  {
    question: 'How do I book, and how long is the wait?',
    answer:
      'Send an inquiry with a short description and one or two references. The studio replies within 48 hours. Most of our artists are booking six to ten weeks out; cover-ups and large-scale work run longer.',
  },
  {
    question: 'What does a custom tattoo cost?',
    answer:
      'Pricing depends on size, placement and detail — we quote a price band after your consultation. A deposit holds your date and comes off the final session.',
  },
  {
    question: 'It is my first tattoo. What should I know?',
    answer:
      'Eat before you come, wear something you can move out of the way, and plan nothing for the evening. Bring a valid ID. Your artist walks you through the rest in the chair.',
  },
  {
    question: 'Is the studio clean and safe?',
    answer:
      'Yes. Single-use needles and cartridges, sealed sterile tubes, hospital-grade surface disinfection between clients, and every station set up in front of you.',
  },
  {
    question: 'Do you do cover-ups and rework?',
    answer:
      'Yes — blackwork and heavy black and grey cover best. Send a clear photo in daylight and the studio will tell you honestly what is possible.',
  },
  {
    question: 'Age and ID policy',
    answer:
      '18 and over, no exceptions, even with a parent present. Bring a government-issued ID to the consultation and to every session.',
  },
  {
    question: 'What if I need to cancel?',
    answer:
      'Move a date once with advance notice and the deposit follows you. Later than that, or a second change, and the deposit is retained.',
  },
]

/**
 * FAQ section for /homepage-v2 — a two-column layout (heading + intro on
 * the left, full accordion list on the right), matching the Claude
 * Design reference. Reuses the shared, generic AccordionItem (a plain
 * presentational +/× toggle row with no v2-specific styling of its own)
 * rather than the site's FaqSection/FaqAccordion wrapper, since those
 * are built for the real homepage's single-column layout.
 */
export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      role="region"
      aria-label="Frequently asked questions"
      className="relative w-full overflow-hidden py-16 md:py-24"
    >
      {/* Decorative geometric pentagon, half cropped off the left edge —
          same faint-outline + animated copper-glow layering as the other
          sections' geometric shapes. Hidden on mobile, where there isn't
          enough side margin for it to read as a deliberate accent rather
          than clutter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden aspect-square w-[460px] -translate-x-1/2 translate-y-1/6 opacity-30 md:block"
      >
        <svg viewBox="0 0 300 300" fill="none" className="absolute inset-0 h-full w-full">
          <path
            d="M150,20 L273.6,109.8 L226.4,255.2 L73.6,255.2 L26.4,109.8 Z"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          viewBox="0 0 300 300"
          fill="none"
          className="gz-arc-full absolute inset-0 h-full w-full [animation:gz-arc-full_6.5s_cubic-bezier(0.45,0,0.55,1)_infinite]"
          style={{ filter: 'drop-shadow(0 0 4px rgba(196,98,43,0.55))' }}
        >
          <path
            d="M150,20 L273.6,109.8 L226.4,255.2 L73.6,255.2 L26.4,109.8 Z"
            stroke="var(--gz-copper-500)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[1360px] flex-wrap gap-10 px-6 md:gap-24 md:px-16">
        <div className="reveal flex min-w-[260px] flex-1 flex-col gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            Frequently asked questions
          </span>
          <h2 className="m-0 text-[11vw] font-normal uppercase leading-[0.92] text-[var(--gz-paper-050)] md:text-[4.4vw] [font-family:var(--font-gz-display)]">
            Before you book
          </h2>
          <p className="m-0 max-w-[34ch] text-sm leading-relaxed text-[var(--gz-ink-300)]">
            Anything not answered here, ask the studio in your inquiry.
          </p>
        </div>

        <div className="reveal min-w-[280px] flex-[1.5] border-t border-[var(--gz-border-subtle)]">
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

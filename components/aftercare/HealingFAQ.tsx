'use client'

import { useState } from 'react'
import { AccordionItem } from '@/components/ui/Accordion'
import type { FaqItem } from '@/types/faq'

const FAQS: FaqItem[] = [
  {
    question: 'How long does a tattoo take to heal?',
    answer:
      'The surface closes in 2–3 weeks. The layers underneath keep settling for 4–6 weeks, so colour and contrast only look final at the end of that window.',
  },
  {
    question: 'When can I start using the healing salve?',
    answer:
      'Once the initial ooze has stopped — usually after the first day or two. Apply a thin layer 2–3 times a day and let it absorb; no thick coats.',
  },
  {
    question: 'Can I swim or sit in the sun while it heals?',
    answer:
      'No swimming, baths or hot tubs for two weeks, and keep it out of direct sun for four. After it has healed, sunscreen is what keeps the piece sharp long term.',
  },
]

const MORE_FAQS: FaqItem[] = [
  {
    question: 'Is peeling and light scabbing normal?',
    answer:
      'Yes. Flaking that looks like a light sunburn starts around day 3 and clears by the end of week one. Let it shed on its own — picking pulls ink out with the scab.',
  },
  {
    question: 'Can I train or work out?',
    answer:
      'Give it 48 hours, then keep sessions light for the first week. Sweat, friction and gym equipment on a fresh tattoo are the main causes of irritation.',
  },
  {
    question: 'What if a spot heals patchy?',
    answer:
      'Send us a photo once it is fully healed at six weeks. Small touch-ups on our own work are free within three months of the session.',
  },
]

/**
 * Aftercare FAQ — sticky left column + right-column accordion, matching
 * the homepage's FAQ/Process two-column convention. Reuses the shared,
 * generic `AccordionItem` (already built with this exact use case in
 * mind — see its own comment). Client Component: needs local open/
 * show-more state.
 */
export function HealingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [showMore, setShowMore] = useState(false)

  const visibleFaqs = showMore ? [...FAQS, ...MORE_FAQS] : FAQS

  return (
    <section
      role="region"
      aria-label="Aftercare frequently asked questions"
      className="w-full py-[clamp(56px,8vw,116px)] pb-[clamp(64px,9vw,132px)]"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-start gap-[clamp(28px,5vw,96px)] px-6 md:px-16">
        <div className="reveal flex min-w-[min(100%,260px)] flex-1 flex-col gap-3.5">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            Aftercare FAQ
          </span>
          <h2 className="m-0 text-[clamp(32px,4.6vw,72px)] font-normal uppercase leading-[0.92] tracking-[0.008em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
            Healing questions
          </h2>
        </div>

        <div className="reveal min-w-[min(100%,420px)] flex-[1.5] border-t border-[var(--gz-border-subtle)]">
          {visibleFaqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}

          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="mx-auto mt-[clamp(22px,3vw,38px)] block px-1 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--gz-ink-300)] hover:text-[var(--gz-paper-050)] transition-colors"
          >
            {showMore ? 'Show less ⌃' : 'Show more ⌄'}
          </button>
        </div>
      </div>
    </section>
  )
}

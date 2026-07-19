import { SectionHeading } from '@/components/common/SectionHeading'
import { FaqAccordion } from '@/components/faq/FaqAccordion'
import { FaqSection } from '@/components/faq/FaqSection'
import type { FaqItem } from '@/types/faq'

const AFTERCARE_FAQS: FaqItem[] = [
  {
    question: 'How long does a tattoo take to heal?',
    answer:
      'Surface healing usually takes 2–3 weeks. The skin underneath keeps settling for up to 2–3 months, so treat it gently well after it looks healed.',
  },
  {
    question: 'When can I apply the healing salve?',
    answer:
      'Once the initial ooze has stopped — usually after the first day or two. Apply a thin layer 2–3 times a day and let it absorb, no thick coats.',
  },
  {
    question: 'Can I go swimming or sit in the sun while it heals?',
    answer:
      'Avoid swimming, direct sun, and saunas for at least two weeks. Chlorine, salt water, and UV can fade fresh ink or damage healing skin.',
  },
  {
    question: 'What if my tattoo starts peeling or itching?',
    answer:
      "That's completely normal — keep it moisturized and resist the urge to pick or scratch. Picking can pull out ink and cause scarring.",
  },
  {
    question: 'When should I worry about infection?',
    answer:
      'Some redness and warmth for the first couple of days is normal. If redness spreads, or you notice pus, fever, or worsening pain after day 3–4, contact us or see a doctor.',
  },
  {
    question: 'Can I use regular lotion instead of the healing salve?',
    answer:
      'You can, but stick to fragrance-free, gentle options only. Our in-house healing salve is formulated specifically for fresh tattoos and heals cleanest.',
  },
]

/** Aftercare-specific FAQ, reusing the same accordion used on the homepage. */
export function AftercareFaq() {
  return (
    <FaqSection ariaLabel="Tattoo aftercare frequently asked questions">
      <SectionHeading
        eyebrow="aftercare faq"
        className="mb-10 md:mb-12"
        headingClassName="first-letter:uppercase text-[10vw] md:text-[4.5vw]"
      >
        healing questions
      </SectionHeading>

      <FaqAccordion faqs={AFTERCARE_FAQS} />
    </FaqSection>
  )
}

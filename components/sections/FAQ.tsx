import { FaqAccordion } from '@/components/faq/FaqAccordion'
import { FaqSection } from '@/components/faq/FaqSection'
import type { FaqItem } from '@/types/faq'

const FAQS: FaqItem[] = [
  {
    question: 'How do I book an appointment?',
    answer:
      'Message us on Instagram or Facebook, or leave your number above — we read every request and reply within 48 hours with artist availability and a quote.',
  },
  {
    question: 'Does it hurt?',
    answer:
      "Yes! But in the best possible way. Your brain releases endorphins when you go through pain and your body loves endorphins, so yes, it hurts, but you'll kinda like it.",
  },
  {
    question: 'How old do I have to be to get a tattoo?',
    answer:
      'You must be 18 or older with a valid government ID. No exceptions and no parental consent workarounds.',
  },
  {
    question: 'What should I do before my session?',
    answer:
      'Eat a full meal, stay hydrated, and get a good night’s sleep. Avoid alcohol for at least 24 hours before your appointment.',
  },
  {
    question: 'How do I care for a new tattoo?',
    answer:
      'Keep it clean and moisturized, avoid direct sun and swimming for two weeks, and never pick at the scabbing.',
  },
]

/** FAQ section. Heading is static (server-rendered); the accordion list is a client island. */
export function FAQ() {
  return (
    <FaqSection id="faq" ariaLabel="Frequently asked questions">
      <h2 className="reveal hero-title uppercase text-white font-medium text-[13vw] md:text-[5.5vw] mb-8 md:mb-12">
        faq
      </h2>

      <FaqAccordion faqs={FAQS} />
    </FaqSection>
  )
}

import { useState } from 'react'

const FAQS = [
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

const INITIAL_COUNT = 3

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(1)
  const [showAll, setShowAll] = useState(false)

  const visibleFaqs = showAll ? FAQS : FAQS.slice(0, INITIAL_COUNT)

  return (
    <section
      id="faq"
      role="region"
      aria-label="Frequently asked questions"
      className="relative w-full bg-black px-8 md:px-20 lg:px-28 pb-24 md:pb-32"
    >
      <h2 className="reveal hero-title uppercase text-white font-medium text-[13vw] md:text-[5.5vw] mb-8 md:mb-12">
        faq
      </h2>

      <div className="reveal border-t border-white/10">
        {visibleFaqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question} className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-6 py-6 text-left"
              >
                <span className="text-white text-lg md:text-xl">
                  {faq.question}
                </span>
                <span
                  className={`shrink-0 text-white text-2xl leading-none transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[560px] pb-6 text-sm leading-relaxed text-white/70">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {FAQS.length > INITIAL_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mx-auto mt-10 flex items-center gap-2 text-white transition-all duration-300 hover:text-[#fabb42] hover:drop-shadow-[0_0_10px_rgba(250,187,66,0.7)] text-sm font-semibold uppercase tracking-wide"
        >
          {showAll ? 'read less' : 'show more'}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </section>
  )
}

import { SectionHeading } from '@/components/common/SectionHeading'

interface Step {
  title: string
  copy: string
}

const STEPS: Step[] = [
  {
    title: 'leave the wrap on',
    copy: 'Keep the initial bandage on for 2–4 hours after your session. Don’t touch it with unwashed hands before then.',
  },
  {
    title: 'wash gently',
    copy: 'Remove the wrap and wash with lukewarm water and a fragrance-free, antibacterial soap. Use your fingertips only — no washcloths or loofahs.',
  },
  {
    title: 'pat, don’t rub',
    copy: 'Pat the area dry with a clean paper towel. Rubbing with a bath towel can irritate fresh skin and pull at scabbing.',
  },
  {
    title: 'moisturize thin',
    copy: 'Apply a thin layer of Gorillaz Tattoo Balm 2–3 times a day. A little goes a long way — over-moisturizing traps moisture and slows healing.',
  },
  {
    title: 'stay out of the sun and water',
    copy: 'No swimming, baths, or hot tubs for at least 2 weeks. Avoid direct sunlight for 4 weeks — UV exposure fades fresh ink fast.',
  },
  {
    title: 'let it peel naturally',
    copy: 'Your tattoo will scab and peel like a light sunburn around days 3–7. Never pick or scratch — let it fall off on its own.',
  },
  {
    title: 'wear it loose',
    copy: 'Loose, breathable clothing over the area prevents friction while it heals. Tight fabric can stick to scabbing.',
  },
  {
    title: 'know the timeline',
    copy: 'Surface healing takes 2–3 weeks. Full healing underneath the skin takes 4–6 weeks — keep caring for it even after it looks done.',
  },
]

/**
 * Step-by-step tattoo aftercare instructions. Standard studio guidance —
 * not medical advice; the final "when to see a doctor" note covers the
 * one case that needs to escalate beyond self-care.
 */
export function AftercareSteps() {
  return (
    <section aria-label="Tattoo aftercare instructions" className="relative w-full bg-black px-6 md:px-10 py-16 md:py-20">
      <SectionHeading
        className="reveal mb-10 text-center md:mb-14"
        headingClassName="first-letter:uppercase text-center text-[10vw] md:text-[4.5vw]"
      >
        <span className="block">how to care</span>
        <span className="block">for your new tattoo</span>
      </SectionHeading>

      <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
        {STEPS.map((step, index) => (
          <li key={step.title} className="reveal flex gap-5">
            <span className="hero-title shrink-0 text-3xl font-medium text-[#fabb42] md:text-4xl">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-base font-semibold text-white first-letter:uppercase md:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{step.copy}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="reveal mt-12 max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/60 p-6 text-sm leading-relaxed text-white/70">
        <span className="font-semibold text-white">When to see a doctor: </span>
        excessive redness or swelling that gets worse after day 3, pus or a
        foul smell, red streaking, or a fever are signs of infection — stop
        self-treating and see a doctor right away.
      </p>
    </section>
  )
}

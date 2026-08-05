interface Step {
  number: string
  title: string
  copy: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Leave the wrap on',
    copy: 'Keep the initial bandage on for 2–4 hours after your session, and do not touch it with unwashed hands before then.',
  },
  {
    number: '02',
    title: 'Wash gently',
    copy: 'Remove the wrap and wash with lukewarm water and a fragrance-free antibacterial soap. Fingertips only — no washcloths or loofahs.',
  },
  {
    number: '03',
    title: 'Pat, do not rub',
    copy: 'Pat the area dry with a clean paper towel. A bath towel irritates fresh skin and pulls at scabbing.',
  },
  {
    number: '04',
    title: 'Moisturise thin',
    copy: 'Apply a thin layer of Gorillaz Tattoo Balm 2–3 times a day. Over-moisturising traps moisture and slows healing.',
  },
  {
    number: '05',
    title: 'Stay out of sun and water',
    copy: 'No swimming, baths or hot tubs for at least 2 weeks. Avoid direct sun for 4 weeks — UV fades fresh ink fast.',
  },
  {
    number: '06',
    title: 'Let it peel naturally',
    copy: 'It will scab and peel like a light sunburn around days 3–7. Never pick or scratch — let it fall off on its own.',
  },
  {
    number: '07',
    title: 'Wear it loose',
    copy: 'Loose, breathable clothing over the area prevents friction while it heals. Tight fabric sticks to scabbing.',
  },
  {
    number: '08',
    title: 'Know the timeline',
    copy: 'Surface healing takes 2–3 weeks. Full healing underneath the skin takes 4–6 weeks — keep caring for it after it looks done.',
  },
]

/**
 * The 8-step aftercare grid plus infection warning callout. Server
 * Component — purely static content, scroll-reveal handled by the global
 * `.reveal` observer (ScrollRevealProvider), staggered per card like
 * the homepage's Process timeline.
 */
export function CareSteps() {
  return (
    <section
      role="region"
      aria-label="How to care for your new tattoo"
      className="w-full py-[clamp(56px,8vw,116px)]"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-[clamp(34px,5vw,72px)] px-6 md:px-16">
        <h2 className="reveal m-0 max-w-[20ch] text-[clamp(36px,6.4vw,104px)] font-normal uppercase leading-[0.9] tracking-[0.008em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
          How to care for your new tattoo
        </h2>

        <div className="grid grid-cols-1 gap-x-[clamp(28px,5vw,96px)] gap-y-[clamp(24px,3vw,56px)] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="reveal flex gap-[clamp(14px,1.6vw,24px)] border-t border-[var(--gz-border-subtle)] pt-[clamp(16px,1.8vw,24px)]"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <span className="flex-none font-normal leading-none text-[var(--gz-copper-500)] text-[clamp(26px,2.4vw,38px)] [font-family:var(--font-gz-display)]">
                {step.number}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[17px] leading-snug text-[var(--gz-paper-050)]">{step.title}</h3>
                <p className="m-0 max-w-[44ch] text-sm leading-relaxed text-[var(--gz-ink-300)]">{step.copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="reveal flex max-w-[72ch] items-start gap-[clamp(14px,1.6vw,22px)] border border-[var(--gz-border-default)] bg-[var(--gz-ink-900)] p-[clamp(18px,2.2vw,28px)]">
          <span className="flex-none pt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            See a doctor
          </span>
          <p className="m-0 text-sm leading-relaxed text-[var(--gz-ink-200)]">
            Redness or swelling that worsens after day 3, pus or a foul
            smell, red streaking, or a fever are signs of infection. Stop
            self-treating and see a doctor right away.
          </p>
        </div>
      </div>
    </section>
  )
}

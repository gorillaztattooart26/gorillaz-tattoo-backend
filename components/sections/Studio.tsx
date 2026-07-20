import Image from 'next/image'
import { Lock, MessageSquare, PenTool, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '@/components/common/SectionHeading'

const FEATURES = [
  {
    title: 'consultation first',
    copy: 'every session starts with a sit-down. your story, references, and placement before any needle moves.',
    icon: MessageSquare,
  },
  {
    title: 'hospital-grade sterile',
    copy: 'single-use needles, autoclave sterilization, and sealed stations. 100% safe, every time.',
    icon: ShieldCheck,
  },
  {
    title: 'custom only',
    copy: 'no flash sheets on the wall. every design is drawn for you and never inked twice.',
    icon: PenTool,
  },
  {
    title: 'private sessions',
    copy: 'one artist, one client, one room. take your time — the chair is yours for the day.',
    icon: Lock,
  },
]

/** Homepage "about the studio" section. Server Component. */
export function Studio() {
  return (
    <section
      id="studio"
      role="region"
      aria-label="Gorillaz Tattoo Art studio — based in the Philippines"
      className="relative w-full px-6 md:px-10 py-24 md:py-32"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="reveal">
          <SectionHeading eyebrow="the studio" headingClassName="first-letter:uppercase text-[12vw] md:text-[5vw]">
            born in the philippines
          </SectionHeading>
          <p className="mt-6 max-w-[420px] text-[15px] leading-snug text-white/90">
            gorillaz tattoo art is a private custom ink design studio in the
            philippines. from fine line minimalism to heavy blackwork rooted in
            filipino tribal tradition, we craft permanent self-expression for
            collectors who want a piece that is theirs alone.
          </p>

          <dl className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <feature.icon className="mb-3 h-8 w-8 text-[#fabb42]" aria-hidden="true" />
                <dt className="text-white text-lg font-semibold mb-2">{feature.title}</dt>
                <dd className="text-white/70 text-sm leading-snug">{feature.copy}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure
          className="reveal relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5] md:aspect-[4/5]"
          style={{ transitionDelay: '150ms' }}
        >
          <Image
            src="/images/studio/studio-artist-session.jpg"
            alt="inside gorillaz tattoo art — custom tattoo session at our private studio in the philippines"
            title="Gorillaz Tattoo Art studio — Philippines"
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <figcaption className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-3">
            <span className="text-white text-sm font-semibold">the studio floor</span>
            <span className="text-white/70 text-xs border border-white/30 rounded-full px-3 py-1">
              philippines
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

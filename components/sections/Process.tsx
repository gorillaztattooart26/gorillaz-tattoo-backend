'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { HomepageSlide } from '@/lib/homepage-media'

interface Step {
  number: string
  title: string
  copy: string
}

interface ProcessProps {
  /** The "Dominate" interstitial's crossfade slides — CMS-managed via the Homepage Studio Portfolio Slideshow card in the staff dashboard, falls back to the original static set when nothing's been uploaded. Always non-empty. */
  slides: HomepageSlide[]
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Inquiry',
    copy: 'Send a paragraph and two references. The studio replies within 48 hours with the right artist for the piece, a price band and the next open date.',
  },
  {
    number: '02',
    title: 'Consultation',
    copy: 'At the studio or by call. Placement, scale, session count, hygiene, aftercare, and the archive on paper.',
  },
  {
    number: '03',
    title: 'Design',
    copy: 'Your resident artist draws the piece to your brief. One round of changes before the needle; none after.',
  },
  {
    number: '04',
    title: 'Sessions',
    copy: 'Work is booked by the session in a sterile, single-use setup, and how many you need depends on the size of the piece. The deposit comes off the last one.',
  },
]

/**
 * Homepage booking process timeline. Each step's rail segment fills
 * continuously as the page scrolls — a rAF-throttled scroll listener
 * (same pattern as PortfolioGallery's grow panel) measures each rail
 * track's position every frame and sets its fill height directly, so
 * the line climbs the timeline in step with scroll position rather than
 * just toggling on once a segment enters view.
 */
export function Process({ slides }: ProcessProps) {
  const trackRefs = useRef<(HTMLSpanElement | null)[]>([])
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length)
    }, 4500)
    return () => clearInterval(id)
  }, [slides.length])

  useEffect(() => {
    let raf = 0

    const update = () => {
      raf = 0
      // The fill reaches 100% once a segment's bottom scrolls past this
      // point (75% down the viewport) — the timeline "catches up" to
      // wherever the visitor currently is, rather than firing once.
      const reference = window.innerHeight * 0.75

      trackRefs.current.forEach((track, i) => {
        const fill = fillRefs.current[i]
        if (!track || !fill) return
        const rect = track.getBoundingClientRect()
        const progress = rect.height > 0 ? (reference - rect.top) / rect.height : 0
        fill.style.height = `${Math.min(1, Math.max(0, progress)) * 100}%`
      })
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section
      id="process"
      role="region"
      aria-label="How booking works at Gorillaz Tattoo Art"
      className="relative w-full overflow-hidden py-16 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 z-0 aspect-square w-[300px] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-15 md:w-[580px] md:opacity-30"
      >
        <div className="absolute inset-0 border border-white/[0.13]" />
        <div className="gz-arc-full absolute inset-0 border border-[var(--gz-copper-500)] shadow-[0_0_8px_rgba(196,98,43,0.45)] [animation:gz-arc-full_6.5s_cubic-bezier(0.45,0,0.55,1)_infinite]" />
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[1360px] flex-col items-start gap-10 px-6 md:flex-row md:flex-wrap md:gap-24 md:px-16">
        <div className="reveal flex w-full flex-col gap-4 md:sticky md:top-28 md:min-w-[260px] md:flex-1">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            Booking at Gorillaz Tattoo Art
          </span>
          <h2 className="m-0 text-[13vw] font-normal uppercase leading-[0.92] text-[var(--gz-paper-050)] md:text-[4.4vw] [font-family:var(--font-gz-display)]">
            Four steps
          </h2>
          <p className="m-0 max-w-[34ch] text-sm leading-relaxed text-[var(--gz-ink-300)]">
            From first message to first session at the studio is usually six to
            ten weeks.
          </p>
        </div>

        <div className="flex w-full flex-col md:min-w-[280px] md:flex-[1.5]">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="reveal flex gap-5 pb-9 last:pb-0 md:gap-7"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="relative w-[11px] flex-none">
                <span className="absolute left-0 top-[7px] h-[11px] w-[11px] border border-[var(--gz-border-strong)] bg-[var(--gz-ink-950)]" />
                {index < STEPS.length - 1 && (
                  <span
                    ref={(el) => {
                      trackRefs.current[index] = el
                    }}
                    className="absolute bottom-[-36px] left-[5px] top-6 w-px overflow-hidden bg-[var(--gz-border-subtle)] md:bottom-[-48px]"
                  >
                    <span
                      ref={(el) => {
                        fillRefs.current[index] = el
                      }}
                      className="absolute left-0 top-0 h-0 w-px bg-[#e0a32b] shadow-[0_0_7px_rgba(224,163,43,0.75)]"
                    />
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--gz-ink-400)]">
                  {step.number}
                </span>
                <span className="text-[clamp(21px,2vw,32px)] uppercase tracking-[0.02em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
                  {step.title}
                </span>
                <p className="m-0 max-w-[52ch] text-[clamp(14px,1.05vw,16px)] leading-relaxed text-[var(--gz-ink-300)]">
                  {step.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative full-bleed interstitial banner — a 4-slide crossfade,
          matching the design's beat between Process and Inquiry. */}
      <div className="reveal relative mt-16 h-[clamp(280px,52vw,620px)] overflow-hidden bg-[var(--gz-ink-900)] md:mt-24">
        {slides.map((s, i) => (
          <div
            key={s.src}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              className="object-cover"
              style={{ filter: 'contrast(1.02) saturate(1.04) brightness(0.96)' }}
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(11,10,9,0.72)] to-transparent" />
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 md:p-11">
          <h2 className="m-0 max-w-[70%] text-left text-[16vw] font-normal uppercase leading-[0.86] tracking-[0.02em] text-[var(--gz-paper-050)] md:max-w-none md:text-[9vw] [font-family:var(--font-gz-display)]">
            Dominate.
          </h2>
          <div className="flex flex-col items-start gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-300)] md:flex-row md:items-end md:justify-between md:gap-0">
            <span>Gorillaz Tattoo Art — Studio floor</span>
            <span>The Philippines</span>
          </div>
        </div>
      </div>
    </section>
  )
}

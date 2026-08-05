import Image from 'next/image'

/**
 * Aftercare hero — full-bleed studio photo with a slow Ken Burns zoom (the
 * `gz-kenburns` keyframes defined in styles/gz-tokens.css) desaturated and
 * darkened under a bottom gradient. Server Component, same static-entrance
 * convention as the homepage's Hero.
 */
export function Hero() {
  return (
    <section
      id="aftercare"
      role="region"
      aria-label="Tattoo aftercare"
      className="relative flex min-h-[min(78svh,760px)] flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-[clamp(72px,10vw,132px)] pt-[clamp(148px,22vh,240px)] text-center md:px-16"
    >
      <div className="absolute inset-0 z-0">
        <div className="gz-kenburns absolute inset-0 [animation:gz-kenburns_34s_var(--gz-ease-in-out)_infinite_alternate] [filter:grayscale(1)_contrast(1.1)_brightness(0.7)]">
          <Image
            src="/images/studio/studio-tattooing.jpg"
            alt="Tattoo session in progress at Gorillaz Tattoo Art"
            title="Gorillaz Tattoo Art — aftercare"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,10,9,0.72),rgba(11,10,9,0.58)_42%,var(--gz-ink-950))]" />
      </div>

      <div className="relative z-[1] flex flex-col items-center gap-[clamp(14px,2vw,24px)]">
        <span className="animate-rise font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
          Tattoo aftercare
        </span>
        <h1
          className="animate-rise m-0 text-[clamp(54px,10.5vw,164px)] font-normal uppercase leading-[0.86] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]"
          style={{ animationDelay: '80ms' }}
        >
          Heal it right
        </h1>
        <p
          className="animate-rise m-0 max-w-[52ch] text-pretty text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--gz-ink-200)]"
          style={{ animationDelay: '160ms' }}
        >
          Good aftercare is what separates a tattoo that still reads well in
          ten years from one that fades and blurs. Here is exactly how to
          look after yours.
        </p>
      </div>
    </section>
  )
}

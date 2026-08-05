/**
 * Geometric line divider between the Inquiry and FAQ sections — a faint
 * zigzag stroke across the full width with a bright copper glow that
 * continuously runs along it, echoing the animated-outline treatment used
 * on the other sections' geometric shapes (see tokens.css's gz-arc-full).
 */
export function Divider() {
  const zigzag = 'M0,30 L120,10 L240,50 L360,10 L480,50 L600,10 L720,50 L840,10 L960,50 L1080,10 L1200,50 L1320,10 L1440,30'

  return (
    <div aria-hidden="true" className="relative w-full py-2 md:py-4">
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="h-10 w-full md:h-14"
      >
        <path d={zigzag} fill="none" stroke="var(--gz-border-default)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path
          d={zigzag}
          fill="none"
          stroke="var(--gz-copper-500)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          pathLength={300}
          strokeDasharray="40 260"
          className="[animation:gz-line-run_4.5s_linear_infinite]"
          style={{ filter: 'drop-shadow(0 0 5px rgba(196,98,43,0.85)) drop-shadow(0 0 12px rgba(196,98,43,0.5))' }}
        />
      </svg>
    </div>
  )
}

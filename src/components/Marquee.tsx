const PHRASES = [
  'custom ink design',
  'blackwork',
  'fine line',
  'filipino tribal',
  'script',
  'realism',
]

export default function Marquee() {
  const items = [...PHRASES, ...PHRASES]

  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden bg-black border-y border-white/10 py-10 md:py-16"
    >
      <div className="animate-marquee flex items-center whitespace-nowrap w-max">
        {items.map((phrase, index) => (
          <span key={index} className="flex items-center">
            <span className="hero-title text-white/80 text-2xl md:text-4xl font-medium">
              {phrase}
            </span>
            <span className="mx-6 md:mx-10 inline-block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-white/40" />
          </span>
        ))}
      </div>
    </div>
  )
}

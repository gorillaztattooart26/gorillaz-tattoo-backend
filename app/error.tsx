'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-black px-6 pt-24 text-center md:pt-32">
      <p className="text-xs md:text-sm text-white/50 uppercase tracking-widest">something went wrong</p>
      <h1 className="hero-title text-white font-medium text-[12vw] md:text-[5vw]">we hit a snag</h1>
      <p className="max-w-md text-sm leading-relaxed text-white/60">
        Sorry about that — an unexpected error occurred. Try again, or head
        back to the homepage.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
      >
        try again
      </button>
    </div>
  )
}

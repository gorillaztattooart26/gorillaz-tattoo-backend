import { useEffect } from 'react'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Portfolio from './components/Portfolio'
import Artists from './components/Artists'
import Studio from './components/Studio'
import Booking from './components/Booking'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function App() {
  useEffect(() => {
    let pending = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))

    const check = () => {
      if (pending.length === 0) return
      const viewportHeight = window.innerHeight
      pending = pending.filter((el) => {
        const rect = el.getBoundingClientRect()
        const inView = rect.top < viewportHeight - 40 && rect.bottom > 0
        if (inView) el.classList.add('is-visible')
        return !inView
      })
      if (pending.length === 0) {
        window.removeEventListener('scroll', check)
        window.removeEventListener('resize', check)
        clearInterval(interval)
      }
    }

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    // fallback for environments that throttle scroll events
    const interval = setInterval(check, 250)
    check()

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      clearInterval(interval)
    }
  }, [])

  return (
    <main>
      <Hero />
      <Marquee />
      <Portfolio />
      <Artists />
      <Studio />
      <Booking />
      <FAQ />
      <Footer />
    </main>
  )
}

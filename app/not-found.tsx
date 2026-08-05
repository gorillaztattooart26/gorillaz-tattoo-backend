import { CtaPill } from '@/components/common/CtaPill'
import { ROUTES } from '@/lib/routes'
import '@/styles/gz-tokens.css'

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[var(--gz-ink-950)] px-6 pt-24 text-center md:pt-32">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)] md:text-sm">404</p>
      <h1 className="hero-title text-[14vw] font-normal uppercase text-[var(--gz-paper-050)] md:text-[6vw]">
        Page not found
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--gz-ink-300)]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <CtaPill as="link" href={ROUTES.home} className="mt-2">
        Back to home
      </CtaPill>
    </div>
  )
}

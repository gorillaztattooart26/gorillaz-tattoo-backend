import type { Metadata } from 'next'
import Image from 'next/image'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { SectionHeading } from '@/components/common/SectionHeading'
import { AftercareSteps } from '@/components/aftercare/AftercareSteps'
import { HealingSalveProduct } from '@/components/aftercare/HealingSalveProduct'
import { BeforeAfterGallery } from '@/components/aftercare/BeforeAfterGallery'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Tattoo Aftercare',
  description:
    'Step-by-step tattoo aftercare instructions from gorillaz tattoo art — how to clean, moisturize, and heal your new tattoo, plus our in-studio healing salve.',
  path: ROUTES.aftercare,
})

export default function AftercarePage() {
  return (
    <div className="relative w-full bg-black">
      <section className="relative flex min-h-[65vh] w-full items-center justify-center overflow-hidden px-6 pt-28 pb-16 md:min-h-[75vh] md:px-10 md:pt-32">
        <Image
          src="/images/studio/studio-interior.jpg"
          alt="inside gorillaz tattoo art — custom tattoo studio in the Philippines"
          title="Gorillaz Tattoo Art studio"
          fill
          priority
          sizes="100vw"
          className="object-cover grayscale"
        />
        <div className="absolute inset-0 bg-black/85" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />

        <div className="reveal relative z-10 flex flex-col items-center text-center">
          <Breadcrumbs
            entries={[
              { name: 'Home', path: ROUTES.home },
              { name: 'Aftercare', path: ROUTES.aftercare },
            ]}
          />

          <SectionHeading
            eyebrow="tattoo aftercare"
            className="mt-8"
            headingClassName="first-letter:uppercase text-center text-[12vw] md:text-[6vw]"
          >
            heal it right
          </SectionHeading>
          <p className="mt-6 max-w-lg text-[15px] leading-snug text-white/70">
            Good aftercare is what separates a tattoo that looks great in ten
            years from one that fades and blurs. Here&apos;s exactly how to
            take care of yours.
          </p>
        </div>
      </section>

      <AftercareSteps />
      <HealingSalveProduct />
      <BeforeAfterGallery />
    </div>
  )
}

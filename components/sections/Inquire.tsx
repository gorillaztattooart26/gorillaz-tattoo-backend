import { InquireForm } from '@/components/sections/InquireForm'
import { getGalleryItems } from '@/lib/gallery'

/** Homepage inquiry section. The heading is static; the form is a client island. */
export async function Inquire() {
  const galleryItems = await getGalleryItems()

  return (
    <section
      id="inquire"
      role="region"
      aria-label="Send a tattoo inquiry to Gorillaz Tattoo Art"
      className="relative w-full bg-[var(--gz-ink-950)] py-16 md:py-24"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-8 px-6 md:gap-14 md:px-16">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
              Inquiry form
            </span>
            <h2 className="m-0 text-[9vw] font-normal uppercase leading-[0.92] tracking-[0.006em] text-[var(--gz-paper-050)] md:text-[4.4vw] [font-family:var(--font-gz-display)]">
              Tell us your idea
            </h2>
          </div>
        </div>

        <InquireForm galleryItems={galleryItems} />
      </div>
    </section>
  )
}

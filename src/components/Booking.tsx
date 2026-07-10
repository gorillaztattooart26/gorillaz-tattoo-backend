import { useState } from 'react'

const ARTIST_OPTIONS = [
  'no preference',
  'andrea santos',
  'miko reyes',
  'joaquin dela cruz',
]

const STYLE_OPTIONS = [
  'blackwork',
  'fine line',
  'script',
  'realism',
  'filipino tribal',
  'neo traditional',
  'traditional bodysuit',
  'other',
]

const SIZE_OPTIONS = [
  'small (2–4 in)',
  'medium (4–8 in)',
  'large (8–12 in)',
  'extra large / full piece',
]

const fieldClasses =
  'w-full bg-neutral-900/90 text-white text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/40 focus:ring-1 focus:ring-white/40'

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3.5 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]'

function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M7 7L17 17M17 17V8M17 17H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SelectField({
  value,
  onChange,
  options,
  srLabel,
  capitalize = false,
}: {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  srLabel: string
  capitalize?: boolean
}) {
  return (
    <label className="block relative">
      <span className="sr-only">{srLabel}</span>
      <select
        value={value}
        onChange={onChange}
        className={`${fieldClasses} appearance-none pr-11 ${capitalize ? 'capitalize' : ''}`}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-neutral-900">
            {option}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
    </label>
  )
}

export default function Booking() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    artist: ARTIST_OPTIONS[0],
    style: STYLE_OPTIONS[0],
    placement: '',
    size: SIZE_OPTIONS[0],
    date: '',
    idea: '',
  })
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null)

  const update =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fileNames = referenceFiles
      ? Array.from(referenceFiles)
          .map((file) => file.name)
          .join(', ')
      : 'none attached — please email images separately'

    const subject = encodeURIComponent(
      `tattoo inquiry — ${form.fullName || 'new client'}`,
    )
    const body = encodeURIComponent(
      `full name: ${form.fullName}\n` +
        `email: ${form.email}\n` +
        `phone: ${form.phone}\n` +
        `preferred artist: ${form.artist}\n` +
        `tattoo style: ${form.style}\n` +
        `placement: ${form.placement}\n` +
        `estimated size: ${form.size}\n` +
        `preferred appointment date: ${form.date}\n` +
        `reference images: ${fileNames}\n\n` +
        `tattoo idea:\n${form.idea}`,
    )
    window.location.href = `mailto:bookings@gorillaztattoo.art?subject=${subject}&body=${body}`
  }

  return (
    <section
      id="booking"
      role="region"
      aria-label="Book a tattoo session at Gorillaz Tattoo Art"
      className="relative w-full bg-black px-6 md:px-10 py-24 md:py-32"
    >
      <div className="reveal flex items-end gap-4 mb-12 md:mb-16">
        <h2 className="hero-title uppercase text-white font-medium text-[13vw] md:text-[4.2vw] leading-[0.95]">
          ready to
          <br />
          get tattooed?
        </h2>
        <ArrowIcon className="mb-1 md:mb-2 h-8 w-8 md:h-12 md:w-12 shrink-0 text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
        <form
          onSubmit={handleSubmit}
          aria-label="Tattoo inquiry form"
          className="reveal lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <label className="block">
            <span className="sr-only">full name</span>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="Full Name"
              className={fieldClasses}
            />
          </label>

          <label className="block">
            <span className="sr-only">email address</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="Email Address"
              className={fieldClasses}
            />
          </label>

          <label className="block">
            <span className="sr-only">phone number</span>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={update('phone')}
              placeholder="Phone Number"
              className={fieldClasses}
            />
          </label>

          <SelectField
            value={form.artist}
            onChange={update('artist')}
            options={ARTIST_OPTIONS}
            srLabel="preferred artist"
            capitalize
          />

          <SelectField
            value={form.style}
            onChange={update('style')}
            options={STYLE_OPTIONS}
            srLabel="tattoo style"
            capitalize
          />

          <label className="block">
            <span className="sr-only">tattoo placement</span>
            <input
              type="text"
              required
              value={form.placement}
              onChange={update('placement')}
              placeholder="Tattoo Placement (e.g. forearm)"
              className={fieldClasses}
            />
          </label>

          <SelectField
            value={form.size}
            onChange={update('size')}
            options={SIZE_OPTIONS}
            srLabel="estimated size"
          />

          <label className="block">
            <span className="sr-only">preferred appointment date</span>
            <input
              type="date"
              value={form.date}
              onChange={update('date')}
              className={fieldClasses}
            />
          </label>

          <label className="block sm:col-span-2 cursor-pointer">
            <span className="sr-only">reference images upload</span>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/30 bg-neutral-900/90 px-4 py-3 text-sm text-white/50 hover:border-white/50 transition-colors">
              <span>
                {referenceFiles && referenceFiles.length > 0
                  ? `${referenceFiles.length} file(s) selected`
                  : 'Reference Images Upload'}
              </span>
              <span className="text-xs text-white/40">browse</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setReferenceFiles(e.target.files)}
              className="hidden"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="sr-only">tell us about your tattoo idea</span>
            <textarea
              required
              value={form.idea}
              onChange={update('idea')}
              placeholder="Tell Us About Your Tattoo Idea — style, size, placement, references"
              rows={5}
              className={`${fieldClasses} resize-none`}
            />
          </label>

          <button
            type="submit"
            className={`${primaryButtonClasses} sm:col-span-2 mt-2`}
          >
            send inquiry
            <ArrowIcon />
          </button>
        </form>

        <div className="reveal flex flex-col items-start gap-4 rounded-2xl border border-[#fabb42]/30 bg-[#fabb42]/5 p-8">
          <p className="text-[#fabb42] text-sm font-semibold uppercase tracking-wide">
            heads up
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            We currently only take inquiries submitted through this form —
            no walk-ins or phone bookings. Send us your idea and we&apos;ll
            reply within 48 hours with availability and a quote.
          </p>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ARTIST_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from '@/components/booking/options'
import { submitInquiryAction } from '@/components/booking/actions'
import { INQUIRY_HONEYPOT_FIELD } from '@/components/booking/schema'
import { CtaPill } from '@/components/common/CtaPill'
import { FieldGroup, SelectField, fieldClasses } from '@/components/common/FormField'
import { ArtistWorkModal } from '@/components/portfolio/ArtistWorkModal'
import { artistNameKey } from '@/utils/artistName'
import type { BookingFormValues } from '@/types/booking'
import type { GalleryItem } from '@/types/gallery'
import { cn } from '@/utils/cn'

const INITIAL_VALUES: BookingFormValues = {
  fullName: '',
  email: '',
  phone: '',
  preferredContactMethod: CONTACT_METHOD_OPTIONS[0],
  artist: ARTIST_OPTIONS[0],
  style: STYLE_OPTIONS[0],
  placement: '',
  size: SIZE_OPTIONS[0],
  height: '',
  weight: '',
  idea: '',
}

/**
 * The homepage inquiry form — wired to the same backend as the /booking
 * page's BookingForm (components/booking/BookingForm.tsx): submitInquiryAction
 * writes to Supabase `inquiries`/`inquiry_images` and triggers the same
 * two Resend emails, then redirects to /thank-you on success.
 */
export function InquireForm({ galleryItems }: { galleryItems: GalleryItem[] }) {
  const [form, setForm] = useState<BookingFormValues>(INITIAL_VALUES)
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false)
  // Honeypot — invisible to real visitors, so it stays empty for them; a
  // populated value signals an automated submission (see actions.ts).
  const honeypotRef = useRef<HTMLInputElement>(null)

  const hasChosenArtist = form.artist !== ARTIST_OPTIONS[0]
  const selectedArtistItems = useMemo(() => {
    if (!hasChosenArtist) return []
    const targetKey = artistNameKey(form.artist)
    return galleryItems.filter((item) => artistNameKey(item.artistName) === targetKey)
  }, [galleryItems, form.artist, hasChosenArtist])

  const update =
    (key: keyof BookingFormValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    for (const [key, value] of Object.entries(form)) {
      formData.append(key, value)
    }
    if (referenceFiles) {
      Array.from(referenceFiles).forEach((file) => formData.append('referenceImages', file))
    }
    formData.append(INQUIRY_HONEYPOT_FIELD, honeypotRef.current?.value ?? '')

    const result = await submitInquiryAction(formData)
    // On success the action redirects and this component unmounts, so
    // reaching here means something needs the visitor's attention.
    if (result?.error) {
      setSubmitError(result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <>
    <form onSubmit={handleSubmit} aria-label="Tattoo inquiry form" className="reveal flex flex-col gap-6 md:gap-8">
      {/* Honeypot — visually hidden off-screen (not display:none, which
          some bots detect and skip), never focusable/announced. Real
          visitors never see or fill this; the actual security check
          happens server-side in actions.ts regardless. */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor={INQUIRY_HONEYPOT_FIELD}>Leave this field blank</label>
        <input
          ref={honeypotRef}
          type="text"
          id={INQUIRY_HONEYPOT_FIELD}
          name={INQUIRY_HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <FieldGroup label="01 — Who you are">
          <input
            type="text"
            required
            value={form.fullName}
            onChange={update('fullName')}
            placeholder="Full name"
            aria-label="Full name"
            className={fieldClasses}
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            placeholder="Email address"
            aria-label="Email address"
            className={fieldClasses}
          />
          <input
            type="tel"
            required
            value={form.phone}
            onChange={update('phone')}
            placeholder="Phone number"
            aria-label="Phone number"
            className={fieldClasses}
          />
          <SelectField
            value={form.preferredContactMethod}
            onChange={update('preferredContactMethod')}
            options={CONTACT_METHOD_OPTIONS}
            srLabel="Preferred contact method"
          />
        </FieldGroup>

        <FieldGroup label="02 — The piece">
          <SelectField
            value={form.artist}
            onChange={update('artist')}
            options={ARTIST_OPTIONS}
            srLabel="Preferred tattoo artist"
          />
          {hasChosenArtist && (
            <button
              type="button"
              onClick={() => setIsWorkModalOpen(true)}
              className="-mt-1 flex items-center justify-center gap-1.5 self-center font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-copper-300)] transition-colors hover:text-[var(--gz-copper-500)]"
            >
              View artist work
              <span aria-hidden>→</span>
            </button>
          )}
          <SelectField
            value={form.style}
            onChange={update('style')}
            options={STYLE_OPTIONS}
            srLabel="Tattoo style"
          />
          <input
            type="text"
            required
            value={form.placement}
            onChange={update('placement')}
            placeholder="Placement (e.g. forearm)"
            aria-label="Tattoo placement"
            className={fieldClasses}
          />
          <SelectField
            value={form.size}
            onChange={update('size')}
            options={SIZE_OPTIONS}
            srLabel="Approximate size"
          />
          <div className="flex gap-3.5">
            <input
              type="text"
              value={form.height}
              onChange={update('height')}
              placeholder="Height"
              aria-label="Height"
              className={fieldClasses}
            />
            <input
              type="text"
              value={form.weight}
              onChange={update('weight')}
              placeholder="Weight"
              aria-label="Weight"
              className={fieldClasses}
            />
          </div>
        </FieldGroup>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--gz-copper-500)] bg-gradient-to-b from-[rgba(196,98,43,0.09)] to-[rgba(196,98,43,0.02)] p-5 md:col-span-2 md:p-7 lg:col-span-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#e0a32b]">
            Heads up
          </span>
          <p className="m-0 text-pretty text-[15px] leading-relaxed text-[var(--gz-ink-200)]">
            We only take inquiries through this form — no walk-ins or phone bookings.
            Send us your idea and we reply within 48 hours with availability and a
            quote.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4 md:gap-6">
        <label className="flex min-h-0 flex-1 cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-[var(--gz-border-default)] px-5 py-6 text-[var(--gz-ink-400)] transition-colors hover:border-[var(--gz-border-strong)] hover:text-[var(--gz-ink-200)] md:min-w-[260px]">
          <span className="text-sm">
            {referenceFiles && referenceFiles.length > 0
              ? `${referenceFiles.length} file(s) selected`
              : 'Reference images'}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-500)]">
            Browse
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setReferenceFiles(e.target.files)}
            className="hidden"
          />
        </label>

        <textarea
          required
          value={form.idea}
          onChange={update('idea')}
          placeholder="Tell us about your tattoo idea — style, size, placement, references"
          aria-label="Tattoo brief"
          rows={5}
          className={cn(
            fieldClasses,
            'flex-[2] min-w-[260px] resize-none rounded-xl py-5',
          )}
        />
      </div>

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[var(--gz-border-subtle)] pt-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
          Reply within 48 hours
        </span>
        <CtaPill as="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send inquiry'}
        </CtaPill>
      </div>
    </form>

    <ArtistWorkModal
      open={isWorkModalOpen}
      onClose={() => setIsWorkModalOpen(false)}
      artistLabel={form.artist}
      items={selectedArtistItems}
    />
    </>
  )
}

'use client'

import { useRef, useState } from 'react'
import { CtaPill } from '@/components/common/CtaPill'
import { FieldGroup, SelectField, fieldClasses } from '@/components/common/FormField'
import {
  ARTIST_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from '@/components/booking/options'
import { submitInquiryAction } from '@/components/booking/actions'
import { INQUIRY_HONEYPOT_FIELD } from '@/components/booking/schema'
import type { BookingFormValues } from '@/types/booking'
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
 * The tattoo inquiry form. Isolated as its own Client Component so the rest
 * of the Booking section (heading, notice panel) stays server-rendered.
 * Submission is a Server Action (components/booking/actions.ts) that saves
 * the inquiry + reference images to Supabase and redirects to /thank-you
 * on success — this component only builds the FormData and reports errors.
 */
export function BookingForm() {
  const [form, setForm] = useState<BookingFormValues>(INITIAL_VALUES)
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Honeypot — invisible to real visitors, so it stays empty for them; a
  // populated value signals an automated submission (see actions.ts).
  const honeypotRef = useRef<HTMLInputElement>(null)

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
    <form
      onSubmit={handleSubmit}
      aria-label="Tattoo inquiry form"
      className="reveal lg:col-span-2 flex flex-col gap-4"
    >
      {/* Honeypot — visually hidden off-screen (not display:none, which
          some bots detect and skip), never focusable/announced. Real
          visitors never see or fill this; the actual security check
          happens server-side in actions.ts regardless. */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor={`${INQUIRY_HONEYPOT_FIELD}-booking`}>Leave this field blank</label>
        <input
          ref={honeypotRef}
          type="text"
          id={`${INQUIRY_HONEYPOT_FIELD}-booking`}
          name={INQUIRY_HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>

      <div className="flex flex-wrap items-start gap-4">
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
          className={cn(fieldClasses, 'flex-[2] min-w-[260px] resize-none rounded-xl py-5')}
        />
      </div>

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <CtaPill
        as="button"
        type="submit"
        disabled={isSubmitting}
        className="mt-2 self-start"
      >
        {isSubmitting ? 'Sending…' : 'Send inquiry'}
      </CtaPill>
    </form>
  )
}

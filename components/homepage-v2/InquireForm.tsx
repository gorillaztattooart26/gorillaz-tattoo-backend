'use client'

import { useState } from 'react'
import {
  ARTIST_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from '@/components/booking/options'
import { submitInquiryAction } from '@/components/booking/actions'
import { CtaPill } from '@/components/homepage-v2/CtaPill'
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

const fieldClasses =
  'w-full rounded-[var(--gz-radius-pill)] border border-[var(--gz-border-subtle)] bg-[var(--gz-ink-900)] px-5 py-[13px] text-sm text-[var(--gz-paper-050)] outline-none placeholder:text-[var(--gz-ink-400)] transition-colors duration-150 ease-out focus:border-[var(--gz-copper-500)] focus:ring-2 focus:ring-[rgba(196,98,43,0.22)]'

const selectClasses = cn(fieldClasses, 'appearance-none capitalize pr-11')

const cardClasses =
  'flex flex-col gap-3.5 rounded-xl border border-[var(--gz-border-subtle)] p-5 md:p-7'

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cardClasses}>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
        {label}
      </span>
      {children}
    </div>
  )
}

function SelectField({
  value,
  onChange,
  options,
  srLabel,
}: {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  srLabel: string
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{srLabel}</span>
      <select value={value} onChange={onChange} className={selectClasses}>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[var(--gz-ink-900)]">
            {option}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[var(--gz-ink-400)]"
      >
        ▾
      </span>
    </label>
  )
}

/**
 * The /homepage-v2 inquiry form — visually its own thing, but wired to the
 * exact same backend as the real homepage's BookingForm
 * (components/booking/BookingForm.tsx, untouched): submitInquiryAction
 * writes to Supabase `inquiries`/`inquiry_images` and triggers the same
 * two Resend emails, then redirects to /thank-you on success. Only the
 * JSX/styling here is new.
 */
export function InquireForm() {
  const [form, setForm] = useState<BookingFormValues>(INITIAL_VALUES)
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

    const result = await submitInquiryAction(formData)
    // On success the action redirects and this component unmounts, so
    // reaching here means something needs the visitor's attention.
    if (result?.error) {
      setSubmitError(result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Tattoo inquiry form" className="reveal flex flex-col gap-6 md:gap-8">
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
  )
}

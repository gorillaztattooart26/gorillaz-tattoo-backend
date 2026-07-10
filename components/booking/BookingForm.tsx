'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/Select'
import { fieldClasses } from '@/components/ui/fieldStyles'
import { ArrowIcon } from '@/components/common/icons'
import {
  ARTIST_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from '@/components/booking/options'
import { submitBookingInquiry } from '@/services/booking'
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

const primaryButtonClasses =
  'inline-flex items-center justify-center gap-2 bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3.5 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]'

/**
 * The tattoo inquiry form. Isolated as its own Client Component so the rest
 * of the Booking section (heading, notice panel) stays server-rendered.
 * `submitBookingInquiry` is the seam a future Supabase/PayMongo/Resend
 * integration will replace — this component only depends on its signature.
 */
export function BookingForm() {
  const [form, setForm] = useState<BookingFormValues>(INITIAL_VALUES)
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null)

  const update =
    (key: keyof BookingFormValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitBookingInquiry({
      ...form,
      referenceFileNames: referenceFiles ? Array.from(referenceFiles).map((file) => file.name) : [],
    })
  }

  return (
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

      <Select
        value={form.preferredContactMethod}
        onChange={update('preferredContactMethod')}
        options={CONTACT_METHOD_OPTIONS}
        srLabel="preferred contact method"
        capitalize
      />

      <Select
        value={form.artist}
        onChange={update('artist')}
        options={ARTIST_OPTIONS}
        srLabel="preferred artist"
        capitalize
      />

      <Select
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

      <div className="sm:col-span-2 grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <Select
            value={form.size}
            onChange={update('size')}
            options={SIZE_OPTIONS}
            srLabel="estimated size"
          />
        </div>

        <label className="block col-span-1">
          <span className="sr-only">height</span>
          <input
            type="text"
            value={form.height}
            onChange={update('height')}
            placeholder="Height"
            className={fieldClasses}
          />
        </label>

        <label className="block col-span-1">
          <span className="sr-only">weight</span>
          <input
            type="text"
            value={form.weight}
            onChange={update('weight')}
            placeholder="Weight"
            className={fieldClasses}
          />
        </label>
      </div>

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
          className={cn(fieldClasses, 'resize-none')}
        />
      </label>

      <button type="submit" className={cn(primaryButtonClasses, 'sm:col-span-2 mt-2')}>
        send inquiry
        <ArrowIcon />
      </button>
    </form>
  )
}

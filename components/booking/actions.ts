'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { inquirySchema, INQUIRY_HONEYPOT_FIELD } from '@/components/booking/schema'
import { sendInquiryConfirmationEmail, sendStaffNewInquiryNotification } from '@/lib/emails'
import { getRequestMeta } from '@/lib/url'
import { checkRateLimit, buildInquiryIpKey, buildInquiryEmailKey } from '@/lib/rate-limit'

const REFERENCES_BUCKET = 'references'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_REFERENCE_IMAGES = 5

const INQUIRY_IP_WINDOW_SECONDS = 10 * 60
const INQUIRY_IP_MAX_ATTEMPTS = 5
const INQUIRY_EMAIL_WINDOW_SECONDS = 60 * 60
const INQUIRY_EMAIL_MAX_ATTEMPTS = 3

const RATE_LIMIT_ERROR = 'Too many requests. Please wait a few minutes and try again.'
// Deliberately the same shape as a normal validation failure — a bot that
// trips the honeypot gets no signal that it was specifically detected.
const GENERIC_VALIDATION_ERROR = 'Please check the form and try again.'

export interface SubmitInquiryResult {
  error: string
}

/**
 * Handles the homepage inquiry form. Validates, saves the inquiry, then
 * uploads any reference images to the private `references` bucket and
 * links them via `inquiry_images`. Returns `{ error }` for anything the
 * visitor should see and correct; redirects to /thank-you on success.
 *
 * Requires the Supabase project's RLS policies (on `inquiries`,
 * `inquiry_images`) and Storage policy (on the `references` bucket) to
 * allow INSERT for the `anon` role — this is a public, no-login form.
 */
export async function submitInquiryAction(
  formData: FormData,
): Promise<SubmitInquiryResult | void> {
  // Honeypot check first, before any parsing/validation work — a real
  // visitor's browser never populates this field (it's hidden off-screen,
  // see InquireForm.tsx / BookingForm.tsx), so any value here means an
  // automated submission. The CSS hiding is just bait, not the security
  // boundary — this server-side check is what actually stops it, and it
  // runs before any DB, Storage, or email side effect.
  const honeypotValue = String(formData.get(INQUIRY_HONEYPOT_FIELD) ?? '').trim()
  if (honeypotValue.length > 0) {
    return { error: GENERIC_VALIDATION_ERROR }
  }

  const raw = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    preferredContactMethod: String(formData.get('preferredContactMethod') ?? ''),
    artist: String(formData.get('artist') ?? ''),
    style: String(formData.get('style') ?? ''),
    placement: String(formData.get('placement') ?? ''),
    size: String(formData.get('size') ?? ''),
    height: String(formData.get('height') ?? ''),
    weight: String(formData.get('weight') ?? ''),
    idea: String(formData.get('idea') ?? ''),
  }

  const parsed = inquirySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }

  const files = formData
    .getAll('referenceImages')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length > MAX_REFERENCE_IMAGES) {
    return { error: `You can attach up to ${MAX_REFERENCE_IMAGES} reference images.` }
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { error: `${file.name} isn't an image file.` }
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `${file.name} is larger than 10MB.` }
    }
  }

  // Rate-limited on both the requester's IP and the (normalized) email
  // they supplied — either one exceeding its own window blocks the
  // submission, and the response doesn't reveal which one tripped. IP
  // alone would over-block shared networks and under-block an attacker who
  // simply rotates IPs; email alone would let an attacker flood from one
  // IP using a fresh made-up address each time. Checked here, after
  // validation but before any DB/Storage/email side effect, per the
  // approved design.
  const { ip } = await getRequestMeta()
  const normalizedEmail = parsed.data.email.trim().toLowerCase()

  const [ipCheck, emailCheck] = await Promise.all([
    ip
      ? checkRateLimit({
          key: buildInquiryIpKey(ip),
          windowSeconds: INQUIRY_IP_WINDOW_SECONDS,
          maxAttempts: INQUIRY_IP_MAX_ATTEMPTS,
        })
      : Promise.resolve({ allowed: true }),
    checkRateLimit({
      key: buildInquiryEmailKey(normalizedEmail),
      windowSeconds: INQUIRY_EMAIL_WINDOW_SECONDS,
      maxAttempts: INQUIRY_EMAIL_MAX_ATTEMPTS,
    }),
  ])

  if (!ipCheck.allowed || !emailCheck.allowed) {
    return { error: RATE_LIMIT_ERROR }
  }

  // Generated here (rather than read back via `.select()` after insert) so
  // the anon role only ever needs INSERT permission on `inquiries` — never
  // SELECT. That keeps customer inquiry data completely unreadable to the
  // public form, which only needs to create rows, never read them back.
  const inquiryId = crypto.randomUUID()

  const { error: insertError } = await supabase.from('inquiries').insert({
    id: inquiryId,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    preferred_contact: parsed.data.preferredContactMethod,
    preferred_artist: parsed.data.artist,
    tattoo_type: parsed.data.style,
    placement: parsed.data.placement,
    size: parsed.data.size,
    height: parsed.data.height,
    weight: parsed.data.weight,
    message: parsed.data.idea,
  })

  if (insertError) {
    console.error('[inquiries] insert failed:', insertError)
    return { error: 'Something went wrong submitting your inquiry. Please try again.' }
  }

  await Promise.all([
    sendInquiryConfirmationEmail({ to: parsed.data.email, fullName: parsed.data.fullName }),
    sendStaffNewInquiryNotification({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      preferredArtist: parsed.data.artist,
      style: parsed.data.style,
      placement: parsed.data.placement,
      message: parsed.data.idea,
    }),
  ])

  for (const file of files) {
    const path = `${inquiryId}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(REFERENCES_BUCKET)
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      // The inquiry itself is already saved — a failed image upload
      // shouldn't lose the whole submission, just log and move on.
      console.error('[inquiries] reference image upload failed:', uploadError)
      continue
    }

    const { error: imageInsertError } = await supabase
      .from('inquiry_images')
      .insert({ inquiry_id: inquiryId, image_path: path })

    if (imageInsertError) {
      console.error('[inquiries] inquiry_images insert failed:', imageInsertError)
    }
  }

  redirect('/thank-you')
}

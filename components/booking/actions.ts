'use server'

import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { inquirySchema } from '@/components/booking/schema'
import { sendInquiryConfirmationEmail, sendStaffNewInquiryNotification } from '@/lib/emails'

const REFERENCES_BUCKET = 'references'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB

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

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { error: `${file.name} isn't an image file.` }
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `${file.name} is larger than 10MB.` }
    }
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

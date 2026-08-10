import { z } from 'zod'

/**
 * Hidden form field name shared between the client forms (InquireForm.tsx,
 * BookingForm.tsx) and the server action (actions.ts) that checks it. Any
 * real visitor never sees or fills this field — a populated value means an
 * automated submission. Not exported from actions.ts because a `'use
 * server'` file may only export async functions.
 */
export const INQUIRY_HONEYPOT_FIELD = 'portfolio_link'

/**
 * Validates the homepage inquiry form. Matches the `required` attributes
 * already on the inputs in BookingForm.tsx: fullName/email/phone/
 * placement/idea are required, height/weight are not (empty string is
 * normalized to `null` for the nullable DB columns).
 *
 * Length caps are generous — well beyond anything a real visitor would
 * type — and exist only to bound the size of a single submission, not to
 * constrain normal use.
 */
export const inquirySchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.').max(200, 'Full name is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('Enter a valid email address.')
    .max(254, 'Email is too long.'),
  phone: z.string().trim().min(1, 'Enter your phone number.').max(50, 'Phone number is too long.'),
  preferredContactMethod: z
    .string()
    .trim()
    .min(1, 'Select a preferred contact method.')
    .max(100, 'Preferred contact method is too long.'),
  artist: z.string().trim().min(1, 'Select a preferred artist.').max(200, 'Artist is too long.'),
  style: z.string().trim().min(1, 'Select a tattoo style.').max(200, 'Style is too long.'),
  placement: z.string().trim().min(1, 'Enter the tattoo placement.').max(200, 'Placement is too long.'),
  size: z.string().trim().min(1, 'Select an estimated size.').max(100, 'Size is too long.'),
  height: z
    .string()
    .trim()
    .max(50, 'Height is too long.')
    .transform((value) => (value.length > 0 ? value : null)),
  weight: z
    .string()
    .trim()
    .max(50, 'Weight is too long.')
    .transform((value) => (value.length > 0 ? value : null)),
  idea: z.string().trim().min(1, 'Tell us about your tattoo idea.').max(2000, 'Please keep your tattoo idea under 2000 characters.'),
})

export type InquiryFormValues = z.infer<typeof inquirySchema>

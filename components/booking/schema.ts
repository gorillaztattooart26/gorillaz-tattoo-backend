import { z } from 'zod'

/**
 * Validates the homepage inquiry form. Matches the `required` attributes
 * already on the inputs in BookingForm.tsx: fullName/email/phone/
 * placement/idea are required, height/weight are not (empty string is
 * normalized to `null` for the nullable DB columns).
 */
export const inquirySchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Enter your phone number.'),
  preferredContactMethod: z.string().trim().min(1, 'Select a preferred contact method.'),
  artist: z.string().trim().min(1, 'Select a preferred artist.'),
  style: z.string().trim().min(1, 'Select a tattoo style.'),
  placement: z.string().trim().min(1, 'Enter the tattoo placement.'),
  size: z.string().trim().min(1, 'Select an estimated size.'),
  height: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
  weight: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
  idea: z.string().trim().min(1, 'Tell us about your tattoo idea.'),
})

export type InquiryFormValues = z.infer<typeof inquirySchema>

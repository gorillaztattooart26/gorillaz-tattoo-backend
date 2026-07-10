import { z } from 'zod'

export const createBookingSchema = z.object({
  customerName: z.string().trim().min(2, 'Enter the customer’s full name.'),
  customerEmail: z.string().trim().email('Enter a valid email address.'),
  customerMobile: z.string().trim().min(7, 'Enter a valid mobile number.'),
  preferredContactMethod: z.enum(['email', 'sms', 'call', 'messenger']),

  artistSlug: z.string().min(1, 'Select an artist.'),

  tattooDescription: z.string().trim().min(10, 'Add a short description of the piece.'),
  tattooStyle: z.string().trim().min(1, 'Enter the tattoo style.'),
  placement: z.string().trim().min(1, 'Enter the placement.'),
  estimatedSize: z.string().trim().min(1, 'Enter the estimated size.'),
  estimatedSessionHours: z.coerce.number().min(0.5, 'Enter estimated hours per session.'),
  estimatedSessionCount: z.coerce.number().int().min(1, 'Enter the number of sessions.'),

  studioAddress: z.string().trim().min(5, 'Enter the studio address.'),
  appointmentDate: z.string().min(1, 'Select an appointment date.'),
  appointmentTime: z.string().trim().min(1, 'Enter an appointment time.'),
  consultationMethod: z.string().trim().min(1, 'Enter the consultation method.'),

  estimatedPrice: z.coerce.number().min(1, 'Enter the estimated price.'),
  downPaymentPercent: z.coerce.number().min(1).max(100),
})

/** Post-validation shape (numbers coerced) — what the server action receives. */
export type CreateBookingValues = z.infer<typeof createBookingSchema>
/** Pre-validation shape (raw form input, numeric fields still strings). */
export type CreateBookingFormInput = z.input<typeof createBookingSchema>

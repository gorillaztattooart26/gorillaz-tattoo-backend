import { z } from 'zod'

/**
 * `artistId` is optional at the schema level (a non-owner's form never
 * includes the field at all) — the Server Action enforces it's present
 * and valid when the caller is an owner, and never reads it otherwise.
 * See app/staff/(protected)/availability/actions.ts.
 */
export const createAvailabilityBlockSchema = z
  .object({
    artistId: z.string().uuid('Select an artist.').optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date.'),
    startTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Select a valid start time.'),
    endTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Select a valid end time.'),
    reason: z
      .string()
      .trim()
      .min(1, 'Enter a reason.')
      .max(500, 'Keep the reason under 500 characters.'),
  })
  .refine((values) => values.startTime < values.endTime, {
    message: 'Start time must be before end time.',
    path: ['endTime'],
  })

export type CreateAvailabilityBlockValues = z.infer<typeof createAvailabilityBlockSchema>

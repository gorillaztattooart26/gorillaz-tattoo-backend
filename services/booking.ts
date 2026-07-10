import type { BookingInquiryPayload } from '@/types/booking'
import { siteConfig } from '@/lib/site-config'

/**
 * Sends a tattoo inquiry. Currently composes a mailto: link (matching the
 * original behavior) — this is the seam future Supabase/PayMongo/Resend
 * calls will replace with a real POST to a server action / API route.
 * Callers only depend on this function's signature, not its internals.
 */
export function submitBookingInquiry(payload: BookingInquiryPayload): void {
  const fileNames =
    payload.referenceFileNames.length > 0
      ? payload.referenceFileNames.join(', ')
      : 'none attached — please email images separately'

  const subject = encodeURIComponent(
    `tattoo inquiry — ${payload.fullName || 'new client'}`,
  )
  const body = encodeURIComponent(
    `full name: ${payload.fullName}\n` +
      `email: ${payload.email}\n` +
      `phone: ${payload.phone}\n` +
      `preferred artist: ${payload.artist}\n` +
      `tattoo style: ${payload.style}\n` +
      `placement: ${payload.placement}\n` +
      `estimated size: ${payload.size}\n` +
      `height: ${payload.height}\n` +
      `weight: ${payload.weight}\n` +
      `reference images: ${fileNames}\n\n` +
      `tattoo idea:\n${payload.idea}`,
  )

  window.location.href = `mailto:${siteConfig.email}?subject=${subject}&body=${body}`
}

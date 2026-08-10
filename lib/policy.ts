/**
 * Single source of truth for the studio's reservation-payment policy.
 * Every customer-facing surface (homepage FAQ, booking FAQ, Terms &
 * Conditions, booking portal, cancelled-booking state, emails) quotes
 * these strings directly instead of an independently-worded copy, so
 * the policy can never drift out of sync between pages again.
 */
export const RESERVATION_POLICY_TERMS = [
  'Reservation payments are non-refundable.',
  "You may request to reschedule your appointment — this is subject to your assigned artist's approval and availability.",
  'If your artist approves the new date, your reservation payment remains valid.',
  'If your reschedule request is not approved, you cancel, you do not show up, or the booking is otherwise abandoned, the reservation payment is forfeited.',
  'When you attend your appointment, the reservation payment is deducted from your final tattoo price.',
] as const

/** The terms above joined into one flowing paragraph, for FAQ answers and prose contexts. */
export const RESERVATION_POLICY_PARAGRAPH = RESERVATION_POLICY_TERMS.join(' ')

/** Non-refundable + deducted-from-final-price only — for a short reminder right at the point of payment, where the full paragraph would be too long. */
export const RESERVATION_POLICY_SHORT = `${RESERVATION_POLICY_TERMS[0]} ${RESERVATION_POLICY_TERMS[4]}`

/**
 * Canonical waiver copy — the single source both the customer-facing
 * checkboxes (components/booking/WaiverCard.tsx) and the server-side
 * acceptance hash (computeWaiverHash in lib/booking.ts) read from. Never
 * duplicate this text elsewhere; edit it here and bump WAIVER_VERSION
 * below in the same change.
 */
export const WAIVER_ITEMS = [
  'I confirm that I have reviewed my tattoo details and agree to the Terms & Conditions.',
  'I understand that tattoos are permanent and I voluntarily consent to this booking.',
] as const

/**
 * The exact bytes hashed into `bookings.waiver_hash` — deliberately plain
 * text, never rendered HTML/JSX, so the hash is stable across styling or
 * markup changes and only moves when the actual waiver wording changes.
 * The join order/separator are part of this contract, not incidental
 * formatting — don't change how this is built without also bumping
 * WAIVER_VERSION, same as editing WAIVER_ITEMS itself.
 */
export const WAIVER_TEXT = WAIVER_ITEMS.join('\n')

/**
 * Version tag stamped onto every waiver acceptance record
 * (`bookings.waiver_version`), alongside the SHA-256 hash of WAIVER_TEXT
 * (`bookings.waiver_hash`) computed at that same moment. Bump this
 * whenever WAIVER_ITEMS changes — past acceptances keep the version *and*
 * hash they actually agreed to, so updating the wording is the only edit
 * required:
 *
 *   1. Edit WAIVER_ITEMS above.
 *   2. Bump this constant (e.g. 'v1.0' -> 'v1.1').
 *   3. Nothing else — WAIVER_TEXT and its hash update automatically. New
 *      bookings record the new version + new hash; existing bookings keep
 *      whatever they originally accepted.
 */
export const WAIVER_VERSION = 'v1.0'

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

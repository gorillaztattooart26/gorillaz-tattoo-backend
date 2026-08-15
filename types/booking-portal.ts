import type { Artist } from '@/types/artist'
import type { PaymentProviderName } from '@/types/payment'

export type BookingStatus =
  | 'awaiting_down_payment'
  | 'appointment_confirmed'
  | 'completed'
  | 'cancelled'

export type PreferredContactMethod = 'email' | 'sms' | 'call' | 'messenger'

export interface Customer {
  name: string
  email: string
  mobile: string
  preferredContactMethod: PreferredContactMethod
}

export interface Tattoo {
  description: string
  style: string
  placement: string
  estimatedSize: string
  estimatedSessionHours: number
  estimatedSessionCount: number
}

export interface Appointment {
  studioAddress: string
  date: string // ISO date, e.g. "2026-08-14"
  time: string // e.g. "2:00 PM"
  consultationMethod: string
  mapUrl: string
  directionsUrl: string
}

export interface Invoice {
  currency: string
  estimatedPrice: number
  downPaymentPercent: number
  downPaymentAmount: number
  remainingBalance: number
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Payment {
  id: string
  provider: PaymentProviderName
  method: string | null
  status: PaymentStatus
  amount: number
  paidAt: string | null
}

/**
 * Public-safe view of a booking's waiver acceptance — deliberately omits
 * `waiver_ip` / `waiver_user_agent`, which are staff/owner-only (see
 * lib/booking.ts's getBookingByToken, the only place this is constructed).
 */
export interface WaiverAcceptance {
  accepted: boolean
  version: string | null
  acceptedAt: string | null
}

export type TimelineStepStatus = 'complete' | 'current' | 'upcoming'

export interface TimelineStep {
  key: string
  label: string
  description: string
  status: TimelineStepStatus
  date: string | null
}

export interface Booking {
  /** Opaque, unguessable route token — e.g. /booking/[token]. Never a sequential ID. */
  token: string
  /** Human-friendly reference shown to the customer — NOT used for routing/lookup. */
  bookingId: string
  status: BookingStatus
  /** Whether staff have archived this booking — a booking can be archived at any status. Deliberately a boolean, not the raw `archived_at` timestamp: the customer-facing portal only ever needs to know whether payment is still possible, never when/by whom it was archived. */
  isArchived: boolean
  customer: Customer
  artist: Artist
  tattoo: Tattoo
  appointment: Appointment
  invoice: Invoice
  waiver: WaiverAcceptance
  payment: Payment | null
  timeline: TimelineStep[]
  createdAt: string
}

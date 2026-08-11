import { sendEmail } from '@/lib/emails/send'
import { resend } from '@/lib/resend'
import {
  inquiryConfirmationTemplate,
  bookingConfirmationTemplate,
  paymentReceiptTemplate,
  staffNewInquiryTemplate,
  staffPaymentReceivedTemplate,
  staffBookingCancelledTemplate,
  staffBookingRescheduledTemplate,
  customerBookingCancelledTemplate,
  customerBookingRescheduledTemplate,
  paymentDueReminderTemplate,
  appointment24hReminderTemplate,
  appointment2hReminderTemplate,
} from '@/lib/emails/templates'

export async function sendInquiryConfirmationEmail(params: {
  to: string
  fullName: string
}): Promise<void> {
  const { subject, html } = inquiryConfirmationTemplate({ fullName: params.fullName })
  await sendEmail({ to: params.to, subject, html })
}

export async function sendBookingConfirmationEmail(params: {
  to: string
  customerName: string
  bookingId: string
  bookingUrl: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): Promise<void> {
  const { subject, html, text } = bookingConfirmationTemplate(params)
  await sendEmail({ to: params.to, subject, html, text })
}

export async function sendPaymentReceiptEmail(params: {
  to: string
  customerName: string
  bookingId: string
  amount: number
  currency: string
  bookingUrl: string
}): Promise<void> {
  const { subject, html } = paymentReceiptTemplate(params)
  await sendEmail({ to: params.to, subject, html })
}

export async function sendStaffNewInquiryNotification(params: {
  fullName: string
  email: string
  phone: string
  preferredArtist: string
  style: string
  placement: string
  message: string
}): Promise<void> {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL
  if (!staffEmail) {
    console.error('[emails] STAFF_NOTIFICATION_EMAIL is not set — skipping staff notification.')
    return
  }

  const { subject, html } = staffNewInquiryTemplate(params)
  await sendEmail({ to: staffEmail, subject, html })
}

export async function sendStaffPaymentReceivedNotification(params: {
  bookingId: string
  customerName: string
  artistName: string
  amount: number
  currency: string
}): Promise<void> {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL
  if (!staffEmail) {
    console.error('[emails] STAFF_NOTIFICATION_EMAIL is not set — skipping staff notification.')
    return
  }

  const { subject, html } = staffPaymentReceivedTemplate(params)
  await sendEmail({ to: staffEmail, subject, html })
}

export async function sendStaffBookingCancelledNotification(params: {
  bookingId: string
  customerName: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  cancelledBy: string
}): Promise<void> {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL
  if (!staffEmail) {
    console.error('[emails] STAFF_NOTIFICATION_EMAIL is not set — skipping staff notification.')
    return
  }

  const { subject, html } = staffBookingCancelledTemplate(params)
  await sendEmail({ to: staffEmail, subject, html })
}

export async function sendStaffBookingRescheduledNotification(params: {
  bookingId: string
  customerName: string
  artistName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  rescheduledBy: string
}): Promise<void> {
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL
  if (!staffEmail) {
    console.error('[emails] STAFF_NOTIFICATION_EMAIL is not set — skipping staff notification.')
    return
  }

  const { subject, html } = staffBookingRescheduledTemplate(params)
  await sendEmail({ to: staffEmail, subject, html })
}

export async function sendCustomerBookingCancelledEmail(params: {
  to: string
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): Promise<void> {
  const { subject, html } = customerBookingCancelledTemplate(params)
  await sendEmail({ to: params.to, subject, html })
}

export async function sendCustomerBookingRescheduledEmail(params: {
  to: string
  customerName: string
  bookingId: string
  artistName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  bookingUrl: string
}): Promise<void> {
  const { subject, html } = customerBookingRescheduledTemplate(params)
  await sendEmail({ to: params.to, subject, html })
}

// ---------------------------------------------------------------------------
// Reminder delivery (Stage 3E) — unlike every sender above, these must
// report back what actually happened (sent / transient failure / permanent
// failure) so lib/reminders/deliver.ts can update the corresponding
// reminder_deliveries row correctly, and must pass a caller-supplied
// deterministic Resend idempotency key. sendEmail() (lib/emails/send.ts) is
// intentionally not reused here: it's fire-and-forget and always returns
// void, which is exactly right for every other email in this app (a failed
// notification must never block the booking/payment flow that triggered
// it) but is exactly wrong here, since Stage 3E needs the outcome to decide
// pending vs sent vs failed. `resend` itself is imported directly instead —
// still server-only, still the same shared client from lib/resend.ts.
// ---------------------------------------------------------------------------

const REMINDER_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

/**
 * Resend error codes that are worth retrying — transient by nature
 * (rate limiting, a momentary provider-side fault). Every other structured
 * error code Resend can return (invalid_from_address, validation_error,
 * missing_api_key, monthly_quota_exceeded, etc.) is treated as permanent:
 * retrying on the same bad input/configuration within the next few cron
 * cycles won't succeed, so those go straight to `failed` rather than
 * silently retrying every 5 minutes against a problem retries can't fix.
 */
const TRANSIENT_RESEND_ERROR_CODES = new Set(['rate_limit_exceeded', 'internal_server_error', 'application_error'])

export type ReminderSendOutcome =
  | { outcome: 'sent'; providerMessageId: string }
  | { outcome: 'transient'; errorCode: string }
  | { outcome: 'permanent'; errorCode: string }

interface ReminderEmailPayload {
  to: string
  subject: string
  html: string
  text?: string
  /** Must be `reminder:${bookingId}:${reminderType}` — deterministic, identical across every retry of the same booking/reminder pair. See lib/reminders/deliver.ts. */
  idempotencyKey: string
}

async function sendReminderEmail(payload: ReminderEmailPayload): Promise<ReminderSendOutcome> {
  try {
    const { data, error } = await resend.emails.send(
      {
        from: REMINDER_FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      },
      { idempotencyKey: payload.idempotencyKey },
    )

    if (error) {
      const classification = TRANSIENT_RESEND_ERROR_CODES.has(error.name) ? 'transient' : 'permanent'
      console.error(`[reminders] send failed (${classification}):`, error.name)
      return { outcome: classification, errorCode: error.name }
    }

    return { outcome: 'sent', providerMessageId: data!.id }
  } catch {
    // A thrown exception (network failure, DNS, timeout) never reached
    // Resend's structured error response at all — treated as transient per
    // the Stage 3E investigation's classification, since nothing here says
    // the request was rejected, only that it couldn't be completed this
    // time. Deliberately no error message content logged beyond this —
    // the message could echo request details; the code path itself is
    // enough to diagnose from server logs.
    console.error('[reminders] send threw (network-level, treated as transient)')
    return { outcome: 'transient', errorCode: 'network_error' }
  }
}

export async function sendPaymentDueReminderEmail(params: {
  to: string
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  bookingUrl: string
  idempotencyKey: string
}): Promise<ReminderSendOutcome> {
  const { subject, html, text } = paymentDueReminderTemplate(params)
  return sendReminderEmail({ to: params.to, subject, html, text, idempotencyKey: params.idempotencyKey })
}

export async function sendAppointment24hReminderEmail(params: {
  to: string
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  idempotencyKey: string
}): Promise<ReminderSendOutcome> {
  const { subject, html, text } = appointment24hReminderTemplate(params)
  return sendReminderEmail({ to: params.to, subject, html, text, idempotencyKey: params.idempotencyKey })
}

export async function sendAppointment2hReminderEmail(params: {
  to: string
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  idempotencyKey: string
}): Promise<ReminderSendOutcome> {
  const { subject, html, text } = appointment2hReminderTemplate(params)
  return sendReminderEmail({ to: params.to, subject, html, text, idempotencyKey: params.idempotencyKey })
}

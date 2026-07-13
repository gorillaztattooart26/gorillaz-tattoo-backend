import { sendEmail } from '@/lib/emails/send'
import {
  inquiryConfirmationTemplate,
  bookingConfirmationTemplate,
  paymentReceiptTemplate,
  staffNewInquiryTemplate,
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
  const { subject, html } = bookingConfirmationTemplate(params)
  await sendEmail({ to: params.to, subject, html })
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

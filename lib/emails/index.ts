import { sendEmail } from '@/lib/emails/send'
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

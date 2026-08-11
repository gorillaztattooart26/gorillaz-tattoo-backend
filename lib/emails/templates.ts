import { RESERVATION_POLICY_TERMS } from '@/lib/policy'

export interface EmailContent {
  subject: string
  html: string
  /** Optional plain-text alternative — see lib/emails/send.ts. */
  text?: string
}

const ACCENT = '#fabb42'

/**
 * Every template below builds its HTML with plain string interpolation
 * (no JSX, so no automatic escaping) — every value that ultimately comes
 * from a customer or staff-entered field (name, message, artist name,
 * etc.) must be passed through this before being placed in the markup,
 * whether in text content or an attribute like `href`. Only the static
 * markup/labels the templates themselves author are exempt.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Shared wrapper for every outgoing email. Deliberately plain, light-mode,
 * inline-styled HTML rather than trying to reuse the site's dark theme —
 * most email clients strip <style> blocks and render dark backgrounds
 * inconsistently (or invert them), so a light background with the accent
 * color used sparingly is far more reliable than a full dark redesign.
 * Text-based header instead of an image logo, since images are blocked by
 * default in most inboxes until the sender is trusted.
 */
function emailShell(bodyHtml: string): string {
  return `
    <div style="background-color:#f4f4f5;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <div style="background-color:#0a0a0a;padding:24px 32px;">
          <span style="color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            Gorillaz Tattoo Art
          </span>
        </div>
        <div style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </div>
        <div style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #e5e5e5;">
          <span style="color:#71717a;font-size:12px;">
            Gorillaz Tattoo Art — this is an automated message, please don't reply directly to this email.
          </span>
        </div>
      </div>
    </div>
  `
}

/** `label` is always a code-authored literal from a call site below, not user input — only `url` needs escaping. */
function button(label: string, url: string): string {
  return `
    <a href="${escapeHtml(url)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background-color:${ACCENT};color:#000000;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">
      ${label}
    </a>
  `
}

export function inquiryConfirmationTemplate(params: { fullName: string }): EmailContent {
  return {
    subject: 'We received your inquiry — Gorillaz Tattoo Art',
    html: emailShell(`
      <p>Hi ${escapeHtml(params.fullName)},</p>
      <p>Thanks for reaching out to Gorillaz Tattoo Art. We've received your inquiry and one of our artists will review it and get back to you soon.</p>
      <p>If your idea needs a consultation, we'll reach out using the contact method you selected to set that up.</p>
      <p>Talk soon,<br />Gorillaz Tattoo Art</p>
    `),
  }
}

export function bookingConfirmationTemplate(params: {
  customerName: string
  bookingId: string
  bookingUrl: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): EmailContent {
  return {
    subject: `Your booking is set — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>Your consultation has been approved and a booking has been created for you with <strong>${escapeHtml(params.artistName)}</strong>, tentatively scheduled for <strong>${escapeHtml(params.appointmentDate)} at ${escapeHtml(params.appointmentTime)}</strong>.</p>
      <p>To confirm your appointment, review your booking details and complete the required down payment using the link below.</p>
      ${button('View Your Booking', params.bookingUrl)}
      <p style="margin-top:24px;color:#71717a;font-size:13px;">Booking reference: ${escapeHtml(params.bookingId)}</p>
    `),
    text: [
      `Hi ${params.customerName},`,
      '',
      `Your consultation has been approved and a booking has been created for you with ${params.artistName}, tentatively scheduled for ${params.appointmentDate} at ${params.appointmentTime}.`,
      '',
      'To confirm your appointment, review your booking details and complete the required down payment using the link below.',
      '',
      `View your booking: ${params.bookingUrl}`,
      '',
      `Booking reference: ${params.bookingId}`,
      '',
      "Gorillaz Tattoo Art — this is an automated message, please don't reply directly to this email.",
    ].join('\n'),
  }
}

export function paymentReceiptTemplate(params: {
  customerName: string
  bookingId: string
  amount: number
  currency: string
  bookingUrl: string
}): EmailContent {
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: params.currency,
    maximumFractionDigits: 0,
  }).format(params.amount)

  return {
    subject: `Payment received — booking ${params.bookingId} confirmed`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>We've received your down payment of <strong>${formattedAmount}</strong> for booking <strong>${escapeHtml(params.bookingId)}</strong>. Your appointment slot is now confirmed.</p>
      <p>The remaining balance will be paid at the studio after your tattoo session.</p>
      ${button('View Your Booking', params.bookingUrl)}
    `),
  }
}

export function staffNewInquiryTemplate(params: {
  fullName: string
  email: string
  phone: string
  preferredArtist: string
  style: string
  placement: string
  message: string
}): EmailContent {
  return {
    subject: `New inquiry from ${params.fullName}`,
    html: emailShell(`
      <p>A new inquiry just came in through the website.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Name</td><td style="padding:6px 0;">${escapeHtml(params.fullName)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Email</td><td style="padding:6px 0;">${escapeHtml(params.email)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Phone</td><td style="padding:6px 0;">${escapeHtml(params.phone)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Preferred artist</td><td style="padding:6px 0;">${escapeHtml(params.preferredArtist)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Style</td><td style="padding:6px 0;">${escapeHtml(params.style)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Placement</td><td style="padding:6px 0;">${escapeHtml(params.placement)}</td></tr>
      </table>
      <p style="margin-top:16px;color:#71717a;">Idea:</p>
      <p>${escapeHtml(params.message)}</p>
    `),
  }
}

export function staffPaymentReceivedTemplate(params: {
  bookingId: string
  customerName: string
  artistName: string
  amount: number
  currency: string
}): EmailContent {
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: params.currency,
    maximumFractionDigits: 0,
  }).format(params.amount)

  return {
    subject: `Payment received — ${params.bookingId}`,
    html: emailShell(`
      <p>${escapeHtml(params.customerName)} just paid the down payment for booking <strong>${escapeHtml(params.bookingId)}</strong> with <strong>${escapeHtml(params.artistName)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Amount</td><td style="padding:6px 0;">${formattedAmount}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Artist</td><td style="padding:6px 0;">${escapeHtml(params.artistName)}</td></tr>
      </table>
      <p style="margin-top:16px;color:#71717a;">The appointment is now confirmed.</p>
    `),
  }
}

export function staffBookingCancelledTemplate(params: {
  bookingId: string
  customerName: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  cancelledBy: string
}): EmailContent {
  return {
    subject: `Booking cancelled — ${params.bookingId}`,
    html: emailShell(`
      <p>Booking <strong>${escapeHtml(params.bookingId)}</strong> for <strong>${escapeHtml(params.customerName)}</strong> with <strong>${escapeHtml(params.artistName)}</strong> was just cancelled.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Was scheduled for</td><td style="padding:6px 0;">${escapeHtml(params.appointmentDate)} at ${escapeHtml(params.appointmentTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Cancelled by</td><td style="padding:6px 0;">${escapeHtml(params.cancelledBy)}</td></tr>
      </table>
    `),
  }
}

export function staffBookingRescheduledTemplate(params: {
  bookingId: string
  customerName: string
  artistName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  rescheduledBy: string
}): EmailContent {
  return {
    subject: `Booking rescheduled — ${params.bookingId}`,
    html: emailShell(`
      <p>Booking <strong>${escapeHtml(params.bookingId)}</strong> for <strong>${escapeHtml(params.customerName)}</strong> with <strong>${escapeHtml(params.artistName)}</strong> was just rescheduled.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Was</td><td style="padding:6px 0;">${escapeHtml(params.oldDate)} at ${escapeHtml(params.oldTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Now</td><td style="padding:6px 0;">${escapeHtml(params.newDate)} at ${escapeHtml(params.newTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Rescheduled by</td><td style="padding:6px 0;">${escapeHtml(params.rescheduledBy)}</td></tr>
      </table>
    `),
  }
}

export function customerBookingCancelledTemplate(params: {
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): EmailContent {
  return {
    subject: `Your booking has been cancelled — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>Your booking <strong>${escapeHtml(params.bookingId)}</strong> with <strong>${escapeHtml(params.artistName)}</strong>, previously scheduled for <strong>${escapeHtml(params.appointmentDate)} at ${escapeHtml(params.appointmentTime)}</strong>, has been cancelled.</p>
      <p style="margin-top:16px;color:#71717a;font-size:13px;">${RESERVATION_POLICY_TERMS[0]} Per studio policy, your reservation payment has been forfeited.</p>
      <p style="margin-top:16px;">If you believe this is a mistake, or you'd like to book a new appointment, please contact the studio.</p>
    `),
  }
}

export function paymentDueReminderTemplate(params: {
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  bookingUrl: string
}): EmailContent {
  return {
    subject: `Reminder: your down payment is still due — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>This is a reminder that your down payment for booking <strong>${escapeHtml(params.bookingId)}</strong> with <strong>${escapeHtml(params.artistName)}</strong>, scheduled for <strong>${escapeHtml(params.appointmentDate)} at ${escapeHtml(params.appointmentTime)}</strong>, hasn't been received yet.</p>
      <p>Please complete your down payment to keep your appointment confirmed.</p>
      ${button('Complete Your Payment', params.bookingUrl)}
      <p style="margin-top:24px;color:#71717a;font-size:13px;">Booking reference: ${escapeHtml(params.bookingId)}</p>
    `),
    text: [
      `Hi ${params.customerName},`,
      '',
      `This is a reminder that your down payment for booking ${params.bookingId} with ${params.artistName}, scheduled for ${params.appointmentDate} at ${params.appointmentTime}, hasn't been received yet.`,
      '',
      'Please complete your down payment to keep your appointment confirmed.',
      '',
      `Complete your payment: ${params.bookingUrl}`,
      '',
      `Booking reference: ${params.bookingId}`,
      '',
      "Gorillaz Tattoo Art — this is an automated message, please don't reply directly to this email.",
    ].join('\n'),
  }
}

export function appointment24hReminderTemplate(params: {
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): EmailContent {
  return {
    subject: `Your appointment is coming up — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>This is a reminder that your appointment with <strong>${escapeHtml(params.artistName)}</strong> is coming up within the next 24 hours.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Date</td><td style="padding:6px 0;">${escapeHtml(params.appointmentDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Time</td><td style="padding:6px 0;">${escapeHtml(params.appointmentTime)}</td></tr>
      </table>
      <p style="margin-top:16px;">We look forward to seeing you. If you need to reschedule or have any questions, please contact the studio.</p>
      <p style="margin-top:24px;color:#71717a;font-size:13px;">Booking reference: ${escapeHtml(params.bookingId)}</p>
    `),
    text: [
      `Hi ${params.customerName},`,
      '',
      `This is a reminder that your appointment with ${params.artistName} is coming up within the next 24 hours.`,
      '',
      `Date: ${params.appointmentDate}`,
      `Time: ${params.appointmentTime}`,
      '',
      'We look forward to seeing you. If you need to reschedule or have any questions, please contact the studio.',
      '',
      `Booking reference: ${params.bookingId}`,
      '',
      "Gorillaz Tattoo Art — this is an automated message, please don't reply directly to this email.",
    ].join('\n'),
  }
}

export function appointment2hReminderTemplate(params: {
  customerName: string
  bookingId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
}): EmailContent {
  return {
    subject: `Your appointment is in 2 hours — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>This is a reminder that your appointment with <strong>${escapeHtml(params.artistName)}</strong> is coming up in about 2 hours.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Date</td><td style="padding:6px 0;">${escapeHtml(params.appointmentDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Time</td><td style="padding:6px 0;">${escapeHtml(params.appointmentTime)}</td></tr>
      </table>
      <p style="margin-top:16px;">See you soon. If you're running late or need to reach the studio, please contact us as soon as possible.</p>
      <p style="margin-top:24px;color:#71717a;font-size:13px;">Booking reference: ${escapeHtml(params.bookingId)}</p>
    `),
    text: [
      `Hi ${params.customerName},`,
      '',
      `This is a reminder that your appointment with ${params.artistName} is coming up in about 2 hours.`,
      '',
      `Date: ${params.appointmentDate}`,
      `Time: ${params.appointmentTime}`,
      '',
      "See you soon. If you're running late or need to reach the studio, please contact us as soon as possible.",
      '',
      `Booking reference: ${params.bookingId}`,
      '',
      "Gorillaz Tattoo Art — this is an automated message, please don't reply directly to this email.",
    ].join('\n'),
  }
}

export function customerBookingRescheduledTemplate(params: {
  customerName: string
  bookingId: string
  artistName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  bookingUrl: string
}): EmailContent {
  return {
    subject: `Your booking has been rescheduled — ${params.bookingId}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>Your booking <strong>${escapeHtml(params.bookingId)}</strong> with <strong>${escapeHtml(params.artistName)}</strong> has been rescheduled.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#71717a;">Was</td><td style="padding:6px 0;">${escapeHtml(params.oldDate)} at ${escapeHtml(params.oldTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Now</td><td style="padding:6px 0;">${escapeHtml(params.newDate)} at ${escapeHtml(params.newTime)}</td></tr>
      </table>
      <p style="margin-top:16px;color:#71717a;font-size:13px;">${RESERVATION_POLICY_TERMS[2]}</p>
      ${button('View Your Booking', params.bookingUrl)}
    `),
  }
}

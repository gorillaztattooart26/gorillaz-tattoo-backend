export interface EmailContent {
  subject: string
  html: string
}

const ACCENT = '#fabb42'

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

function button(label: string, url: string): string {
  return `
    <a href="${url}" style="display:inline-block;margin-top:24px;padding:14px 28px;background-color:${ACCENT};color:#000000;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">
      ${label}
    </a>
  `
}

export function inquiryConfirmationTemplate(params: { fullName: string }): EmailContent {
  return {
    subject: 'We received your inquiry — Gorillaz Tattoo Art',
    html: emailShell(`
      <p>Hi ${params.fullName},</p>
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
      <p>Hi ${params.customerName},</p>
      <p>Your consultation has been approved and a booking has been created for you with <strong>${params.artistName}</strong>, tentatively scheduled for <strong>${params.appointmentDate} at ${params.appointmentTime}</strong>.</p>
      <p>To confirm your appointment, review your booking details and complete the required down payment using the link below.</p>
      ${button('View Your Booking', params.bookingUrl)}
      <p style="margin-top:24px;color:#71717a;font-size:13px;">Booking reference: ${params.bookingId}</p>
    `),
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
      <p>Hi ${params.customerName},</p>
      <p>We've received your down payment of <strong>${formattedAmount}</strong> for booking <strong>${params.bookingId}</strong>. Your appointment slot is now confirmed.</p>
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
        <tr><td style="padding:6px 0;color:#71717a;">Name</td><td style="padding:6px 0;">${params.fullName}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Email</td><td style="padding:6px 0;">${params.email}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Phone</td><td style="padding:6px 0;">${params.phone}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Preferred artist</td><td style="padding:6px 0;">${params.preferredArtist}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Style</td><td style="padding:6px 0;">${params.style}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Placement</td><td style="padding:6px 0;">${params.placement}</td></tr>
      </table>
      <p style="margin-top:16px;color:#71717a;">Idea:</p>
      <p>${params.message}</p>
    `),
  }
}

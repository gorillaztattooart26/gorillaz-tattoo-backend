import { resend } from '@/lib/resend'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Fire-and-forget email delivery — catches and logs any failure, never
 * throws. An email failing to send must never block the inquiry, booking,
 * or payment flow that triggered it, same as how a failed reference-image
 * upload doesn't fail the inquiry it belongs to (components/booking/
 * actions.ts). Callers should `await` this for cleaner logs/ordering, but
 * don't need their own try/catch around it.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error(`[emails] failed to send "${subject}" to ${to}:`, error)
    }
  } catch (error) {
    console.error(`[emails] unexpected error sending "${subject}" to ${to}:`, error)
  }
}

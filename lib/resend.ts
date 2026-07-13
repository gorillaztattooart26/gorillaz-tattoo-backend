import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  throw new Error(
    'Missing Resend environment variable. Set RESEND_API_KEY in .env.local ' +
      '(see .env.example) — get it from https://resend.com/api-keys.',
  )
}

/**
 * Shared Resend client — server-only (RESEND_API_KEY has no NEXT_PUBLIC_
 * prefix), so only import this from Server Actions/route handlers, never
 * a Client Component.
 *
 * No verified sending domain yet: outgoing mail must use the
 * `onboarding@resend.dev` from-address, and Resend will only actually
 * deliver to the email address the account was created with — sends to
 * any other recipient are silently accepted by the API but never
 * delivered. Both restrictions lift once a domain is verified under
 * Resend Dashboard -> Domains.
 */
export const resend = new Resend(resendApiKey)

import { headers } from 'next/headers'

/**
 * Absolute origin for the current request (e.g. `http://localhost:3000` in
 * dev, `https://your-domain` in production) — for building links that go
 * into redirects, webhooks, or emails, where a relative path won't work.
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

/**
 * Best-effort client IP + user agent for the current request — used only
 * as corroborating evidence on the waiver acceptance record
 * (bookings.waiver_ip / waiver_user_agent), never for anything that
 * depends on it being accurate or present. `x-forwarded-for` can list
 * multiple hops ("client, proxy1, proxy2"); the first entry is the
 * originating client. Either value may be null behind proxies that don't
 * set these headers.
 */
export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || null
  const userAgent = headersList.get('user-agent')
  return { ip, userAgent }
}

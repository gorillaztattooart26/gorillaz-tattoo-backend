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

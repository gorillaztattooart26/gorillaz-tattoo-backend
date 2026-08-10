import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface RateLimitCheck {
  key: string
  windowSeconds: number
  maxAttempts: number
}

export interface RateLimitResult {
  allowed: boolean
}

/**
 * Checks and atomically increments a Postgres-backed rate-limit counter via
 * the `check_and_increment_rate_limit` RPC (SECURITY DEFINER, service_role
 * only — see the rate_limit_counters migration). The RPC itself is what
 * guarantees atomicity under concurrency; this wrapper only decides what to
 * do if the RPC call can't be completed at all.
 *
 * Fails open: if the call errors (a genuine infrastructure problem — the
 * database is unreachable, the RPC is missing, etc.), that's logged and
 * treated as `allowed: true` rather than blocking the caller, so a
 * transient database hiccup never turns into a denial-of-service against
 * legitimate users. This is distinct from the RPC successfully returning
 * `false`, which is a real rate-limit hit and is always honored as-is —
 * never reinterpreted as an error, and never silently allowed.
 */
export async function checkRateLimit({
  key,
  windowSeconds,
  maxAttempts,
}: RateLimitCheck): Promise<RateLimitResult> {
  const { data, error } = await getSupabaseAdmin().rpc('check_and_increment_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_attempts: maxAttempts,
  })

  if (error) {
    // Deliberately no key/IP/email in this log line — it's infrastructure
    // noise (connection, permissions, missing function), not something
    // that needs the specific caller identity to diagnose.
    console.error('[rate-limit] check_and_increment_rate_limit failed:', error.message)
    return { allowed: true }
  }

  return { allowed: data === true }
}

export function buildInquiryIpKey(ip: string): string {
  return `inquiry:ip:${ip}`
}

export function buildInquiryEmailKey(normalizedEmail: string): string {
  return `inquiry:email:${normalizedEmail}`
}

export function buildBookingVerifyTokenKey(token: string): string {
  return `verify:token:${token}`
}

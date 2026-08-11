/**
 * Converts a Philippine-local (Asia/Manila) date + time into the UTC ISO
 * instant Postgres `timestamptz` expects. Asia/Manila is a fixed UTC+8
 * zone with no daylight saving, so a literal `+08:00` offset is always
 * correct — no timezone library or IANA lookup needed.
 *
 * Deliberately NOT `new Date(`${date}T${time}`)` (no offset): that string
 * is timezone-naive and gets interpreted in whatever zone the executing
 * runtime happens to be in (the server's clock, a staff member's
 * browser) — exactly the ambiguity this feature must avoid. Appending an
 * explicit offset makes the instant unambiguous regardless of where this
 * code runs.
 *
 * @param date "YYYY-MM-DD"
 * @param time "HH:MM" (24-hour)
 */
export function manilaDateTimeToUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+08:00`).toISOString()
}

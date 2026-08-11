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

/**
 * Manila starting instant + elapsed duration = UTC ending instant.
 *
 * `durationHours` is elapsed time, not a second Manila wall-clock time to
 * convert — the end instant is derived by adding milliseconds to the
 * already-computed `startsAt`, never by building a second date/time
 * string and re-running the Manila conversion. This is what makes a
 * duration that crosses local midnight (e.g. 23:00 Manila + 2h) fall out
 * correctly with zero special-casing: `startsAt` already accounts for
 * Manila's fixed +08:00 offset, so adding plain elapsed milliseconds to
 * it is timezone-agnostic by construction — there's no local calendar
 * boundary for the addition itself to cross.
 *
 * Assumes `date`/`time` have already been validated upstream (same
 * "YYYY-MM-DD" / "HH:MM" shape `manilaDateTimeToUtcIso` expects) and that
 * `durationHours` is a valid positive number — this helper does no
 * additional validation of its own, matching `manilaDateTimeToUtcIso`'s
 * existing convention of trusting its caller.
 *
 * @param date "YYYY-MM-DD"
 * @param time "HH:MM" (24-hour)
 * @param durationHours elapsed duration in hours, e.g. 0.5 for 30 minutes
 */
export function manilaDateTimeToUtcInterval(
  date: string,
  time: string,
  durationHours: number,
): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(manilaDateTimeToUtcIso(date, time))
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000)
  return { startsAt, endsAt }
}

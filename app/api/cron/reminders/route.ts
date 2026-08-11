import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { processRemindersOnce } from '@/lib/reminders/process'
import { deliverPendingReminders } from '@/lib/reminders/deliver'

/**
 * Vercel Cron entry point for reminders — eligibility + atomic claim
 * (Stage 3D, lib/reminders/process.ts, unchanged) followed by delivery
 * (Stage 3E, lib/reminders/deliver.ts). Both steps share one `now` so a
 * row this invocation just claims is delivered immediately rather than
 * waiting out deliverPendingReminders' own stale-retry window — see that
 * module's doc comment for why that's still safe under concurrent/
 * overlapping invocations.
 *
 * GET (not POST) because that's what Vercel Cron sends. Authenticated via
 * a bearer secret rather than Vercel's request-origin signature, same
 * shared-secret shape as PAYMONGO_WEBHOOK_SECRET on the payments webhook —
 * this route has no client input in its trust path (identical
 * getSupabaseAdmin() justification as that route), so it's the third
 * documented exception to that client's "trusted server-to-server only"
 * rule, not a new pattern.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/reminders] CRON_SECRET is not set.')
    return NextResponse.json({ error: 'Cron not configured.' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('[cron/reminders] unauthorized request.')
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date()

    const claimResult = await processRemindersOnce(supabaseAdmin, now)
    const deliveryResult = await deliverPendingReminders(supabaseAdmin, claimResult.claimedRows, now)

    console.log(
      '[cron/reminders] finished, claimed:',
      claimResult.claimed,
      'sent:',
      deliveryResult.sent,
      'failed:',
      deliveryResult.failed,
      'retryable:',
      deliveryResult.retryable,
    )

    return NextResponse.json({
      ok: true,
      claimed: claimResult.claimed,
      sent: deliveryResult.sent,
      failed: deliveryResult.failed,
      retryable: deliveryResult.retryable,
    })
  } catch (error) {
    console.error('[cron/reminders] processing threw:', error)
    return NextResponse.json({ error: 'Internal error processing reminders.' }, { status: 500 })
  }
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RESERVATION_POLICY_TERMS } from '@/lib/policy'

const TERMS = [
  'Tattoo appointments are only confirmed after the required down payment has been received.',
  ...RESERVATION_POLICY_TERMS,
  'Late arrivals exceeding 30 minutes may require rescheduling.',
  'Clients must present a valid ID before the tattoo session.',
]

export function TermsCard() {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-[var(--foreground)]">Terms &amp; Conditions</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ol className="max-h-56 list-decimal space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)]/40 p-5 pl-9 text-sm leading-relaxed text-[var(--foreground)]/70">
          {TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TERMS = [
  'Tattoo appointments are only confirmed after the required down payment has been received.',
  'The down payment is non-refundable but may be transferred once if rescheduled with at least 48 hours notice.',
  'Late arrivals exceeding 30 minutes may require rescheduling.',
  'Failure to appear without notice forfeits the reservation fee.',
  'Clients must present a valid ID before the tattoo session.',
]

export function TermsCard() {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Terms &amp; Conditions</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ol className="max-h-56 list-decimal space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-5 pl-9 text-sm leading-relaxed text-white/70">
          {TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

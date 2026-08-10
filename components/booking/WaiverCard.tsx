import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { WAIVER_ITEMS } from '@/lib/policy'

export interface WaiverValue {
  agreedToTerms: boolean
  consentToTattoo: boolean
}

interface WaiverCardProps {
  value: WaiverValue
  onChange: (value: WaiverValue) => void
}

/**
 * Renders from WAIVER_ITEMS (lib/policy.ts) rather than its own copy of
 * the wording — that array is also what gets hashed into
 * `bookings.waiver_hash`, so this and the acceptance record can never
 * drift apart. Index-mapped to the two `WaiverValue` fields; if a third
 * item is ever added, `WaiverValue` needs a matching field first.
 */
const WAIVER_FIELDS = [
  { key: 'agreedToTerms', text: WAIVER_ITEMS[0] },
  { key: 'consentToTattoo', text: WAIVER_ITEMS[1] },
] as const satisfies ReadonlyArray<{ key: keyof WaiverValue; text: string }>

/** Presentational — checkbox state is owned by WaiverAndPayment so PaymentCard can react to it. */
export function WaiverCard({ value, onChange }: WaiverCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-[var(--foreground)]">Waiver</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        {WAIVER_FIELDS.map(({ key, text }) => (
          <label
            key={key}
            className="flex items-start gap-3 text-sm leading-relaxed text-[var(--foreground)]/80"
          >
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange({ ...value, [key]: checked === true })}
              className="mt-0.5"
            />
            {text}
          </label>
        ))}
      </CardContent>
    </Card>
  )
}

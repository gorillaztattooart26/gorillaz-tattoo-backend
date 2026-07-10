import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export interface WaiverValue {
  agreedToTerms: boolean
  consentToTattoo: boolean
}

interface WaiverCardProps {
  value: WaiverValue
  onChange: (value: WaiverValue) => void
}

/** Presentational — checkbox state is owned by WaiverAndPayment so PaymentCard can react to it. */
export function WaiverCard({ value, onChange }: WaiverCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Waiver</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
          <Checkbox
            checked={value.agreedToTerms}
            onCheckedChange={(checked) =>
              onChange({ ...value, agreedToTerms: checked === true })
            }
            className="mt-0.5"
          />
          I confirm that I have reviewed my tattoo details and agree to the
          Terms &amp; Conditions.
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
          <Checkbox
            checked={value.consentToTattoo}
            onCheckedChange={(checked) =>
              onChange({ ...value, consentToTattoo: checked === true })
            }
            className="mt-0.5"
          />
          I understand that tattoos are permanent and I voluntarily consent
          to this booking.
        </label>
      </CardContent>
    </Card>
  )
}

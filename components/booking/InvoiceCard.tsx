import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Invoice } from '@/types/booking-portal'

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Invoice</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Estimated Tattoo Price</span>
          <span className="font-semibold text-white">
            {formatCurrency(invoice.estimatedPrice, invoice.currency)}
          </span>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            Required Down Payment ({invoice.downPaymentPercent}%)
          </span>
          <span className="font-semibold text-[#fabb42]">
            {formatCurrency(invoice.downPaymentAmount, invoice.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Remaining Balance</span>
          <span className="font-semibold text-white">
            {formatCurrency(invoice.remainingBalance, invoice.currency)}
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-white/40">
          The remaining balance will be paid at the studio after your tattoo
          session.
        </p>
      </CardContent>
    </Card>
  )
}

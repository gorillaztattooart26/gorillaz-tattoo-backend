import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/booking/Field'
import type { Customer } from '@/types/booking-portal'

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-5 px-0 sm:grid-cols-2">
        <Field label="Customer Name" value={customer.name} />
        <Field label="Email" value={customer.email} />
        <Field label="Mobile Number" value={customer.mobile} />
        <Field
          label="Preferred Contact Method"
          value={customer.preferredContactMethod}
          className="capitalize"
        />
      </CardContent>
    </Card>
  )
}

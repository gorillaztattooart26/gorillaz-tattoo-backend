import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/booking/Field'
import { ReferenceImageGallery } from '@/components/booking/ReferenceImageGallery'
import type { Tattoo } from '@/types/booking-portal'

export function TattooDetails({ tattoo }: { tattoo: Tattoo }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Tattoo Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-0">
        <Field label="Description" value={tattoo.description} />

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Style" value={tattoo.style} className="capitalize" />
          <Field label="Placement" value={tattoo.placement} className="capitalize" />
          <Field label="Estimated Size" value={tattoo.estimatedSize} />
          <Field
            label="Estimated Session Hours"
            value={`${tattoo.estimatedSessionHours} hrs`}
          />
          <Field
            label="Estimated Sessions"
            value={`${tattoo.estimatedSessionCount}`}
          />
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wide text-white/40">
            Reference Images
          </p>
          <ReferenceImageGallery images={tattoo.referenceImages} />
        </div>
      </CardContent>
    </Card>
  )
}

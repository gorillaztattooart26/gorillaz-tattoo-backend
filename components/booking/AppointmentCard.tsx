import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/booking/Field'
import type { Appointment } from '@/types/booking-portal'

function formatAppointmentDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Appointment Details</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-0">
        <Field label="Studio Address" value={appointment.studioAddress} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Appointment Date" value={formatAppointmentDate(appointment.date)} />
          <Field label="Appointment Time" value={appointment.time} />
          <Field label="Consultation Method" value={appointment.consultationMethod} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={appointment.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Google Map
          </a>
          <a
            href={appointment.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full bg-[#fabb42] px-5 py-3 text-center text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
          >
            Directions
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

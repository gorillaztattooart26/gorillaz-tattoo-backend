import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TimelineStep } from '@/types/booking-portal'

const DOT_STYLES: Record<TimelineStep['status'], string> = {
  complete: 'bg-[#fabb42] border-[#fabb42]',
  current: 'bg-black border-[#fabb42] ring-4 ring-[#fabb42]/20',
  upcoming: 'bg-black border-white/20',
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Booking Timeline</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ol className="flex flex-col gap-8">
          {steps.map((step, index) => (
            <li key={step.key} className="relative flex gap-4 pl-1">
              {index < steps.length - 1 && (
                <span
                  className="absolute top-4 left-[9px] h-[calc(100%+1.5rem)] w-px bg-white/10"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2',
                  DOT_STYLES[step.status],
                )}
              />
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    step.status === 'upcoming' ? 'text-white/50' : 'text-white',
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {step.description}
                </p>
                {step.date && (
                  <p className="mt-1 text-xs text-white/30">
                    {new Date(`${step.date}T00:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

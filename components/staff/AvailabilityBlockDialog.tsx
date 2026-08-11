'use client'

import { forwardRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarOff } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronIcon } from '@/components/common/icons'
import { fieldClasses } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'
import { createAvailabilityBlockAction } from '@/app/staff/(protected)/availability/actions'
import { createAvailabilityBlockSchema, type CreateAvailabilityBlockValues } from '@/app/staff/(protected)/availability/schema'
import type { StaffArtistOption } from '@/lib/staff/artists'

interface AvailabilityBlockDialogProps {
  isOwner: boolean
  /** Only used when isOwner — a non-owner's form never renders or submits an artist field at all. */
  artists: StaffArtistOption[]
}

/**
 * "Block Time" trigger + create form, rendered as StaffPageHeader's
 * `action` slot on the Availability page. Same shape as
 * CreateBookingForm.tsx (react-hook-form + zodResolver + FormField/
 * NativeSelect), just scoped to a Dialog instead of a full page — this is
 * the only create form in the staff dashboard, so it's the closest
 * existing precedent to follow.
 */
export function AvailabilityBlockDialog({ isOwner, artists }: AvailabilityBlockDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAvailabilityBlockValues>({
    resolver: zodResolver(createAvailabilityBlockSchema),
    defaultValues: { artistId: artists[0]?.id },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const result = await createAvailabilityBlockAction(values)
      if (result.error) {
        setSubmitError(result.error)
        return
      }
      setOpen(false)
      reset()
    } catch (error) {
      console.error(error)
      setSubmitError('Something went wrong creating this availability block. Please try again.')
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSubmitError(null)
          reset()
        }
      }}
    >
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <CalendarOff className="h-4 w-4" />
        Block Time
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Availability Block</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {isOwner && (
            <FormField label="Artist" error={errors.artistId?.message}>
              <NativeSelect {...register('artistId')}>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id} className="bg-[var(--card)] capitalize">
                    {artist.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}

          <FormField label="Date" error={errors.date?.message}>
            <Input type="date" {...register('date')} className={fieldClasses} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" error={errors.startTime?.message}>
              <Input type="time" {...register('startTime')} className={fieldClasses} />
            </FormField>
            <FormField label="End Time" error={errors.endTime?.message}>
              <Input type="time" {...register('endTime')} className={fieldClasses} />
            </FormField>
          </div>

          <FormField label="Reason" error={errors.reason?.message}>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder="Vacation, studio closure, personal day…"
              className={cn(fieldClasses, 'resize-none')}
            />
          </FormField>

          {submitError && (
            <p role="alert" className="text-sm text-red-400">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Blocking…' : 'Block Time'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs uppercase tracking-wide text-[var(--foreground)]/50">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const NativeSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        {...props}
        className={cn(fieldClasses, 'appearance-none pr-11 capitalize', className)}
      >
        {children}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground)]/40" />
    </div>
  ),
)
NativeSelect.displayName = 'NativeSelect'

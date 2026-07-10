'use client'

import { forwardRef, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChevronIcon } from '@/components/common/icons'
import { fieldClasses } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'
import { ARTISTS } from '@/lib/mock/artists'
import { createBookingAction } from '@/app/staff/create-booking/actions'
import {
  createBookingSchema,
  type CreateBookingFormInput,
  type CreateBookingValues,
} from '@/app/staff/create-booking/schema'

const CONTACT_METHODS = ['email', 'sms', 'call', 'messenger'] as const

const DEFAULT_VALUES: Partial<CreateBookingFormInput> = {
  preferredContactMethod: 'email',
  artistSlug: ARTISTS[0]?.slug,
  studioAddress: 'Unit 4B, Poblacion Arts District, Makati City, Metro Manila, Philippines',
  consultationMethod: 'In-person consultation completed at the studio',
  estimatedSessionHours: 3,
  estimatedSessionCount: 1,
  downPaymentPercent: 20,
}

function formatPHP(amount: number): string {
  if (Number.isNaN(amount)) return '₱0'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CreateBookingForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookingFormInput, unknown, CreateBookingValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const estimatedPrice = Number(watch('estimatedPrice')) || 0
  const downPaymentPercent = Number(watch('downPaymentPercent')) || 0
  const { downPaymentAmount, remainingBalance } = useMemo(() => {
    const amount = Math.round(estimatedPrice * (downPaymentPercent / 100))
    return { downPaymentAmount: amount, remainingBalance: estimatedPrice - amount }
  }, [estimatedPrice, downPaymentPercent])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const { token } = await createBookingAction(values)
      router.push(`/booking/${token}`)
    } catch (error) {
      console.error(error)
      setSubmitError('Something went wrong creating this booking. Please try again.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <Card className="p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-white">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-2">
          <FormField label="Full Name" error={errors.customerName?.message}>
            <Input {...register('customerName')} placeholder="Jasmine Cruz" className={fieldClasses} />
          </FormField>
          <FormField label="Email" error={errors.customerEmail?.message}>
            <Input
              type="email"
              {...register('customerEmail')}
              placeholder="jasmine.cruz@example.com"
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Mobile Number" error={errors.customerMobile?.message}>
            <Input
              type="tel"
              {...register('customerMobile')}
              placeholder="+63 917 123 4567"
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Preferred Contact Method" error={errors.preferredContactMethod?.message}>
            <NativeSelect {...register('preferredContactMethod')}>
              {CONTACT_METHODS.map((method) => (
                <option key={method} value={method} className="bg-neutral-900 capitalize">
                  {method}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-white">Tattoo &amp; Artist</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-2">
          <FormField label="Assigned Artist" error={errors.artistSlug?.message}>
            <NativeSelect {...register('artistSlug')}>
              {ARTISTS.map((artist) => (
                <option key={artist.slug} value={artist.slug} className="bg-neutral-900 capitalize">
                  {artist.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Tattoo Style" error={errors.tattooStyle?.message}>
            <Input {...register('tattooStyle')} placeholder="fine line" className={fieldClasses} />
          </FormField>
          <FormField label="Placement" error={errors.placement?.message}>
            <Input {...register('placement')} placeholder="left forearm" className={fieldClasses} />
          </FormField>
          <FormField label="Estimated Size" error={errors.estimatedSize?.message}>
            <Input
              {...register('estimatedSize')}
              placeholder="large (8–12 in)"
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Estimated Session Hours" error={errors.estimatedSessionHours?.message}>
            <Input
              type="number"
              step="0.5"
              {...register('estimatedSessionHours')}
              className={fieldClasses}
            />
          </FormField>
          <FormField label="Estimated Number of Sessions" error={errors.estimatedSessionCount?.message}>
            <Input type="number" {...register('estimatedSessionCount')} className={fieldClasses} />
          </FormField>
          <FormField
            label="Tattoo Description"
            error={errors.tattooDescription?.message}
            className="sm:col-span-2"
          >
            <textarea
              {...register('tattooDescription')}
              rows={4}
              placeholder="A fine line botanical sleeve wrapping the left forearm..."
              className={cn(fieldClasses, 'resize-none')}
            />
          </FormField>
          <p className="text-xs text-white/40 sm:col-span-2">
            Reference image upload isn&apos;t wired to storage yet — newly
            created bookings use sample images until that&apos;s connected.
          </p>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-white">Appointment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-2">
          <FormField label="Studio Address" error={errors.studioAddress?.message} className="sm:col-span-2">
            <Input {...register('studioAddress')} className={fieldClasses} />
          </FormField>
          <FormField label="Appointment Date" error={errors.appointmentDate?.message}>
            <Input type="date" {...register('appointmentDate')} className={fieldClasses} />
          </FormField>
          <FormField label="Appointment Time" error={errors.appointmentTime?.message}>
            <Input {...register('appointmentTime')} placeholder="2:00 PM" className={fieldClasses} />
          </FormField>
          <FormField
            label="Consultation Method"
            error={errors.consultationMethod?.message}
            className="sm:col-span-2"
          >
            <Input {...register('consultationMethod')} className={fieldClasses} />
          </FormField>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-white">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Estimated Tattoo Price (₱)" error={errors.estimatedPrice?.message}>
              <Input type="number" {...register('estimatedPrice')} placeholder="25000" className={fieldClasses} />
            </FormField>
            <FormField label="Down Payment (%)" error={errors.downPaymentPercent?.message}>
              <Input
                type="number"
                {...register('downPaymentPercent')}
                className={fieldClasses}
              />
            </FormField>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
            <div className="flex items-center justify-between text-white/60">
              <span>Down payment due</span>
              <span className="font-semibold text-[#fabb42]">{formatPHP(downPaymentAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Remaining balance</span>
              <span className="font-semibold text-white">{formatPHP(remainingBalance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {submitError && <p className="text-center text-sm text-red-400">{submitError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-auto w-full rounded-full bg-[#fabb42] py-4 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:opacity-60"
      >
        {isSubmitting ? 'Creating booking…' : 'Create Booking & Generate Link'}
      </Button>
    </form>
  )
}

function FormField({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label className="text-xs uppercase tracking-wide text-white/50">{label}</Label>
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
      <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  ),
)
NativeSelect.displayName = 'NativeSelect'

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyBookingIdentity } from '@/app/booking/[token]/actions'

const verifySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or mobile number.'),
})

type VerifyValues = z.infer<typeof verifySchema>

interface VerifyGateProps {
  token: string
}

/**
 * Collects the visitor's verification input and submits it to the server
 * — it has no authorization role of its own. `verifyBookingIdentity` (a
 * Server Action) does the actual identity check and, on success, sets an
 * HttpOnly session cookie and redirects back to this route; the page
 * Server Component only then fetches and renders booking data.
 */
export function VerifyGate({ token }: VerifyGateProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
  })

  const onSubmit = handleSubmit(async ({ identifier }) => {
    setFormError(null)
    const result = await verifyBookingIdentity(token, identifier)
    // A successful verification redirects server-side and never returns
    // here — reaching this line means verification failed.
    if (result && !result.success) {
      setFormError(
        result.error ?? "We couldn't find a booking matching that email or mobile number.",
      )
    }
  })

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-8 text-center"
      >
        <Logo className="mx-auto h-10 w-auto" width={160} height={51} />
        <h1 className="hero-title mt-6 text-2xl font-medium text-[var(--foreground)]">
          This booking is private
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/60">
          Enter your mobile number or email address to view your booking.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier" className="text-[var(--foreground)]/70">
              Email or mobile number
            </Label>
            <Input
              id="identifier"
              autoComplete="off"
              placeholder="you@example.com or +63 9xx xxx xxxx"
              className="h-11 bg-[var(--background)]/40 text-[var(--foreground)]"
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-xs text-red-400">{errors.identifier.message}</p>
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-[0_0_24px_rgba(196,98,43,0.5)] disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying…' : 'View My Booking'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

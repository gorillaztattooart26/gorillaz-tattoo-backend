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
import type { Customer } from '@/types/booking-portal'

const verifySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or mobile number.'),
})

type VerifyValues = z.infer<typeof verifySchema>

interface VerifyGateProps {
  customer: Pick<Customer, 'email' | 'mobile'>
  onVerified: () => void
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]/g, '')
}

/**
 * Confirms the visitor holding this private link is actually the
 * customer before revealing booking details. Checked client-side against
 * mock data for now — the future version replaces `matches()` with a
 * Supabase RPC validating (token, email|phone) server-side, and should
 * rate-limit attempts.
 */
export function VerifyGate({ customer, onVerified }: VerifyGateProps) {
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
    // TODO: replace with a Supabase RPC: verifyBookingAccess(token, identifier)
    await new Promise((resolve) => setTimeout(resolve, 400))

    const matches =
      normalize(identifier) === normalize(customer.email) ||
      normalize(identifier) === normalize(customer.mobile)

    if (matches) {
      onVerified()
    } else {
      setFormError("We couldn't find a booking matching that email or mobile number.")
    }
  })

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/60 p-8 text-center"
      >
        <Logo className="mx-auto h-10 w-auto" width={160} height={51} />
        <h1 className="hero-title mt-6 text-2xl font-medium text-white">
          This booking is private
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Enter your mobile number or email address to view your booking.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier" className="text-white/70">
              Email or mobile number
            </Label>
            <Input
              id="identifier"
              autoComplete="off"
              placeholder="you@example.com or +63 9xx xxx xxxx"
              className="h-11 bg-black/40 text-white"
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
            className="h-auto w-full rounded-full bg-[#fabb42] py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying…' : 'View My Booking'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

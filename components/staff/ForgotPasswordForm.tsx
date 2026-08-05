'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordAction } from '@/app/staff/actions'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    const formData = new FormData()
    formData.set('email', values.email)

    const result = await forgotPasswordAction(formData)
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    setSubmitted(true)
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
        <h1 className="hero-title mt-6 text-2xl font-medium text-[var(--foreground)]">Reset your password</h1>

        {submitted ? (
          <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/60">
            If that email belongs to a staff account, a password reset link is on its
            way — check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/60">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-[var(--foreground)]/70">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@gorillaztattoo.art"
                  className="h-11 bg-[var(--background)]/40 text-[var(--foreground)]"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                {submitError && <p className="text-xs text-red-400">{submitError}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-auto w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-[0_0_24px_rgba(196,98,43,0.5)] disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}

        <Link
          href="/staff/login"
          className="mt-6 inline-block text-sm text-[var(--foreground)]/50 transition-colors hover:text-[var(--foreground)]/80"
        >
          Back to login
        </Link>
      </motion.div>
    </div>
  )
}

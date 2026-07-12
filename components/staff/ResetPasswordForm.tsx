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
import { resetPasswordAction } from '@/app/staff/actions'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    const formData = new FormData()
    formData.set('password', values.password)
    formData.set('confirmPassword', values.confirmPassword)

    // On success resetPasswordAction redirects to /staff/login, so reaching
    // the line below means it returned an error instead.
    const result = await resetPasswordAction(formData)
    if (result?.error) {
      setSubmitError(result.error)
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
        <h1 className="hero-title mt-6 text-2xl font-medium text-white">Set a new password</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Choose a new password for your staff account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-white/70">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 bg-black/40 text-white"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-white/70">
              Confirm new password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 bg-black/40 text-white"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {submitError && <p className="text-center text-sm text-red-400">{submitError}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto w-full rounded-full bg-[#fabb42] py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

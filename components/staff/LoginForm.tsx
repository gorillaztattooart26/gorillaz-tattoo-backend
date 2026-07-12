'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { loginAction } from '@/app/staff/actions'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    const formData = new FormData()
    formData.set('email', values.email)
    formData.set('password', values.password)
    if (rememberMe) {
      formData.set('rememberMe', 'on')
    }

    // On success loginAction redirects and this component unmounts, so
    // reaching the line below means it returned an error instead.
    const result = await loginAction(formData)
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
        className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/60 p-8"
      >
        <div className="text-center">
          <Logo className="mx-auto h-10 w-auto" width={160} height={51} />
          <h1 className="hero-title mt-6 text-2xl font-medium text-white">Welcome back</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Sign in to manage bookings, inquiries, and payments.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-white/70">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@gorillaztattoo.art"
              className="h-11 bg-black/40 text-white"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-white/70">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 bg-black/40 pr-11 text-white"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              Remember me
            </label>
            <Link href="/staff/forgot-password" className="text-sm text-[#fabb42] hover:underline">
              Forgot password?
            </Link>
          </div>

          {submitError && <p className="text-center text-sm text-red-400">{submitError}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto w-full rounded-full bg-[#fabb42] py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

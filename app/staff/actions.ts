'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl } from '@/lib/url'

export interface AuthActionResult {
  error: string
}

/**
 * Staff sign-in. `rememberMe` controls whether the session cookie persists
 * past the browser closing (see lib/supabase/server.ts's `createClient`
 * option of the same name) — the client itself must be created with that
 * flag *before* calling `signInWithPassword`, since that's the call that
 * actually writes the session cookies.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult | void> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const rememberMe = formData.get('rememberMe') === 'on'

  if (!email || !password) {
    return { error: 'Enter your email and password.' }
  }

  const supabase = await createClient({ rememberMe })
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Incorrect email or password.' }
  }

  redirect('/staff/dashboard')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/staff/login')
}

/**
 * Always returns the same neutral result regardless of whether the email
 * belongs to a real account — prevents leaking which emails have staff
 * accounts via response differences.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult | void> {
  const email = String(formData.get('email') ?? '')

  if (!email) {
    return { error: 'Enter your email address.' }
  }

  const supabase = await createClient()
  const baseUrl = await getBaseUrl()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/staff/auth/confirm`,
  })
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult | void> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Something went wrong resetting your password. Please try again.' }
  }

  redirect('/staff/login')
}

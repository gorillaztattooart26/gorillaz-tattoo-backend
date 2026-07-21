'use server'

import { createClient } from '@/lib/supabase/server'

export interface SettingsActionResult {
  error?: string
  success?: boolean
}

/**
 * Changes the logged-in staff member's own password. Re-authenticates
 * with the current password first (via signInWithPassword) rather than
 * trusting the existing session alone — proves they actually know the
 * current password before letting them set a new one, same as any
 * standard account-settings password change.
 */
export async function changePasswordAction(formData: FormData): Promise<SettingsActionResult> {
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!currentPassword) {
    return { error: 'Enter your current password.' }
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'Your session has expired. Please log in again.' }
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (reauthError) {
    return { error: 'Current password is incorrect.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    console.error('[staff/settings] password update failed:', updateError)
    return { error: 'Something went wrong changing your password. Please try again.' }
  }

  return { success: true }
}

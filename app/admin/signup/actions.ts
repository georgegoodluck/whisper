'use server'

import { getServiceClient } from '@/lib/supabase/admin'

export async function signUpAdmin(input: {
  email: string
  password: string
  displayName: string
  signupCode: string
}) {
  // ---- Validate env ----
  const code = process.env.ADMIN_SIGNUP_CODE
  if (!code) return { error: 'Signup disabled: ADMIN_SIGNUP_CODE is not set on the server.' }
  if (input.signupCode !== code) return { error: 'Invalid admin signup code.' }

  // ---- Validate input ----
  const email = input.email.trim().toLowerCase()
  const displayName = input.displayName.trim()
  if (!email.includes('@')) return { error: 'Invalid email.' }
  if (input.password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (displayName.length < 2 || displayName.length > 40) return { error: 'Display name must be 2–40 characters.' }

  // ---- Service client (bypasses RLS) ----
  let supabase
  try {
    supabase = getServiceClient()
  } catch (e: any) {
    console.error('[signup] service client init failed:', e.message)
    return { error: 'Server misconfigured. Check SUPABASE_SERVICE_ROLE_KEY.' }
  }

  // ---- 1. Create auth user (auto-confirmed) ----
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  })

  if (createErr || !created?.user) {
    console.error('[signup] createUser failed:', createErr?.message)
    if (createErr?.message?.toLowerCase().includes('already registered')) {
      return { error: 'That email is already registered.' }
    }
    return { error: createErr?.message ?? 'Failed to create user.' }
  }

  const userId = created.user.id

  // ---- 2. Insert into admins (service role → bypasses RLS) ----
  const { error: adminErr } = await supabase
    .from('admins')
    .insert({ user_id: userId })

  if (adminErr) {
    console.error('[signup] admins insert failed:', adminErr.message)
    // Roll back the auth user to avoid orphans
    await supabase.auth.admin.deleteUser(userId)
    return { error: `Could not whitelist admin: ${adminErr.message}` }
  }

  // ---- 3. Update the auto-created profile with the chosen display name ----
  const { error: profileErr } = await supabase
    .from('admin_profiles')
    .upsert({ user_id: userId, display_name: displayName }, { onConflict: 'user_id' })

  if (profileErr) {
    console.error('[signup] profile upsert failed:', profileErr.message)
    // Not fatal — trigger may have created a default profile already
  }

  return { success: true, userId }
}

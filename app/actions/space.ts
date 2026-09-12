'use server'

import { createAdminClient } from '@/lib/supabase/server'

function randomCode(len = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'space'
}

async function verifyUser(userId: string) {
  const admin = await createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user) return { ok: false as const, error: 'Invalid user' }
  return { ok: true as const, admin, user: data.user }
}

export async function createSpace(input: {
  userId: string
  name: string
  displayName: string
}) {
  const name = input.name.trim()
  const displayName = input.displayName.trim()

  if (name.length < 2 || name.length > 60) return { error: 'Space name must be 2–60 characters.' }
  if (displayName.length < 2 || displayName.length > 40) return { error: 'Display name must be 2–40 characters.' }

  const v = await verifyUser(input.userId)
  if (!v.ok) return { error: v.error }
  const { admin, user } = v

  // Unique slug
  let slug = slugify(name)
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin.from('spaces').select('id').eq('slug', slug).maybeSingle()
    if (!clash) break
    slug = `${slugify(name)}-${Math.floor(Math.random() * 9000 + 1000)}`
  }

  // 1. Create space
  const { data: space, error: spaceErr } = await admin
    .from('spaces')
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single()

  if (spaceErr || !space) {
    console.error('[createSpace] space insert:', spaceErr?.message)
    return { error: spaceErr?.message ?? 'Could not create space.' }
  }

  // 2. Owner → overseer
  const { error: memberErr } = await admin
    .from('space_members')
    .insert({ space_id: space.id, user_id: user.id, role: 'overseer' })

  if (memberErr) {
    console.error('[createSpace] member insert:', memberErr.message)
    await admin.from('spaces').delete().eq('id', space.id)
    return { error: memberErr.message }
  }

  // 3. Display name
  const { error: profErr } = await admin
    .from('admin_profiles')
    .upsert({ user_id: user.id, display_name: displayName }, { onConflict: 'user_id' })

  if (profErr) {
    console.error('[createSpace] profile upsert:', profErr.message)
    // Non-fatal — continue
  }

  // 4. Invite code
  let code = randomCode()
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin.from('invite_codes').select('code').eq('code', code).maybeSingle()
    if (!clash) break
    code = randomCode()
  }

  const { error: codeErr } = await admin
    .from('invite_codes')
    .insert({ code, space_id: space.id, created_by: user.id })

  if (codeErr) {
    console.error('[createSpace] code insert:', codeErr.message)
    return { error: codeErr.message }
  }

return { success: true, space, slug: space.slug, code }
}

export async function joinSpaceWithCode(input: {
  userId: string
  code: string
  displayName: string
}) {
  const code = input.code.trim().toUpperCase()
  const displayName = input.displayName.trim()

  if (!code) return { error: 'Enter an invite code.' }
  if (displayName.length < 2 || displayName.length > 40) return { error: 'Display name must be 2–40 characters.' }

  const v = await verifyUser(input.userId)
  if (!v.ok) return { error: v.error }
  const { admin, user } = v

  // 1. Resolve the code
  const { data: invite } = await admin
    .from('invite_codes')
    .select('code, space_id, is_revoked')
    .eq('code', code)
    .eq('is_revoked', false)
    .maybeSingle()

  if (!invite) return { error: 'Invalid or revoked invite code.' }

  // 2. Add as admin (idempotent)
  const { error: memberErr } = await admin
    .from('space_members')
    .upsert(
      { space_id: invite.space_id, user_id: user.id, role: 'admin' },
      { onConflict: 'space_id,user_id', ignoreDuplicates: true }
    )

  if (memberErr) {
    console.error('[joinSpace] member upsert:', memberErr.message)
    return { error: memberErr.message }
  }

  // 3. Display name
  const { error: profErr } = await admin
    .from('admin_profiles')
    .upsert({ user_id: user.id, display_name: displayName }, { onConflict: 'user_id' })

  if (profErr) console.error('[joinSpace] profile upsert:', profErr.message)

  // Get slug for redirect
  const { data: space } = await admin
    .from('spaces')
    .select('slug')
    .eq('id', invite.space_id)
    .single()

  return { success: true, spaceId: invite.space_id, slug: space?.slug ?? null }
}

export async function rotateInviteCode(spaceId: string, userId: string) {
  const v = await verifyUser(userId)
  if (!v.ok) return { error: v.error }
  const { admin, user } = v

  // Only overseer
  const { data: membership } = await admin
    .from('space_members')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'overseer') return { error: 'Only the overseer can rotate codes.' }

  await admin.from('invite_codes').update({ is_revoked: true }).eq('space_id', spaceId)

  let code = randomCode()
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin.from('invite_codes').select('code').eq('code', code).maybeSingle()
    if (!clash) break
    code = randomCode()
  }

  const { error } = await admin
    .from('invite_codes')
    .insert({ code, space_id: spaceId, created_by: user.id })

  if (error) return { error: error.message }
  return { success: true, code }
}

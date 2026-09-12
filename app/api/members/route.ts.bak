import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PostSchema = z.object({
  spaceId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().trim().min(2).max(40),
})

const DeleteSchema = z.object({
  spaceId: z.string().uuid(),
  userId: z.string().uuid(),
})

// ─── POST: overseer adds an existing user as admin of their space ───
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { spaceId, email, displayName } = parsed.data
  const admin = await createAdminClient()

  // Caller must be the overseer
  const { data: space, error: spaceErr } = await admin
    .from('spaces')
    .select('id, owner_id, name')
    .eq('id', spaceId)
    .maybeSingle()

  if (spaceErr) return NextResponse.json({ error: spaceErr.message }, { status: 500 })
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  if (space.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the overseer can add admins' }, { status: 403 })
  }

  // Find the target user by email
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const target = list.users.find(
    u => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (!target) {
    return NextResponse.json(
      { error: 'No account with that email. Ask them to sign up first at /signup' },
      { status: 404 }
    )
  }

  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You're already the overseer of this space" },
      { status: 400 }
    )
  }

  // Insert into space_members
  const { error: insertErr } = await admin
    .from('space_members')
    .insert({
      space_id: spaceId,
      user_id: target.id,
      role: 'admin',
      display_name: displayName,
    })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'Already a member of this space' }, { status: 409 })
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: target.id })
}

// ─── DELETE: overseer removes an admin ───
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = DeleteSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { spaceId, userId } = parsed.data
  const admin = await createAdminClient()

  const { data: space } = await admin
    .from('spaces')
    .select('owner_id')
    .eq('id', spaceId)
    .maybeSingle()

  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  if (space.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the overseer can remove admins' }, { status: 403 })
  }
  if (userId === user.id) {
    return NextResponse.json({ error: "You can't remove yourself" }, { status: 400 })
  }

  const { error } = await admin
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

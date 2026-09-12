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

const LeaveSchema = z.object({
  spaceId: z.string().uuid(),
})

const TransferSchema = z.object({
  spaceId: z.string().uuid(),
  newOwnerId: z.string().uuid(),
})

// ─── POST: overseer adds an admin ───
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

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const target = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!target) {
    return NextResponse.json(
      { error: 'No account with that email. Ask them to sign up first at /signup' },
      { status: 404 }
    )
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "You're already the overseer" }, { status: 400 })
  }

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
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

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

  const { data: deleted, error } = await admin
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .select('user_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: 'Member not found in this space' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

// ─── PATCH: current user leaves a space ───
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = LeaveSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { spaceId } = parsed.data
  const admin = await createAdminClient()

  // Check ownership first
  const { data: space, error: spaceErr } = await admin
    .from('spaces')
    .select('id, owner_id, name')
    .eq('id', spaceId)
    .maybeSingle()

  if (spaceErr) return NextResponse.json({ error: spaceErr.message }, { status: 500 })
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

  if (space.owner_id === user.id) {
    return NextResponse.json(
      { error: "You're the overseer — transfer ownership or delete the space first." },
      { status: 403 }
    )
  }

  // Confirm membership exists
  const { data: member, error: memberErr } = await admin
    .from('space_members')
    .select('user_id, role')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })
  if (!member) {
    return NextResponse.json({ error: "You're not a member of this space" }, { status: 404 })
  }

  // Delete membership — service role, checks result
  const { data: deleted, error: delErr } = await admin
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .select('user_id')

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  if (!deleted || deleted.length === 0) {
    // This is the case that causes the "comes back on refresh" bug
    return NextResponse.json(
      {
        error:
          'Delete did not affect any rows. Check RLS policy or space_members table.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, space: space.name })
}

// ─── PUT: overseer transfers ownership to an admin ───
export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = TransferSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { spaceId, newOwnerId } = parsed.data
  const admin = await createAdminClient()

  // Verify caller is the current owner
  const { data: space, error: spaceErr } = await admin
    .from('spaces')
    .select('id, owner_id, name')
    .eq('id', spaceId)
    .maybeSingle()

  if (spaceErr) return NextResponse.json({ error: spaceErr.message }, { status: 500 })
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  if (space.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the overseer can transfer ownership' }, { status: 403 })
  }
  if (newOwnerId === user.id) {
    return NextResponse.json({ error: "You're already the overseer" }, { status: 400 })
  }

  // Verify target is a member of this space
  const { data: target } = await admin
    .from('space_members')
    .select('user_id, display_name')
    .eq('space_id', spaceId)
    .eq('user_id', newOwnerId)
    .maybeSingle()

  if (!target) {
    return NextResponse.json(
      { error: 'That person is not a member of this space yet' },
      { status: 404 }
    )
  }

  // Update the owner — the DB trigger syncs space_members.role automatically
  const { error: updateErr } = await admin
    .from('spaces')
    .update({ owner_id: newOwnerId })
    .eq('id', spaceId)

  if (updateErr) {
    return NextResponse.json(
      { error: `Could not transfer: ${updateErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, space: space.name })
}

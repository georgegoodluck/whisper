import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/spaces'
import { z } from 'zod'

const BodySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
  displayName: z.string().trim().min(2).max(40),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { name, description, displayName } = parsed.data
  const admin = await createAdminClient()

  // Generate a unique invite code (retry up to 5 times on collision)
  let inviteCode = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode(8)
    const { data: clash } = await admin
      .from('spaces').select('id').eq('invite_code', candidate).maybeSingle()
    if (!clash) { inviteCode = candidate; break }
  }
  if (!inviteCode) {
    return NextResponse.json({ error: 'Could not generate a unique code, try again' }, { status: 500 })
  }

  const { data: space, error } = await admin
    .from('spaces')
    .insert({
      invite_code: inviteCode,
      name,
      description: description ?? null,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The trigger inserts the owner as 'overseer' with default display name.
  // Update it to the chosen one.
  await admin
    .from('space_members')
    .update({ display_name: displayName })
    .eq('space_id', space.id)
    .eq('user_id', user.id)

  return NextResponse.json({ space })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('space_members')
    .select('space_id, role, display_name, spaces(id, name, description, invite_code, created_at)')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ memberships: data ?? [] })
}

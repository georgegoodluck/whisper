import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const BodySchema = z.object({
  confirm: z.literal('DELETE'),
})

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // 1. Check if the user owns any spaces. If yes, block.
  const { data: ownedSpaces, error: ownedErr } = await admin
    .from('spaces')
    .select('id, name, invite_code')
    .eq('owner_id', user.id)

  if (ownedErr) {
    return NextResponse.json({ error: ownedErr.message }, { status: 500 })
  }

  if (ownedSpaces && ownedSpaces.length > 0) {
    return NextResponse.json(
      {
        error: `You own ${ownedSpaces.length} space${ownedSpaces.length === 1 ? '' : 's'}. Delete them first, then come back.`,
        ownedSpaces: ownedSpaces.map(s => ({ id: s.id, name: s.name, code: s.invite_code })),
      },
      { status: 409 }
    )
  }

  // 2. Cascade delete: removing the auth user cascades to
  //    - spaces (owner_id)
  //    - space_members (user_id)
  //    - answers (admin_id)
  //    Any questions they asked anonymously are NOT tied to their user,
  //    so they remain (correct — anonymity preserved).
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

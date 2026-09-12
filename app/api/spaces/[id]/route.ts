import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Confirm the caller owns this space
  const { data: space, error: fetchErr } = await admin
    .from('spaces')
    .select('id, owner_id, name')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  if (space.owner_id !== user.id) {
    return NextResponse.json(
      { error: 'Only the overseer can delete this space' },
      { status: 403 }
    )
  }

  // Cascade deletes questions, answers, members (FK on delete cascade)
  const { error: delErr } = await admin
    .from('spaces')
    .delete()
    .eq('id', id)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: space.name })
}

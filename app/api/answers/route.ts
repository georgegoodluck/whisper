import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const BodySchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  // Verify caller is whitelisted admin
  const { data: isAdmin } = await admin
    .from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch display name (falls back to email prefix if missing)
  const { data: profile } = await admin
    .from('admin_profiles').select('display_name').eq('user_id', user.id).maybeSingle()
  const adminName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Admin'

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { questionId, content } = parsed.data
  const { data, error } = await supabase
    .from('answers')
    .insert({
      question_id: questionId,
      content,
      admin_id: user.id,
      admin_name: adminName,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ answer: data })
}

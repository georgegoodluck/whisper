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

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { questionId, content } = parsed.data
  const admin = await createAdminClient()

  // Verify the question exists and user is an admin of that space
  const { data: question } = await admin
    .from('questions').select('id, space_id').eq('id', questionId).maybeSingle()
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const { data: member } = await admin
    .from('space_members')
    .select('display_name')
    .eq('space_id', question.space_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Not an admin of this space' }, { status: 403 })

  const { data, error } = await supabase
    .from('answers')
    .insert({
      question_id: questionId,
      admin_id: user.id,
      admin_name: member.display_name,
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ answer: data })
}

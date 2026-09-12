import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIp, getIp } from '@/lib/rate-limit'
import { z } from 'zod'

const BodySchema = z.object({
  spaceId: z.string().uuid(),
  content: z.string().trim().min(3).max(1000),
  deviceId: z.string().min(8).max(64),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { spaceId, content, deviceId } = parsed.data
  const ipHash = hashIp(getIp(req))
  const supabase = await createAdminClient()

  // Verify the space exists
  const { data: space } = await supabase
    .from('spaces').select('id').eq('id', spaceId).maybeSingle()
  if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

  // Rate limit per IP within this space
  const windowSec = Number(process.env.NEXT_PUBLIC_RATE_LIMIT_SECONDS ?? 30)
  const since = new Date(Date.now() - windowSec * 1000).toISOString()

  const { data: recent } = await supabase
    .from('questions')
    .select('id')
    .eq('ip_hash', ipHash)
    .eq('space_id', spaceId)
    .gte('created_at', since)
    .limit(1)

  if (recent && recent.length > 0) {
    return NextResponse.json(
      { error: `Please wait ${windowSec}s before asking again` },
      { status: 429 }
    )
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({ space_id: spaceId, content, device_id: deviceId, ip_hash: ipHash })
    .select('id, content, created_at, is_answered, device_id, space_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

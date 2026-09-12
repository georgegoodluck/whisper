import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('spaces')
    .select('id, name, description, invite_code, created_at')
    .eq('invite_code', code.toLowerCase())
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ space: data })
}

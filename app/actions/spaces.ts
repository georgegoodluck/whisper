'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function getSpaceByCode(code: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('spaces')
    .select('id, name, description, invite_code, created_at')
    .eq('invite_code', code.toLowerCase())
    .maybeSingle()
  return data
}

export async function getSpaceMemberships() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, memberships: [] }

  const admin = await createAdminClient()
  const { data } = await admin
    .from('space_members')
    .select(`
      space_id, role, display_name, joined_at,
      spaces ( id, name, description, invite_code, owner_id, created_at )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  return { user, memberships: data ?? [] }
}

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/admin/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const admin = await createAdminClient()
  const { data: memberships } = await admin
    .from('space_members')
    .select(`
      space_id, role, display_name, joined_at,
      spaces ( id, name, description, invite_code, owner_id, created_at )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  return (
    <DashboardShell
      user={{ id: user.id, email: user.email ?? '' }}
      memberships={(memberships ?? []) as any}
    />
  )
}

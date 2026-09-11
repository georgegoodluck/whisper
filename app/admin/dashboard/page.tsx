import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = await createAdminClient()
  const { data: isAdmin } = await admin
    .from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!isAdmin) redirect('/')

  const { data: questions } = await admin
    .from('questions')
    .select('*, answers(*)')
    .order('created_at', { ascending: false })
    .limit(200)

  return <AdminDashboard initial={(questions ?? []) as any} adminEmail={user.email ?? ''} />
}

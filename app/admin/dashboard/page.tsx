import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // 1. Auth check (uses cookie session)
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()

  if (!user) {
    console.warn('[dashboard] no user session:', userErr?.message)
    redirect('/admin/login?reason=no-session')
  }

  // 2. Admin whitelist check (service role — bypasses RLS recursion)
  const admin = await createAdminClient()
  const { data: isAdmin, error: adminErr } = await admin
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminErr) {
    console.error('[dashboard] admin check failed:', adminErr.message)
    redirect('/admin/login?reason=db-error')
  }

  if (!isAdmin) {
    console.warn('[dashboard] user not in admins table:', user.email)
    redirect('/admin/login?reason=not-admin')
  }

  // 3. Fetch profile + questions
  const { data: profile } = await admin
    .from('admin_profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: questions, error: qErr } = await admin
    .from('questions')
    .select('*, answers(*)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (qErr) console.error('[dashboard] questions fetch failed:', qErr.message)

  return (
    <AdminDashboard
      initial={(questions ?? []) as any}
      adminEmail={user.email ?? ''}
      adminName={profile?.display_name ?? user.email?.split('@')[0] ?? 'Admin'}
    />
  )
}

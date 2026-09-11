import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  const { data: isAdmin, error: adminErr } = user
    ? await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    : { data: null, error: null }

  const { data: profile } = user
    ? await admin.from('admin_profiles').select('display_name').eq('user_id', user.id).maybeSingle()
    : { data: null }

  const { data: qCount } = await admin.from('questions').select('id', { count: 'exact', head: true })

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Admin Debug</h1>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">1. Auth User</h2>
          <pre className="text-xs bg-secondary/50 p-3 rounded overflow-auto">
{JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, error: userErr?.message }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">2. Admin whitelist check</h2>
          <pre className="text-xs bg-secondary/50 p-3 rounded overflow-auto">
{JSON.stringify({ isAdmin, adminErr: adminErr?.message, profile }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">3. Service role DB access</h2>
          <pre className="text-xs bg-secondary/50 p-3 rounded overflow-auto">
{JSON.stringify({ questionRowCount: qCount }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">4. Env vars present</h2>
          <pre className="text-xs bg-secondary/50 p-3 rounded overflow-auto">
{JSON.stringify({
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  appName: process.env.NEXT_PUBLIC_APP_NAME,
}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

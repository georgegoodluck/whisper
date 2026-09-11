import { createClient } from '@supabase/supabase-js'

// Service-role client. Bypasses RLS. Server-only — never import client-side.
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('[supabase-admin] NEXT_PUBLIC_SUPABASE_URL is missing')
  if (!key) throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is missing')
  if (!key.startsWith('eyJ')) throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY does not look like a JWT — did you paste the anon key by mistake?')
  if (key.length < 100) throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY looks truncated (length ' + key.length + ')')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

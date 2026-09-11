'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const reason = params.get('reason')
    if (reason === 'not-admin') toast.error('Your account is not an admin.')
    if (reason === 'no-session') toast.error('Please sign in again.')
    if (reason === 'db-error') toast.error('Database error. Check server logs.')
  }, [params])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return toast.error(error.message)
    }

    // Verify admin BEFORE redirecting — avoids the loop
    const { data: isAdmin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    setLoading(false)

    if (!isAdmin) {
      await supabase.auth.signOut()
      return toast.error('This account is not an admin. Contact the site owner.')
    }

    toast.success('Welcome back')
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Admin Access</h1>
              <p className="text-xs text-muted-foreground">Sign in to answer questions</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign in
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Need an account?{' '}
            <Link href="/admin/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

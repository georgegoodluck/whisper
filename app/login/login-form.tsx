'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Welcome back')
    const next = params.get('next') ?? '/dashboard'
    router.push(next)
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
              <h1 className="font-semibold">Sign in</h1>
              <p className="text-xs text-muted-foreground">Manage your space</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Sign in
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            No account?{' '}
            <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

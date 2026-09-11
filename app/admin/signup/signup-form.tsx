'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { signUpAdmin } from './actions'

export function AdminSignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [signupCode, setSignupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signUpAdmin({ email, password, displayName, signupCode })
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      toast.success('Admin account created. Please sign in.')
      router.push('/admin/login')
    } catch (e: any) {
      toast.error(e.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/admin/login" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to sign in
        </Link>
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Create Admin Account</h1>
              <p className="text-xs text-muted-foreground">Requires a valid signup code</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input
              placeholder="Display name (e.g. George)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              maxLength={40}
            />
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <Input
              type="password"
              placeholder="Admin signup code"
              value={signupCode}
              onChange={e => setSignupCode(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create account
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Already have an account?{' '}
            <Link href="/admin/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

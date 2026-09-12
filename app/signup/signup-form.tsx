'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Sparkles, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { createSpace, joinSpaceWithCode } from '@/app/actions/space'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [spaceName, setSpaceName] = useState('')
  const [displayName1, setDisplayName1] = useState('')

  const [inviteCode, setInviteCode] = useState('')
  const [displayName2, setDisplayName2] = useState('')

  async function authenticate(): Promise<string | null> {
    const supabase = createClient()

    // 1. Sign up (may already exist)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password })

    // If user already exists, signUpErr is often "User already registered"
    if (signUpErr && !signUpErr.message.toLowerCase().includes('already')) {
      toast.error(signUpErr.message)
      return null
    }

    // 2. Sign in to establish session
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr || !signInData.user) {
      toast.error(signInErr?.message ?? 'Sign-in failed after signup.')
      return null
    }

    return signInData.user.id
  }

  async function createNew(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 8) return toast.error('Email and password (8+ chars) required.')
    if (spaceName.trim().length < 2) return toast.error('Space name is too short.')
    if (displayName1.trim().length < 2) return toast.error('Display name is too short.')

    setLoading(true)
    try {
      const userId = await authenticate()
      if (!userId) return

      const res = await createSpace({
        userId,
        name: spaceName,
        displayName: displayName1,
      })

      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }

      toast.success('Space created!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function joinExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 8) return toast.error('Email and password (8+ chars) required.')
    if (!inviteCode.trim()) return toast.error('Enter an invite code.')
    if (displayName2.trim().length < 2) return toast.error('Display name is too short.')

    setLoading(true)
    try {
      const userId = await authenticate()
      if (!userId) return

      const res = await joinSpaceWithCode({
        userId,
        code: inviteCode,
        displayName: displayName2,
      })

      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }

      toast.success('Joined the space!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const credsReady = !!email && password.length >= 8

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6">
          <h1 className="text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-xs text-muted-foreground mb-5">
            Then start a new space or join one with a code.
          </p>

          <div className="space-y-3 mb-5">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="create">Create space</TabsTrigger>
              <TabsTrigger value="join">Join space</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={createNew} className="space-y-3">
                <Input
                  placeholder="Space name (e.g. Tech Careers Q&A)"
                  value={spaceName}
                  onChange={e => setSpaceName(e.target.value)}
                  minLength={2}
                  maxLength={60}
                />
                <Input
                  placeholder="Your display name (e.g. George)"
                  value={displayName1}
                  onChange={e => setDisplayName1(e.target.value)}
                  minLength={2}
                  maxLength={40}
                />
                <Button
                  type="submit"
                  disabled={loading || !credsReady}
                  className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  Create space
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  You&apos;ll be the <span className="text-primary font-medium">overseer</span> — you can answer and invite admins.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={joinExisting} className="space-y-3">
                <Input
                  placeholder="Invite code"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="text-center tracking-widest font-mono uppercase"
                />
                <Input
                  placeholder="Your display name"
                  value={displayName2}
                  onChange={e => setDisplayName2(e.target.value)}
                  minLength={2}
                  maxLength={40}
                />
                <Button
                  type="submit"
                  disabled={loading || !credsReady}
                  className="w-full bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Join as admin
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  You&apos;ll be an <span className="text-primary font-medium">admin</span> — you can answer questions in that space.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

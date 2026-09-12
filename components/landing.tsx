'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircleQuestion, KeyRound, PlusCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { toast } from 'sonner'

export function Landing({ signedIn }: { signedIn: boolean }) {
  const [code, setCode] = useState('')
  const router = useRouter()

  function openCode(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c) return
    router.push(`/s/${c}`)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <MessageCircleQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                {process.env.NEXT_PUBLIC_APP_NAME ?? 'Whisper'}
              </h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Anonymous Q&amp;A, invite-only</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href={signedIn ? '/dashboard' : '/login'}>
                {signedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 sm:py-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Ask anything. Anonymously.
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto">
            Enter a space&apos;s invite code to ask questions anonymously. Get answers from trusted admins.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={openCode}
          className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 max-w-md mx-auto"
        >
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Enter your invite code
          </div>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD1234"
              maxLength={12}
              className="text-center text-lg tracking-widest font-mono uppercase bg-background/50 h-12"
            />
            <Button type="submit" className="h-12 px-5 bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 text-center"
        >
          <Link
            href={signedIn ? '/dashboard' : '/login?next=/dashboard'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Want to host your own space? Create one
          </Link>
        </motion.div>
      </main>
    </div>
  )
}

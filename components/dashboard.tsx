'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, LogOut, Shield, Sparkles, Plus, KeyRound } from 'lucide-react'
import Link from 'next/link'

export function Dashboard({
  spaces, adminEmail, adminName,
}: {
  spaces: { id: string; name: string; slug: string; role: 'admin' | 'overseer' }[]
  adminEmail: string
  adminName: string
}) {
  const router = useRouter()
  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-4xl">
          <div>
            <h1 className="text-sm font-semibold">Welcome, {adminName}</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">{adminEmail}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your spaces</h2>
          {spaces.length > 0 && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/join">
                  <KeyRound className="h-4 w-4 mr-2" /> Join with code
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90">
                <Link href="/dashboard/new">
                  <Plus className="h-4 w-4 mr-2" /> New space
                </Link>
              </Button>
            </div>
          )}
        </div>

        {spaces.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">You&apos;re not in any spaces yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your own space to start answering questions, or join someone else&apos;s with an invite code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button asChild className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90">
                <Link href="/dashboard/new">
                  <Plus className="h-4 w-4 mr-2" /> Create a space
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/join">
                  <KeyRound className="h-4 w-4 mr-2" /> Join with code
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {spaces.map(s => (
              <Link
                key={s.id}
                href={`/dashboard/${s.slug}`}
                className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  {s.role === 'overseer' && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      <Shield className="h-3 w-3 mr-1" /> Overseer
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{s.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  Open dashboard <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

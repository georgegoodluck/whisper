'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { LogOut, Plus, MessageCircleQuestion, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SpaceWorkspace } from './space-workspace'
import { Logo } from '@/components/logo'
import { DangerZone } from '@/components/account/danger-zone'

type Membership = {
  space_id: string
  role: 'overseer' | 'admin'
  display_name: string
  spaces: {
    id: string
    name: string
    description: string | null
    invite_code: string
    owner_id: string
    created_at: string
  }
}

export function DashboardShell({
  user, memberships: initial,
}: {
  user: { id: string; email: string }
  memberships: Membership[]
}) {
  const [memberships, setMemberships] = useState<Membership[]>(initial)
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(initial[0]?.space_id ?? null)
  const [tab, setTab] = useState<'spaces' | 'create' | 'account'>('spaces')
  const supabase = createClient()
  const router = useRouter()

  const ownedSpaces = useMemo(
    () =>
      memberships
        .filter(m => m.role === 'overseer')
        .map(m => ({ id: m.spaces.id, name: m.spaces.name, code: m.spaces.invite_code })),
    [memberships]
  )

  async function logout() {
    await supabase.auth.signOut()
    router.push('/signup')
    router.refresh()
  }

  function handleSpaceDeleted(spaceId: string) {
    setMemberships(prev => {
      const next = prev.filter(m => m.space_id !== spaceId)
      setActiveSpaceId(prevActive =>
        prevActive === spaceId ? (next[0]?.space_id ?? null) : prevActive
      )
      return next
    })
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-sm font-semibold">Dashboard</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">{user.email}</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-secondary/50 border border-border/60">
            <TabsTrigger value="spaces">
              My spaces
              {memberships.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">{memberships.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create space
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-3.5 w-3.5 mr-1" /> Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spaces" className="mt-6">
            {memberships.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
                <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  You&apos;re not part of any space yet.
                </p>
                <Button
                  onClick={() => setTab('create')}
                  className="bg-gradient-to-r from-primary to-fuchsia-500"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create your first space
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                  {memberships.map(m => (
                    <button
                      key={m.space_id}
                      onClick={() => setActiveSpaceId(m.space_id)}
                      className={
                        'rounded-lg border px-4 py-2 text-sm transition-all ' +
                        (activeSpaceId === m.space_id
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60 hover:bg-secondary/50')
                      }
                    >
                      <span className="font-medium">{m.spaces.name}</span>
                      <span className="ml-2 text-xs opacity-70">
                        {m.role === 'overseer' ? '👑' : '🛡'} {m.display_name}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setTab('create')}
                    className="rounded-lg border border-dashed border-border/60 px-4 py-2 text-sm text-muted-foreground hover:border-primary/60 hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-1" /> New
                  </button>
                </div>

                {activeSpaceId && (() => {
                  const m = memberships.find(x => x.space_id === activeSpaceId)
                  if (!m) return null
                  return (
                    <SpaceWorkspace
                      key={m.space_id}
                      membership={m}
                      onDeleted={() => handleSpaceDeleted(m.space_id)}
                      onLeft={() => handleSpaceDeleted(m.space_id)}
                    />
                  )
                })()}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateSpaceForm
              defaultDisplayName={user.email.split('@')[0]}
              onCreated={(m) => {
                setMemberships(prev => [...prev, m])
                setActiveSpaceId(m.space_id)
                setTab('spaces')
                router.refresh()
              }}
              onCancel={() => setTab('spaces')}
            />
          </TabsContent>

          <TabsContent value="account" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6">
              <h2 className="font-semibold mb-1">Account</h2>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-mono text-sm mt-1">{user.email}</p>
            </div>

            <DangerZone ownedSpaces={ownedSpaces} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function CreateSpaceForm({
  defaultDisplayName, onCreated, onCancel,
}: {
  defaultDisplayName: string
  onCreated: (m: Membership) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [displayName, setDisplayName] = useState(defaultDisplayName)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, displayName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Space "${data.space.name}" created — code ${data.space.invite_code}`)
      onCreated({
        space_id: data.space.id,
        role: 'overseer',
        display_name: displayName,
        spaces: data.space,
      })
      setName(''); setDescription('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 max-w-xl">
      <h2 className="font-semibold mb-1">Create a new space</h2>
      <p className="text-xs text-muted-foreground mb-5">
        You&apos;ll be the overseer. You can invite admins later.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Space name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Tech Careers Q&A"
            required
            maxLength={60}
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Description (optional)</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description that appears at the top of the space"
            rows={2}
            maxLength={300}
            className="resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Your display name (shown on answers)</label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. George"
            required
            maxLength={40}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={busy || !name.trim() || !displayName.trim()}
            className="bg-gradient-to-r from-primary to-fuchsia-500 flex-1"
          >
            {busy && <span className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />}
            Create space
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

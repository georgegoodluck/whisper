'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Copy, Check, Users, KeyRound, Shield, MessageCircle, Clock,
  CheckCircle2, Sparkles, Send, Plus, Trash2, Eye, EyeOff, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { timeAgo, type QuestionWithAnswer } from '@/components/question-card'

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

export function SpaceWorkspace({ membership }: { membership: Membership }) {
  const space = membership.spaces
  const isOverseer = membership.role === 'overseer'
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Load questions
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('space_id', space.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) toast.error(error.message)
        else setQuestions((data ?? []) as any)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [supabase, space.id])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`space-admin:${space.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questions', filter: `space_id=eq.${space.id}` },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('questions').select('*, answers(*)').eq('id', payload.new.id).single()
            if (data) setQuestions(prev => [data as any, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setQuestions(prev => prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q))
          } else if (payload.eventType === 'DELETE') {
            setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, async (payload: any) => {
        const { data } = await supabase.from('answers').select('*').eq('id', payload.new.id).single()
        if (!data) return
        setQuestions(prev => prev.map(q => q.id === data.question_id
          ? { ...q, is_answered: true, answers: [data] }
          : q))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, space.id])

  function copyCode() {
    navigator.clipboard.writeText(space.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
    toast.success('Invite code copied')
  }

  function copyLink() {
    const url = `${window.location.origin}/s/${space.invite_code}`
    navigator.clipboard.writeText(url)
    toast.success('Space link copied')
  }

  const pending = questions.filter(q => !q.is_answered && !(q as any).is_hidden)
  const answered = questions.filter(q => q.is_answered && !(q as any).is_hidden)
  const hidden = questions.filter(q => (q as any).is_hidden)

  return (
    <div className="space-y-6">
      {/* Space header */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold">{space.name}</h2>
              {isOverseer ? (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10">
                  👑 Overseer
                </Badge>
              ) : (
                <Badge variant="outline">🛡 Admin</Badge>
              )}
            </div>
            {space.description && (
              <p className="text-sm text-muted-foreground max-w-lg">{space.description}</p>
            )}
          </div>
          <Link
            href={`/s/${space.invite_code}`}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            Open public page <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm tracking-wider">{space.invite_code}</span>
            <Button size="icon" variant="ghost" onClick={copyCode} aria-label="Copy code">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" /> Copy share link
          </Button>
        </div>
      </div>

      {/* Questions */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-secondary/50 border border-border/60">
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="answered">
            Answered <span className="ml-2 text-xs text-muted-foreground">{answered.length}</span>
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Hidden <span className="ml-2 text-xs text-muted-foreground">{hidden.length}</span>
          </TabsTrigger>
          {isOverseer && (
            <TabsTrigger value="team">
              <Users className="h-3.5 w-3.5 mr-1" /> Team
            </TabsTrigger>
          )}
        </TabsList>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <TabsContent value="pending">
              <QuestionList
                list={pending}
                emptyLabel="No pending questions."
                adminName={membership.display_name}
                onAnswer={(id, patch) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))}
                onHide={(id, hidden) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_hidden: hidden } : q))}
                onDelete={async (id) => {
                  if (!confirm('Delete permanently?')) return
                  const { error } = await supabase.from('questions').delete().eq('id', id)
                  if (error) return toast.error(error.message)
                  setQuestions(prev => prev.filter(q => q.id !== id))
                  toast.success('Deleted')
                }}
              />
            </TabsContent>
            <TabsContent value="answered">
              <QuestionList
                list={answered}
                emptyLabel="No answered questions yet."
                adminName={membership.display_name}
                onAnswer={() => {}}
                onHide={(id, hidden) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_hidden: hidden } : q))}
                onDelete={async (id) => {
                  if (!confirm('Delete permanently?')) return
                  const { error } = await supabase.from('questions').delete().eq('id', id)
                  if (error) return toast.error(error.message)
                  setQuestions(prev => prev.filter(q => q.id !== id))
                  toast.success('Deleted')
                }}
              />
            </TabsContent>
            <TabsContent value="hidden">
              <QuestionList
                list={hidden}
                emptyLabel="Nothing hidden."
                adminName={membership.display_name}
                onAnswer={(id, patch) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))}
                onHide={(id, hidden) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_hidden: hidden } : q))}
                onDelete={async (id) => {
                  if (!confirm('Delete permanently?')) return
                  const { error } = await supabase.from('questions').delete().eq('id', id)
                  if (error) return toast.error(error.message)
                  setQuestions(prev => prev.filter(q => q.id !== id))
                  toast.success('Deleted')
                }}
              />
            </TabsContent>

            {isOverseer && (
              <TabsContent value="team">
                <TeamPanel spaceId={space.id} ownerId={space.owner_id} />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}

// --- Question list ---

function QuestionList({
  list, emptyLabel, adminName, onAnswer, onHide, onDelete,
}: {
  list: QuestionWithAnswer[]
  emptyLabel: string
  adminName: string
  onAnswer: (id: string, patch: Partial<QuestionWithAnswer>) => void
  onHide: (id: string, hidden: boolean) => void
  onDelete: (id: string) => void
}) {
  if (list.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {list.map(q => (
        <AdminQuestionRow
          key={q.id}
          q={q}
          adminName={adminName}
          onAnswer={onAnswer}
          onHide={onHide}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function AdminQuestionRow({
  q, adminName, onAnswer, onHide, onDelete,
}: {
  q: QuestionWithAnswer
  adminName: string
  onAnswer: (id: string, patch: Partial<QuestionWithAnswer>) => void
  onHide: (id: string, hidden: boolean) => void
  onDelete: (id: string) => void
}) {
  const [answering, setAnswering] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const answer = q.answers?.[0]
  const isHidden = !!(q as any).is_hidden

  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onAnswer(q.id, { is_answered: true, answers: [data.answer] })
      setText(''); setAnswering(false)
      toast.success('Answer posted')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground/80">Anonymous</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(q.created_at)}
            </span>
            {q.is_answered && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                Answered
              </Badge>
            )}
            {isHidden && <Badge variant="outline">Hidden</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onHide(q.id, !isHidden)} aria-label="Hide">
              {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(q.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{q.content}</p>
      </div>

      {answer && (
        <div className="border-t border-border/60 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-primary">{answer.admin_name}</span>
            <span className="text-muted-foreground">· {timeAgo(answer.created_at)}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{answer.content}</p>
        </div>
      )}

      {!q.is_answered && !isHidden && (
        answering ? (
          <div className="border-t border-border/60 p-5 space-y-3 bg-primary/5">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Reply as ${adminName}…`}
              rows={4}
              autoFocus
              className="resize-none bg-background/50"
            />
            <div className="flex gap-2">
              <Button onClick={submit} disabled={busy || !text.trim()} className="bg-gradient-to-r from-primary to-fuchsia-500">
                {busy
                  ? <span className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  : <Send className="h-4 w-4 mr-2" />}
                Post as {adminName}
              </Button>
              <Button variant="ghost" onClick={() => { setAnswering(false); setText('') }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAnswering(true)}
            className="w-full border-t border-dashed border-border/60 p-4 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Send className="h-4 w-4 inline mr-2" />
            Answer this question
          </button>
        )
      )}
    </div>
  )
}

// --- Team panel (overseer only) ---

function TeamPanel({ spaceId, ownerId }: { spaceId: string; ownerId: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function load() {
    const { data, error } = await supabase
      .from('space_members')
      .select('user_id, role, display_name, joined_at')
      .eq('space_id', spaceId)
    if (error) return toast.error(error.message)
    setMembers(data ?? [])
  }
  useEffect(() => { load() }, [spaceId])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, email, displayName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Admin added')
      setEmail(''); setDisplayName('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(userId: string) {
    if (!confirm('Remove this admin?')) return
    const res = await fetch('/api/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceId, userId }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error)
    toast.success('Removed')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
        <h3 className="font-semibold mb-1">Add an admin</h3>
        <p className="text-xs text-muted-foreground mb-4">
          They must already have an account. Ask them to sign up first, then add them by email.
        </p>
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
          <Input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Display name (e.g. Sarah)"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            maxLength={40}
          />
          <Button
            type="submit"
            disabled={busy || !email.trim() || !displayName.trim()}
            className="bg-gradient-to-r from-primary to-fuchsia-500 sm:col-span-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add admin
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <h3 className="font-semibold">Team</h3>
          <p className="text-xs text-muted-foreground">{members.length} member(s)</p>
        </div>
        <div className="divide-y divide-border/60">
          {members.map(m => (
            <div key={m.user_id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold">
                  {m.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.role === 'overseer' ? '👑 Overseer' : '🛡 Admin'} · joined {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {m.user_id !== ownerId && (
                <Button variant="ghost" size="icon" onClick={() => remove(m.user_id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

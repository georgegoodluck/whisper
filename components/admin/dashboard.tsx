'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Send, Trash2, EyeOff, Eye, LogOut, MessageCircleQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { QuestionWithAnswer } from '@/components/question-card'

export function AdminDashboard({ initial, adminEmail }: { initial: QuestionWithAnswer[]; adminEmail: string }) {
  const [questions, setQuestions] = useState(initial)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel('admin:feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, async (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase.from('questions').select('*, answers(*)').eq('id', payload.new.id).single()
          if (data) setQuestions(prev => [data as any, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setQuestions(prev => prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q))
        } else if (payload.eventType === 'DELETE') {
          setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, async (payload: any) => {
        const { data } = await supabase.from('answers').select('*').eq('id', payload.new.id).single()
        if (data) setQuestions(prev => prev.map(q => q.id === data.question_id ? { ...q, is_answered: true, answers: [data] } : q))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function submitAnswer(questionId: string) {
    if (!text.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setText(''); setAnsweringId(null)
      toast.success('Answer posted')
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  async function toggleHide(q: QuestionWithAnswer) {
    const { error } = await supabase.from('questions').update({ is_hidden: !(q as any).is_hidden }).eq('id', q.id)
    if (error) return toast.error(error.message)
    toast.success((q as any).is_hidden ? 'Unhidden' : 'Hidden')
  }

  async function remove(id: string) {
    if (!confirm('Delete this question permanently?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Deleted')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const pending = questions.filter(q => !q.is_answered && !(q as any).is_hidden)
  const answered = questions.filter(q => q.is_answered && !(q as any).is_hidden)
  const hidden = questions.filter(q => (q as any).is_hidden)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
              <MessageCircleQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Admin Dashboard</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">{adminEmail}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border/60">
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="answered">Answered <span className="ml-2 text-xs text-muted-foreground">{answered.length}</span></TabsTrigger>
            <TabsTrigger value="hidden">Hidden <span className="ml-2 text-xs text-muted-foreground">{hidden.length}</span></TabsTrigger>
          </TabsList>

          {[
            { key: 'pending', list: pending, empty: 'No pending questions.' },
            { key: 'answered', list: answered, empty: 'No answered questions yet.' },
            { key: 'hidden', list: hidden, empty: 'Nothing hidden.' },
          ].map(({ key, list, empty }) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {list.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
                  <p className="text-sm text-muted-foreground">{empty}</p>
                </div>
              ) : list.map(q => (
                <div key={q.id} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground/80">Anonymous</span>
                        <span>·</span>
                        <span>{new Date(q.created_at).toLocaleString()}</span>
                        {q.is_answered && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">Answered</Badge>}
                        {(q as any).is_hidden && <Badge variant="outline">Hidden</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleHide(q)} aria-label="Hide">
                          {(q as any).is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(q.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{q.content}</p>
                  </div>

                  {q.answers?.[0] && (
                    <div className="border-t border-border/60 bg-primary/5 p-5">
                      <p className="text-xs font-semibold text-primary mb-1">Your answer</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{q.answers[0].content}</p>
                    </div>
                  )}

                  {!q.is_answered && !(q as any).is_hidden && (
                    answeringId === q.id ? (
                      <div className="border-t border-border/60 p-5 space-y-3">
                        <Textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          placeholder="Write a thoughtful answer…"
                          rows={4}
                          autoFocus
                          className="resize-none bg-background/50"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => submitAnswer(q.id)} disabled={busy || !text.trim()} className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90">
                            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Post answer
                          </Button>
                          <Button variant="ghost" onClick={() => { setAnsweringId(null); setText('') }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAnsweringId(q.id); setText('') }}
                        className="w-full border-t border-dashed border-border/60 p-4 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <Send className="h-4 w-4 inline mr-2" />
                        Answer this question
                      </button>
                    )
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

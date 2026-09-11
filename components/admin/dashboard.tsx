'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, MessageCircleQuestion, MessageCircle, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuestionModalAdmin } from './question-modal-admin'
import { timeAgo, type QuestionWithAnswer } from '@/components/question-card'

export function AdminDashboard({
  initial, adminEmail, adminName,
}: {
  initial: QuestionWithAnswer[]
  adminEmail: string
  adminName: string
}) {
  const [questions, setQuestions] = useState(initial)
  const [openQ, setOpenQ] = useState<QuestionWithAnswer | null>(null)
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
          setOpenQ(prev => prev && prev.id === payload.new.id ? { ...prev, ...payload.new } as any : prev)
        } else if (payload.eventType === 'DELETE') {
          setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
          setOpenQ(prev => prev?.id === payload.old.id ? null : prev)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, async (payload: any) => {
        const { data } = await supabase.from('answers').select('*').eq('id', payload.new.id).single()
        if (!data) return
        const patch = (q: QuestionWithAnswer) => q.id === data.question_id ? { ...q, is_answered: true, answers: [data] } : q
        setQuestions(prev => prev.map(patch))
        setOpenQ(prev => prev ? patch(prev) : prev)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  function patchQuestion(id: string, patch: Partial<QuestionWithAnswer>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
    setOpenQ(prev => prev && prev.id === id ? { ...prev, ...patch } as any : prev)
  }

  const pending = questions.filter(q => !q.is_answered && !(q as any).is_hidden)
  const answered = questions.filter(q => q.is_answered && !(q as any).is_hidden)
  const hidden = questions.filter(q => (q as any).is_hidden)

  const AdminCard = ({ q }: { q: QuestionWithAnswer }) => {
    const preview = q.content.length > 140 ? q.content.slice(0, 140) + '…' : q.content
    const answer = q.answers?.[0]
    return (
      <button
        type="button"
        onClick={() => setOpenQ(q)}
        className="group text-left rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 h-full flex flex-col hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden relative"
      >
        {q.is_answered && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-primary" />}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground/70">Anonymous</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(q.created_at)}</span>
        </div>
        <p className="text-sm leading-relaxed line-clamp-4 flex-1 break-words">{preview}</p>
        <div className="mt-4 flex items-center justify-between">
          {q.is_answered ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Answered
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-border">Needs answer</Badge>
          )}
          {answer && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              {answer.admin_name}
            </span>
          )}
        </div>
      </button>
    )
  }

  const Empty = ({ label }: { label: string }) => (
    <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
      <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )

  const Grid = ({ list, emptyLabel }: { list: QuestionWithAnswer[]; emptyLabel: string }) => (
    list.length === 0 ? <Empty label={emptyLabel} /> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(q => <AdminCard key={q.id} q={q} />)}
      </div>
    )
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
              <MessageCircleQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Admin Dashboard</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                Signed in as <span className="font-medium text-foreground/80">{adminName}</span> · {adminEmail}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border/60">
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="answered">Answered <span className="ml-2 text-xs text-muted-foreground">{answered.length}</span></TabsTrigger>
            <TabsTrigger value="hidden">Hidden <span className="ml-2 text-xs text-muted-foreground">{hidden.length}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Grid list={pending} emptyLabel="No pending questions. Great work!" />
          </TabsContent>
          <TabsContent value="answered">
            <Grid list={answered} emptyLabel="No answered questions yet." />
          </TabsContent>
          <TabsContent value="hidden">
            <Grid list={hidden} emptyLabel="Nothing hidden." />
          </TabsContent>
        </Tabs>
      </main>

      <QuestionModalAdmin
        q={openQ}
        onClose={() => setOpenQ(null)}
        adminName={adminName}
        onChanged={(patch) => openQ && patchQuestion(openQ.id, patch)}
      />
    </div>
  )
}

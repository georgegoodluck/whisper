'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuestionCard, type QuestionWithAnswer } from '@/components/question-card'
import { QuestionModal } from '@/components/question-modal'
import { AskDialog } from '@/components/ask-dialog'
import { MessageCircleQuestion } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDeviceId } from '@/lib/device-id'

export function SpaceBoard({
  spaceId, initial,
}: {
  spaceId: string
  initial: QuestionWithAnswer[]
}) {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>(initial)
  const [deviceId, setDeviceId] = useState<string>('')
  const [openQ, setOpenQ] = useState<QuestionWithAnswer | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { setDeviceId(getDeviceId()) }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`space:${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questions', filter: `space_id=eq.${spaceId}` },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('questions').select('*, answers(*)').eq('id', payload.new.id).single()
            if (data && !data.is_hidden) setQuestions(prev => [data as any, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setQuestions(prev =>
              prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q)
                  .filter(q => !q.is_hidden)
            )
            setOpenQ(prev => prev && prev.id === payload.new.id ? { ...prev, ...payload.new } as any : prev)
          } else if (payload.eventType === 'DELETE') {
            setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
            setOpenQ(prev => prev?.id === payload.old.id ? null : prev)
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, async (payload: any) => {
        const { data } = await supabase.from('answers').select('*').eq('id', payload.new.id).single()
        if (!data) return
        const updater = (q: QuestionWithAnswer) =>
          q.id === data.question_id ? { ...q, is_answered: true, answers: [data] } : q
        setQuestions(prev => prev.map(updater))
        setOpenQ(prev => prev ? updater(prev) : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, spaceId])

  const pending = questions.filter(q => !q.is_answered)
  const answered = questions.filter(q => q.is_answered)
  const mine = questions.filter(q => q.device_id === deviceId)

  const Empty = ({ label }: { label: string }) => (
    <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
      <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )

  const Grid = ({ list, emptyLabel }: { list: QuestionWithAnswer[]; emptyLabel: string }) => (
    list.length === 0 ? <Empty label={emptyLabel} /> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(q => (
          <QuestionCard
            key={q.id}
            q={q}
            isMine={q.device_id === deviceId}
            onOpen={setOpenQ}
          />
        ))}
      </div>
    )
  )

  return (
    <>
      <div className="max-w-2xl mx-auto mb-10">
        <AskDialog spaceId={spaceId} />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/60">
          <TabsTrigger value="all">
            All <span className="ml-2 text-xs text-muted-foreground">{pending.length}</span>
          </TabsTrigger>
          <TabsTrigger value="answered">
            Answered <span className="ml-2 text-xs text-muted-foreground">{answered.length}</span>
          </TabsTrigger>
          <TabsTrigger value="mine">
            Mine {mine.length > 0 && <span className="ml-2 text-xs text-muted-foreground">{mine.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Grid list={pending} emptyLabel="No open questions yet. Be the first." />
        </TabsContent>
        <TabsContent value="answered">
          <Grid list={answered} emptyLabel="No answers yet." />
        </TabsContent>
        <TabsContent value="mine">
          <Grid list={mine} emptyLabel="You haven't asked anything yet." />
        </TabsContent>
      </Tabs>

      <QuestionModal
        q={openQ}
        onClose={() => setOpenQ(null)}
        isMine={!!openQ && openQ.device_id === deviceId}
      />
    </>
  )
}

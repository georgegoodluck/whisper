'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuestionCard, type QuestionWithAnswer } from './question-card'
import { MessageCircleQuestion } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDeviceId } from '@/lib/device-id'

export function Feed({ initial }: { initial: QuestionWithAnswer[] }) {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>(initial)
  const [deviceId, setDeviceId] = useState<string>('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { setDeviceId(getDeviceId()) }, [])

  useEffect(() => {
    const channel = supabase
      .channel('public:feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, async (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('questions')
            .select('*, answers(*)')
            .eq('id', payload.new.id)
            .single()
          if (data && !data.is_hidden) setQuestions(prev => [data as any, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setQuestions(prev =>
            prev
              .map(q => q.id === payload.new.id ? { ...q, ...payload.new } : q)
              .filter(q => !q.is_hidden)
          )
        } else if (payload.eventType === 'DELETE') {
          setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'answers' }, async (payload: any) => {
        const { data } = await supabase.from('answers').select('*').eq('id', payload.new.id).single()
        if (!data) return
        setQuestions(prev =>
          prev.map(q => q.id === data.question_id ? { ...q, is_answered: true, answers: [data] } : q)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const pending = questions.filter(q => !q.is_answered)
  const answered = questions.filter(q => q.is_answered)
  const mine = questions.filter(q => q.device_id === deviceId)

  const Empty = ({ label }: { label: string }) => (
    <div className="text-center py-16 rounded-2xl border border-dashed border-border/60">
      <MessageCircleQuestion className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList className="bg-secondary/50 border border-border/60">
        <TabsTrigger value="all">
          All
          <span className="ml-2 text-xs text-muted-foreground">{pending.length}</span>
        </TabsTrigger>
        <TabsTrigger value="answered">
          Answered
          <span className="ml-2 text-xs text-muted-foreground">{answered.length}</span>
        </TabsTrigger>
        <TabsTrigger value="mine">
          Mine
          {mine.length > 0 && <span className="ml-2 text-xs text-muted-foreground">{mine.length}</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {pending.length === 0 ? <Empty label="No open questions yet. Be the first." /> : pending.map(q => <QuestionCard key={q.id} q={q} isMine={q.device_id === deviceId} />)}
      </TabsContent>
      <TabsContent value="answered" className="space-y-4">
        {answered.length === 0 ? <Empty label="No answers yet." /> : answered.map(q => <QuestionCard key={q.id} q={q} isMine={q.device_id === deviceId} />)}
      </TabsContent>
      <TabsContent value="mine" className="space-y-4">
        {mine.length === 0 ? <Empty label="You haven&apos;t asked anything yet." /> : mine.map(q => <QuestionCard key={q.id} q={q} isMine />)}
      </TabsContent>
    </Tabs>
  )
}

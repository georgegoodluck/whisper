'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Clock, Sparkles, User, Send, Loader2, Trash2, EyeOff, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, type QuestionWithAnswer } from '@/components/question-card'

export function QuestionModalAdmin({
  q, onClose, adminName, onChanged,
}: {
  q: QuestionWithAnswer | null
  onClose: () => void
  adminName: string
  onChanged: (patch: Partial<QuestionWithAnswer>) => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  // Reset textarea when the question changes
  useEffect(() => { setText('') }, [q?.id])

  // Escape to close + scroll lock
  useEffect(() => {
    if (!q) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [q, onClose])

  async function submit() {
    if (!q || !text.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChanged({ is_answered: true, answers: [data.answer] })
      setText('')
      toast.success('Answer posted')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleHide() {
    if (!q) return
    const next = !(q as any).is_hidden
    const { error } = await supabase.from('questions').update({ is_hidden: next }).eq('id', q.id)
    if (error) return toast.error(error.message)
    onChanged({ is_hidden: next } as any)
    toast.success(next ? 'Hidden from public' : 'Visible again')
  }

  async function remove() {
    if (!q) return
    if (!confirm('Delete this question permanently?')) return
    const { error } = await supabase.from('questions').delete().eq('id', q.id)
    if (error) return toast.error(error.message)
    toast.success('Deleted')
    onClose()
  }

  const answer = q?.answers?.[0]
  const isHidden = !!(q as any)?.is_hidden

  return (
    <AnimatePresence>
      {q && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative w-full h-full overflow-y-auto bg-background"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
              <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium text-foreground/80">Anonymous question</span>
                  {q.is_answered && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                      Answered
                    </Badge>
                  )}
                  {isHidden && <Badge variant="outline">Hidden</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={toggleHide} aria-label="Hide">
                    {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-14">
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(q.created_at)}
                </span>
              </div>

              {/* Question */}
              <h1 className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight whitespace-pre-wrap break-words">
                {q.content}
              </h1>

              {/* Existing answer */}
              {answer && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.25 }}
                  className="mt-8 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{answer.admin_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Admin · {timeAgo(answer.created_at)}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-primary ml-auto" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-[15px] sm:text-base leading-relaxed text-foreground/95 whitespace-pre-wrap break-words">
                      {answer.content}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Answer composer (only if not answered) */}
              {!q.is_answered && (
                <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-primary/10">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      Reply as <span className="bg-gradient-to-r from-primary to-fuchsia-400 bg-clip-text text-transparent">{adminName}</span>
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <Textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Write your answer…"
                      rows={6}
                      autoFocus
                      maxLength={5000}
                      className="resize-none bg-background/60 border-border/60 focus-visible:ring-primary/40 text-[15px]"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{text.length}/5000</span>
                      <Button
                        onClick={submit}
                        disabled={busy || !text.trim()}
                        className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90 shadow-lg shadow-primary/20"
                      >
                        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Post answer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

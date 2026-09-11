'use client'
import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface QuestionWithAnswer {
  id: string
  content: string
  created_at: string
  is_answered: boolean
  device_id: string
  is_hidden?: boolean
  answers?: { id: string; content: string; created_at: string }[]
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function QuestionCard({ q, isMine }: { q: QuestionWithAnswer; isMine?: boolean }) {
  const answer = q.answers?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden hover:border-border transition-colors"
    >
      <div className="p-5 sm:p-6 flex gap-4">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Anonymous</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo(q.created_at)}
            </span>
            {isMine && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                You
              </Badge>
            )}
            {q.is_answered && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Answered
              </Badge>
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-foreground/95 break-words whitespace-pre-wrap">
            {q.content}
          </p>
        </div>
      </div>

      {answer && (
        <div className="relative border-t border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-semibold bg-gradient-to-r from-primary to-fuchsia-400 bg-clip-text text-transparent">
                  Admin
                </span>
                <span className="text-muted-foreground">{timeAgo(answer.created_at)}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/90 break-words whitespace-pre-wrap">
                {answer.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

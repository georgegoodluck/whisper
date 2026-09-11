'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Clock, Sparkles, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QuestionWithAnswer } from './question-card'
import { timeAgo } from './question-card'
import { ShareButton } from './share/share-button'

export function QuestionModal({
  q, onClose, isMine,
}: {
  q: QuestionWithAnswer | null
  onClose: () => void
  isMine?: boolean
}) {
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

  const siteUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const siteName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Whisper'

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
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-xl">
              <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium text-foreground/80">Anonymous question</span>
                  {isMine && (
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                      You
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {q.answers?.[0] && (
                    <ShareButton question={q} siteUrl={siteUrl} siteName={siteName} />
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-10 sm:py-16">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(q.created_at)}
                </span>
                {q.is_answered ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                    Answered
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Awaiting answer
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight whitespace-pre-wrap break-words">
                {q.content}
              </h1>

              <div className="mt-10">
                {q.answers?.[0] ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{q.answers[0].admin_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Admin · {timeAgo(q.answers[0].created_at)}
                        </p>
                      </div>
                      <Sparkles className="h-4 w-4 text-primary ml-auto" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-[15px] sm:text-base leading-relaxed text-foreground/95 whitespace-pre-wrap break-words">
                        {q.answers[0].content}
                      </p>
                    </div>

                    <div className="border-t border-border/60 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 bg-background/40">
                      <p className="text-xs text-muted-foreground">
                        Helpful? Share this answer with someone who needs it.
                      </p>
                      <ShareButton question={q} siteUrl={siteUrl} siteName={siteName} />
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No answer yet. An admin will respond soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

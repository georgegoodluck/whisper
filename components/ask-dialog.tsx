'use client'
import { useState } from 'react'
import { Send, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getDeviceId } from '@/lib/device-id'

export function AskDialog({ spaceId }: { spaceId: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, content, deviceId: getDeviceId() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setContent('')
      toast.success('Question posted anonymously')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Posted anonymously · Rate-limited
      </div>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Ask anything… no one will know it was you."
        maxLength={1000}
        rows={4}
        className="resize-none bg-background/50 border-border/60 focus-visible:ring-primary/40 text-[15px]"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">{content.length}/1000</span>
        <Button
          type="submit"
          disabled={!content.trim() || loading}
          className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Submit
        </Button>
      </div>
    </form>
  )
}

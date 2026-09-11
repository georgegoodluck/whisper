'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Loader2, Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ShareCard } from './share-card'
import type { QuestionWithAnswer } from '@/components/question-card'

export function ShareButton({
  question, siteUrl, siteName,
}: {
  question: QuestionWithAnswer
  siteUrl: string
  siteName: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const disabled = !question.answers?.[0]

  async function renderPng(): Promise<Blob> {
    if (!cardRef.current) throw new Error('Card not ready')
    await new Promise(r => setTimeout(r, 120))
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: '#0a0a0b',
    })
    const res = await fetch(dataUrl)
    return res.blob()
  }

  function getCaption() {
    const q = question.content.length > 140
      ? question.content.slice(0, 140) + '…'
      : question.content
    const a = question.answers?.[0]
    const ansPreview = a
      ? (a.content.length > 200 ? a.content.slice(0, 200) + '…' : a.content)
      : ''
    return [
      `❓ "${q}"`,
      a ? `\n💬 ${a.admin_name}:\n${ansPreview}` : '',
      `\n— Get your anonymous question answered at ${siteUrl}`,
    ].filter(Boolean).join('\n')
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whisper-answer-${question.id.slice(0, 8)}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function shareNative() {
    try {
      setBusy(true)
      const blob = await renderPng()
      const file = new File([blob], 'whisper-answer.png', { type: 'image/png' })

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        (navigator as any).canShare({ files: [file] }) &&
        'share' in navigator

      if (canShareFiles) {
        await (navigator as any).share({
          files: [file],
          title: `${siteName} — Answer`,
          text: getCaption(),
        })
        toast.success('Shared!')
      } else {
        downloadBlob(blob)
        try {
          await navigator.clipboard.writeText(getCaption())
          toast.success('Image downloaded. Caption copied.')
        } catch {
          toast.success('Image downloaded.')
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(e.message ?? 'Share failed')
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    try {
      setBusy(true)
      const blob = await renderPng()
      downloadBlob(blob)
      toast.success('Image downloaded')
    } catch (e: any) {
      toast.error(e.message ?? 'Download failed')
    } finally {
      setBusy(false)
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(getCaption())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success('Caption copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={shareNative}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
          Share
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || busy}
          onClick={download}
          aria-label="Download image"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={copyCaption}
          aria-label="Copy caption"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <ShareCard ref={cardRef} question={question} siteUrl={siteUrl} siteName={siteName} />
      </div>
    </>
  )
}

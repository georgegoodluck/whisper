'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Loader2, Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ShareCard } from './share-card'
import type { QuestionWithAnswer } from '@/components/question-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

  async function renderPng(): Promise<Blob> {
    if (!cardRef.current) throw new Error('Card not ready')
    // Small delay to ensure QR is rendered
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
    const q = question.content.length > 140 ? question.content.slice(0, 140) + '…' : question.content
    const a = question.answers?.[0]
    const ansPreview = a
      ? a.content.length > 200
        ? a.content.slice(0, 200) + '…'
        : a.content
      : ''
    return [
      `❓ "${q}"`,
      a ? `\n💬 ${a.admin_name}:\n${ansPreview}` : '',
      `\n— Get your anonymous question answered at ${siteUrl}`,
    ].filter(Boolean).join('\n')
  }

  async function shareNative() {
    try {
      setBusy(true)
      const blob = await renderPng()
      const file = new File([blob], 'whisper-answer.png', { type: 'image/png' })
      const shareData: ShareData = {
        files: [file],
        title: `${siteName} — Answer`,
        text: getCaption(),
      }

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        (navigator as any).canShare({ files: [file] })

      if (canShareFiles && 'share' in navigator) {
        await navigator.share(shareData)
        toast.success('Shared!')
      } else {
        // Fallback: download + copy
        downloadBlob(blob)
        await copyCaption()
        toast.success('Image downloaded. Caption copied — paste both into WhatsApp.')
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(e.message ?? 'Share failed')
    } finally {
      setBusy(false)
    }
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

  const disabled = !question.answers?.[0]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={shareNative} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            Share as image (WhatsApp)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={download} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Download image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyCaption} className="cursor-pointer">
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy caption only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Off-screen render target */}
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

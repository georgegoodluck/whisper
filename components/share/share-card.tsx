'use client'
import { forwardRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Sparkles, User } from 'lucide-react'
import { loadLogoAsDataUrl } from '@/lib/logo-loader'
import type { QuestionWithAnswer } from '@/components/question-card'

interface ShareCardProps {
  question: QuestionWithAnswer
  siteUrl: string
  siteName: string
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ question, siteUrl, siteName }, ref) {
    const [qr, setQr] = useState<string>('')
    const [logo, setLogo] = useState<string>('')
    const answer = question.answers?.[0]

    useEffect(() => {
      QRCode.toDataURL(siteUrl, {
        width: 260,
        margin: 1,
        color: { dark: '#0a0a0b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(setQr).catch(() => {})
    }, [siteUrl])

    useEffect(() => {
      loadLogoAsDataUrl('/logo.png')
        .then(setLogo)
        .catch(err => console.warn('[share-card] logo load failed:', err))
    }, [])

    const shortQ = question.content.length > 260
      ? question.content.slice(0, 260) + '…'
      : question.content
    const shortA = answer && answer.content.length > 420
      ? answer.content.slice(0, 420) + '…'
      : answer?.content ?? ''

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background:
            'radial-gradient(1200px 600px at 50% -10%, rgba(139,92,246,0.35), transparent 60%), linear-gradient(180deg, #0a0a0b 0%, #0f0a1f 100%)',
          color: '#f5f5f7',
          padding: 72,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header with logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={siteName}
              width={80}
              height={80}
              style={{
                borderRadius: 20,
                objectFit: 'contain',
                boxShadow: '0 10px 30px rgba(139,92,246,0.4)',
              }}
            />
          ) : (
            <div
              style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Sparkles size={40} color="#fff" />
            </div>
          )}
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{siteName}</div>
            <div style={{ fontSize: 20, opacity: 0.6 }}>Anonymous Q&amp;A</div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '10px 22px',
              borderRadius: 999,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#c4b5fd',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Answered
          </div>
        </div>

        {/* Question */}
        <div style={{ marginTop: 64 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 22,
              color: '#a1a1aa',
              marginBottom: 24,
            }}
          >
            Anonymous question
          </div>
          <div
            style={{
              fontSize: 54,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: -1,
              color: '#ffffff',
            }}
          >
            &ldquo;{shortQ}&rdquo;
          </div>
        </div>

        {/* Answer */}
        {answer && (
          <div
            style={{
              marginTop: 56,
              padding: 44,
              borderRadius: 32,
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.25)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <User size={28} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff' }}>
                  {answer.admin_name}
                </div>
                <div style={{ fontSize: 20, opacity: 0.55 }}>Admin · {siteName}</div>
              </div>
              <Sparkles size={26} color="#a78bfa" style={{ marginLeft: 'auto' }} />
            </div>
            <div
              style={{
                fontSize: 34,
                lineHeight: 1.5,
                color: '#e4e4e7',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
              }}
            >
              {shortA}
            </div>
          </div>
        )}

        {/* Footer / CTA with QR */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {qr && (
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" width={120} height={120} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
              Got a question? Ask anonymously.
            </div>
            <div style={{ fontSize: 22, color: '#a1a1aa' }}>
              Scan the code or visit{' '}
              <span style={{ color: '#c4b5fd' }}>
                {siteUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

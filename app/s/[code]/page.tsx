import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { SpaceBoard } from '@/components/space-board'
import { ThemeToggle } from '@/components/theme-toggle'
import { MessageCircleQuestion, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export const dynamic = 'force-dynamic'

export default async function SpacePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const admin = await createAdminClient()

  const { data: space } = await admin
    .from('spaces')
    .select('id, name, description, invite_code')
    .eq('invite_code', code.toLowerCase())
    .maybeSingle()

  if (!space) notFound()

  const { data: questions } = await admin
    .from('questions')
    .select('*, answers(*)')
    .eq('space_id', space.id)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(200)

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Whisper'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-3">
           <Logo size={36} />
            <div>
              <h1 className="text-base font-semibold tracking-tight">{space.name}</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                {appName} · /s/{space.invite_code}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="Admin">
              <Link href="/admin/login"><Shield className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {space.description && (
          <p className="text-center text-sm text-muted-foreground mb-8 max-w-2xl mx-auto">
            {space.description}
          </p>
        )}

        <SpaceBoard spaceId={space.id} initial={(questions ?? []) as any} />

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Be kind. Don&apos;t abuse the anonymity.
        </footer>
      </main>
    </div>
  )
}

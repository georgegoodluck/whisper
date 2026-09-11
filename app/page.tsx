import { createAdminClient } from '@/lib/supabase/server'
import { Feed } from '@/components/feed'
import { AskDialog } from '@/components/ask-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { MessageCircleQuestion, Shield } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createAdminClient()
  const { data: questions } = await supabase
    .from('questions')
    .select('*, answers(*)')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(200)

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Whisper'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <MessageCircleQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{appName}</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Anonymous Q&amp;A</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/admin/login"
              aria-label="Admin"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            >
              <Shield className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        <section className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Ask anything. Anonymously.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            No login. No identity. Just your questions, answered by admins.
          </p>
        </section>

        <div className="max-w-2xl mx-auto">
          <AskDialog />
        </div>

        <div className="mt-10">
          <Feed initial={(questions ?? []) as any} />
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Be kind. Don&apos;t abuse the anonymity.
        </footer>
      </main>
    </div>
  )
}

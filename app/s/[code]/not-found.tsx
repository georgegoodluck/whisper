import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-8">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-lg font-semibold mb-2">Invalid invite code</h1>
        <p className="text-sm text-muted-foreground mb-4">
          This invite code is invalid, revoked, or the space no longer exists.
        </p>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  )
}

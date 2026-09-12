'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OwnedSpace {
  id: string
  name: string
  code: string
}

export function DangerZone({ ownedSpaces }: { ownedSpaces: OwnedSpace[] }) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState<OwnedSpace[] | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const canDelete = confirmText === 'DELETE'

  async function doDelete() {
    if (!canDelete) return
    setBusy(true)
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      const data = await res.json()

      if (res.status === 409) {
        // User owns spaces — show which ones
        setBlocked(data.ownedSpaces ?? [])
        toast.error(data.error)
        return
      }
      if (!res.ok) throw new Error(data.error)

      toast.success('Account deleted. Goodbye 👋')
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? 'Could not delete account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Danger zone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account and remove yourself from every space you&apos;re an admin of.
            Anonymous questions you asked as a visitor are <span className="font-medium text-foreground">not</span> deleted as that would break the anonymity promise.
          </p>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete my account
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delete your account?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This removes your login, your space memberships, and all answers you&apos;ve posted
                  as an admin. <span className="font-medium text-foreground">This cannot be undone.</span>
                </p>
              </div>
            </div>

            {blocked && blocked.length > 0 && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-4 text-xs">
                <p className="font-medium text-amber-400 mb-2">
                  You still own {blocked.length} space{blocked.length === 1 ? '' : 's'}:
                </p>
                <ul className="space-y-1 text-amber-200/90">
                  {blocked.map(s => (
                    <li key={s.id} className="font-mono">
                      · {s.name} <span className="opacity-60">({s.code})</span>
                    </li>
                  ))}
                </ul>
                <p className="text-amber-200/80 mt-2">
                  Delete or hand off these spaces from your dashboard first.
                </p>
              </div>
            )}

            <div className="mb-5">
              <label className="text-xs font-medium block mb-2">
                Type <code className="bg-secondary px-1.5 py-0.5 rounded">DELETE</code> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); setConfirmText(''); setBlocked(null) }}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                onClick={doDelete}
                disabled={busy || !canDelete}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

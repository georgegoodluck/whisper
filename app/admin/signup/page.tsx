import { Suspense } from 'react'
import { AdminSignupForm } from './signup-form'

export const dynamic = 'force-dynamic'

export default function AdminSignup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 animate-pulse">
          <div className="h-6 w-40 bg-secondary rounded mb-4" />
          <div className="h-10 bg-secondary rounded mb-3" />
          <div className="h-10 bg-secondary rounded mb-3" />
          <div className="h-10 bg-secondary rounded mb-3" />
          <div className="h-10 bg-secondary rounded" />
        </div>
      </div>
    }>
      <AdminSignupForm />
    </Suspense>
  )
}

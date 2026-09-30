// Owner: FE2 - Login page
// Participants sign in with Google; organizers/superadmins use the email +
// password form revealed by the "Organizer sign-in" link.
'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { PosterHeading } from '@/components/brand/PosterHeading'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export default function LoginPage() {
  const [supabase] = useState(() => createBrowserClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showOrg, setShowOrg] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback_failed') {
      setError('That sign-in link was invalid or expired. Please try again.')
    }
  }, [])

  async function signInWithGoogle() {
    setGoogleLoading(true)
    setError(null)
    const params = new URLSearchParams(window.location.search)
    const next = params.get('redirect')
    const redirectTo = `${window.location.origin}/api/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  function handleForgot() {
    setError(null)
    window.location.assign('/reset-password' + (email ? `?email=${encodeURIComponent(email)}` : ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error ?? 'Sign-in failed. Check your email and password.')
        return
      }
      window.location.assign(result.data?.redirect ?? '/dashboard')
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md app-fade-in">
      <div className="rounded-2xl border-2 border-border bg-panel p-6 shadow-lg sm:p-8 lg:border-4">
        <PosterHeading as="h1" fillClassName="text-primary-yellow" className="text-3xl sm:text-4xl">Sign in</PosterHeading>
        <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
          Students from SRM KTR or any other college sign in with Google. Organizers use the email and password the association gave them.
        </p>

        <div role="note" className="mt-5 flex items-start gap-3 rounded-xl border-2 border-border bg-primary-yellow/15 px-4 py-3 text-sm font-medium leading-6 text-foreground">
          <Info size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
          <p>
            <span className="font-bold">Use your personal email</span> (e.g. Gmail) to register — not your SRM email ID (@srmist.edu.in).
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="app-button-secondary mt-6 w-full py-4 flex items-center justify-center gap-3 text-sm disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border-2 border-border bg-brand px-4 py-3 text-sm font-bold text-white">
            <div className="h-2 w-2 shrink-0 rounded-full bg-white" />
            {error}
          </div>
        )}

        <div className="mt-6 border-t-2 border-border pt-5">
          {!showOrg ? (
            <button
              type="button"
              onClick={() => setShowOrg(true)}
              className="inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-brand"
            >
              Organizer sign-in <ArrowRight size={14} />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">Organizer sign-in</p>
              <div>
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@srmist.edu.in"
                  required
                  className="app-input w-full text-sm font-medium"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Password</label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="font-tech text-xs font-bold uppercase tracking-wide text-brand hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="app-input w-full font-mono tracking-widest text-lg"
                />
              </div>
              <button type="submit" disabled={loading} className="app-button-primary w-full py-4 flex items-center justify-center gap-2 text-sm">
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-sm font-medium text-foreground-soft">
        <Link href="/events" className="font-bold text-brand hover:underline">Browse events</Link> without signing in.
      </p>
    </div>
  )
}

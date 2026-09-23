// Owner: FE2 - Login page
// Participants sign in with Google; organizers/superadmins use the email +
// password form revealed by the "Organizer sign-in" link.
'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, Fingerprint } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

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
        setError(result.error ?? 'Access denied. Invalid credentials.')
        return
      }
      window.location.assign(result.data?.redirect ?? '/dashboard')
    } catch {
      setError('Connection dropped. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-slate-100 relative">
      <div className="grid w-full max-w-[1100px] overflow-hidden border border-white/10 bg-[#112240] lg:grid-cols-2 relative z-10 app-fade-in">

        {/* Left: Auth */}
        <section className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-300 transition-colors uppercase tracking-widest">
            <ArrowRight size={14} className="rotate-180" /> Back to Home
          </Link>

          <div className="mb-10 space-y-3">
            <div className="w-12 h-12 bg-white/5 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-8">
              <Fingerprint size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Sign in.</h1>
            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
              Participants sign in with Google. Organisers use their email and password.
            </p>
          </div>

          {/* Google (participants) */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3.5 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">for participants</p>

          {error && (
            <div className="mt-5 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Divider + organizer reveal */}
          <div className="my-7 flex items-center gap-4 text-[0.7rem] font-semibold uppercase tracking-widest text-slate-600">
            <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
          </div>

          {!showOrg ? (
            <button
              type="button"
              onClick={() => setShowOrg(true)}
              className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              Organizer sign-in <ArrowRight size={14} />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Organizer Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cintel.in"
                  required
                  className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-400 tracking-wide">Password</label>
                  <button type="button" onClick={handleForgot} className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all font-mono tracking-widest text-lg"
                />
              </div>
              <button type="submit" disabled={loading} className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all text-sm">
                {loading ? 'Authenticating…' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </section>

        {/* Right: Showcase */}
        <section className="hidden lg:flex flex-col justify-between border-l border-white/10 bg-[#0a1629] p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 border border-amber-300/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/5 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-300/25 bg-amber-300/10 text-amber-200 text-[0.65rem] font-bold tracking-[0.14em] uppercase mb-8">
              <TerminalSquare size={14} /> Cintel Infrastructure
            </div>
            <h2 className="text-3xl font-semibold text-white leading-tight">
              Scale operations <br /><span className="text-slate-500">with precision engineering.</span>
            </h2>
          </div>
          <div className="space-y-6 mt-12">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0"><Zap size={14} /></div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Instant Event Provisioning</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Launch and configure custom parameters with automated database scaffolding instantly.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0"><LayoutGrid size={14} /></div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Full-Scale Control Plane</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Control global broadcasts, manage ticketing queues, and enforce check-in cryptography at scale.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

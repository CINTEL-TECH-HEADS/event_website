// Owner: FE2 - Organizer login page (Premium EdTech Cyberpunk Fusion)
'use client'
import { Suspense, useEffect, useState } from 'react'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, Fingerprint } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback_failed') {
      setError('That confirmation link was invalid or expired. Try signing in or resend the email.')
    }
  }, [])

  async function handleResendVerification() {
    if (!pendingVerifyEmail) return
    setResetMsg('Sending…')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerifyEmail }),
      })
      const result = await res.json()
      setResetMsg(result.data?.message ?? result.error ?? 'Verification email sent.')
    } catch {
      setResetMsg('Could not resend. Try again.')
    }
  }

  async function handleForgot() {
    setError(null)
    setResetMsg(null)
    if (!email) {
      setError('Enter your email above first, then tap “Forgot password”.')
      return
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()
      setResetMsg(result.data?.message ?? result.error ?? 'Check your email for a reset link.')
    } catch {
      setError('Could not send reset email. Try again.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetMsg(null)
    setPendingVerifyEmail(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Access Denied. Invalid credentials.')
        return
      }

      // Email not verified yet — show the verify prompt, don't redirect
      if (result.data?.needsVerification) {
        setPendingVerifyEmail(result.data.email ?? email)
        setResetMsg(result.data.message ?? 'Please verify your email before signing in.')
        return
      }

      // Server decides the destination based on the account's role
      window.location.assign(result.data?.redirect ?? '/participant/portal')
    } catch (error) {
      setError('Connection dropped. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-slate-100 relative">

      <div className="grid w-full max-w-[1100px] overflow-hidden border border-white/10 bg-[#112240]  lg:grid-cols-2 relative z-10 app-fade-in">
        
        {/* Left Side: Auth Block */}
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
                One login for everyone — organisers land in the dashboard, participants in their portal.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Workspace Email</label>
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
                  <label className="block text-xs font-bold text-slate-400 tracking-wide">Master Password</label>
                  <button
                    type="button"
                    onClick={handleForgot}
                    className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
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
                  className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all font-mono tracking-widest text-lg"
                />
              </div>

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              {resetMsg && (
                <div className="border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm font-medium text-amber-200">
                  {resetMsg}
                  {pendingVerifyEmail && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-2 block text-xs font-semibold text-amber-300 underline hover:text-amber-200"
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading} className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all mt-4 text-sm">
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>

            <div className="pt-4 text-center">
              <span className="text-slate-500 text-sm">New here? </span>
              <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-bold text-sm tracking-wide transition-colors">
                Sign up
              </Link>
            </div>
          </form>

        </section>

        {/* Right Side: Showcase (Premium EdTech Style) */}
        <section className="hidden lg:flex flex-col justify-between border-l border-white/10 bg-[#0a1629] p-12 lg:p-16 relative overflow-hidden">
           {/* Abstract Geometric shapes */}
           <div className="absolute right-0 bottom-0 w-64 h-64 border border-amber-300/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
           <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/5 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-300/25 bg-amber-300/10 text-amber-200 text-[0.65rem] font-bold tracking-[0.14em] uppercase mb-8">
                 <TerminalSquare size={14} /> Cintel Infrastructure
              </div>
              <h2 className="text-3xl font-semibold text-white leading-tight">
                 Scale operations <br/><span className="text-slate-500">with precision engineering.</span>
              </h2>
           </div>

           <div className="space-y-6 mt-12">
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8  bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Zap size={14} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm mb-1">Instant Event Provisioning</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Launch and configure custom parameters with automated database scaffolding instantly.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8  bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <LayoutGrid size={14} />
                 </div>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[0.65rem] tracking-widest font-mono text-amber-500 uppercase">
          [System Connecting...]
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

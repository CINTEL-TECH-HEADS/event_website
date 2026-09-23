// Owner: FE2 - Login page
// Participants sign in with Google; organizers/superadmins use the email +
// password form revealed by the "Organizer sign-in" link.
'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, Fingerprint } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'
import { ShipShape } from '@/components/brand/ShipShape'

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
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-foreground relative">

      <div className="grid w-full max-w-[1100px] overflow-hidden rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg lg:grid-cols-2 relative z-10 app-fade-in">

        {/* Left Side: Auth Block */}
        <section className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">

          <Link href="/" className="mb-8 inline-flex items-center gap-2 font-tech text-xs font-bold text-foreground-soft hover:text-brand transition-colors uppercase tracking-widest">
            <ArrowRight size={14} className="rotate-180" /> Back to Home
          </Link>

          <div className="mb-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-yellow text-[#14120F] border-2 border-border flex items-center justify-center mb-8">
              <Fingerprint size={24} />
            </div>
            <PosterHeading as="h1" fillClassName="text-brand" className="text-3xl sm:text-4xl">Sign in.</PosterHeading>
            <p className="text-sm font-medium text-foreground-soft leading-relaxed max-w-sm">
              Participants sign in with Google. Organisers use their email and password.
            </p>
          </div>

          {/* Google (participants) */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="app-button-secondary w-full py-4 flex items-center justify-center gap-3 text-sm disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <p className="mt-2 text-center font-tech text-xs uppercase tracking-widest text-foreground-soft">for participants</p>

          {error && (
            <div className="mt-5 bg-brand text-white border-2 border-border rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white shrink-0" />
              {error}
            </div>
          )}

          {/* Divider + organizer reveal */}
          <div className="my-7 flex items-center gap-4 font-tech text-[0.7rem] font-bold uppercase tracking-widest text-foreground-soft">
            <div className="h-0.5 flex-1 bg-border" /> or <div className="h-0.5 flex-1 bg-border" />
          </div>

          {!showOrg ? (
            <button
              type="button"
              onClick={() => setShowOrg(true)}
              className="inline-flex items-center gap-1.5 self-center font-tech text-sm font-bold uppercase tracking-wide text-brand hover:underline transition-colors"
            >
              Organizer sign-in <ArrowRight size={14} />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Organizer Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cintel.in"
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
                {loading ? 'Authenticating…' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </section>

        {/* Right Side: Showcase — vintage arcade sci-fi poster scene */}
        <section className="hidden lg:flex flex-col justify-between border-l-2 sm:border-l-4 border-border bg-[#14120F] text-[#F5F0E3] p-12 lg:p-16 relative overflow-hidden">
           <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />

           {/* orbit rings + scattered rocks + ship, all decorative */}
           <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
             <svg className="absolute -right-16 top-6 h-2/3 w-full opacity-40" viewBox="0 0 400 400" fill="none">
               <ellipse cx="200" cy="200" rx="180" ry="65" stroke="#F2C230" strokeWidth="1" transform="rotate(-12 200 200)" />
               <ellipse cx="200" cy="200" rx="140" ry="50" stroke="#F2C230" strokeWidth="1" transform="rotate(-12 200 200)" />
             </svg>
             <RockShape variant={2} fill="#D6294C" className="absolute -left-6 top-10 h-16 w-16 rotate-[14deg] opacity-95" />
             <RockShape variant={3} fill="#D6294C" className="absolute right-8 top-20 h-12 w-12 rotate-[-10deg] opacity-90" />
             <RockShape variant={1} fill="#D6294C" className="absolute bottom-24 left-10 h-14 w-14 rotate-[20deg] opacity-90" />
             <Starburst rings color="#F2C230" className="absolute right-[18%] top-1/4 h-28 w-28 opacity-90" />
             <Sparkle className="absolute left-1/3 top-16 h-3 w-3 text-primary-yellow" />
             <Sparkle className="absolute right-1/4 bottom-28 h-2.5 w-2.5 text-[#F5F0E3]" />
             <ShipShape className="absolute -bottom-2 -right-6 h-24 w-40 opacity-95" />
           </div>

           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border-2 border-[#F5F0E3] bg-transparent text-[#F5F0E3] font-tech text-[0.65rem] font-bold tracking-[0.14em] uppercase mb-8">
                 <TerminalSquare size={14} /> Cintel Infrastructure
              </div>
              <PosterHeading as="h2" fillClassName="text-primary-yellow" className="text-3xl leading-tight">
                 Scale operations <br /><span className="text-[#F5F0E3]/70">with precision engineering.</span>
              </PosterHeading>
           </div>

           <div className="space-y-6 mt-12 relative z-10">
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8 rounded-full bg-[#F5F0E3] text-[#14120F] border-2 border-[#F5F0E3] flex items-center justify-center shrink-0">
                    <Zap size={14} />
                 </div>
                 <div>
                    <h3 className="text-[#F5F0E3] font-tech font-bold text-sm mb-1 uppercase tracking-wide">Instant Event Provisioning</h3>
                    <p className="text-[#F5F0E3]/70 text-sm leading-relaxed">Launch and configure custom parameters with automated database scaffolding instantly.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8 rounded-full bg-[#F5F0E3] text-[#14120F] border-2 border-[#F5F0E3] flex items-center justify-center shrink-0">
                    <LayoutGrid size={14} />
                 </div>
                 <div>
                    <h3 className="text-[#F5F0E3] font-tech font-bold text-sm mb-1 uppercase tracking-wide">Full-Scale Control Plane</h3>
                    <p className="text-[#F5F0E3]/70 text-sm leading-relaxed">Control global broadcasts, manage ticketing queues, and enforce check-in cryptography at scale.</p>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </div>
  )
}

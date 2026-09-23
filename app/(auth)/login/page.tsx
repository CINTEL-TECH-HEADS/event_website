// Owner: FE2 - Login page
'use client'
import { Suspense, useEffect, useState } from 'react'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, Fingerprint, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { OtpInput, MIN_OTP } from '@/components/auth/OtpInput'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'
import { ShipShape } from '@/components/brand/ShipShape'

function LoginForm() {
  const [supabase] = useState(() => createBrowserClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [verifyStep, setVerifyStep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback_failed') {
      setError('That link was invalid or expired. Sign in, or request a new code.')
    }
  }, [])

  function handleForgot() {
    setError(null)
    // Go to the OTP reset flow, prefilling the email when present
    window.location.assign('/reset-password' + (email ? `?email=${encodeURIComponent(email)}` : ''))
  }

  async function handleResend() {
    setInfo('Sending…')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()
      setInfo(result.data?.message ?? result.error ?? 'A new code is on its way.')
    } catch {
      setInfo('Could not resend. Try again.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Access Denied. Invalid credentials.')
        return
      }

      // Unverified account → move to the 6-digit code step
      if (result.data?.needsVerification) {
        setInfo(`Your email isn't verified yet. We sent a verification code to ${email}.`)
        setVerifyStep(true)
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < MIN_OTP) {
      setError('Enter the code from your email.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    window.location.assign('/participant/portal')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-foreground relative">

      <div className="grid w-full max-w-[1100px] overflow-hidden rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg lg:grid-cols-2 relative z-10 app-fade-in">

        {/* Left Side: Auth Block */}
        <section className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">

          <Link href="/" className="mb-8 inline-flex items-center gap-2 font-tech text-xs font-bold text-foreground-soft hover:text-brand transition-colors uppercase tracking-widest">
            <ArrowRight size={14} className="rotate-180" /> Back to Home
          </Link>

          {verifyStep ? (
            <>
              <div className="mb-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-accent text-white border-2 border-border flex items-center justify-center mb-8">
                  <MailCheck size={24} />
                </div>
                <PosterHeading as="h1" fillClassName="text-brand" className="text-3xl sm:text-4xl">Verify your email.</PosterHeading>
                <p className="text-sm font-medium text-foreground-soft leading-relaxed max-w-sm">
                  Enter the code we sent to <span className="text-foreground font-bold">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <OtpInput value={otp} onChange={setOtp} autoFocus disabled={loading} />

                {error && (
                  <div className="bg-brand text-white border-2 border-border rounded-xl px-4 py-3 text-sm font-bold">{error}</div>
                )}
                {info && (
                  <div className="app-alert-info px-4 py-3 text-sm font-medium">{info}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < MIN_OTP}
                  className="app-button-primary w-full py-4 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                  {!loading && <ArrowRight size={16} />}
                </button>

                <div className="pt-1 text-center font-tech text-xs text-foreground-soft">
                  Didn't get it?{' '}
                  <button type="button" onClick={handleResend} className="text-brand hover:underline font-bold uppercase tracking-wide">Resend code</button>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setVerifyStep(false); setOtp(''); setError(null); setInfo(null) }}
                    className="font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-yellow text-[#14120F] border-2 border-border flex items-center justify-center mb-8">
                  <Fingerprint size={24} />
                </div>
                <PosterHeading as="h1" fillClassName="text-brand" className="text-3xl sm:text-4xl">Sign in.</PosterHeading>
                <p className="text-sm font-medium text-foreground-soft leading-relaxed max-w-sm">
                  One login for everyone — organisers land in the dashboard, participants in their portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Workspace Email</label>
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
                      <label className="block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Master Password</label>
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

                  {error && (
                    <div className="bg-brand text-white border-2 border-border rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                      {error}
                    </div>
                  )}

                  {info && (
                    <div className="app-alert-info px-4 py-3 text-sm font-medium">{info}</div>
                  )}

                  <button type="submit" disabled={loading} className="app-button-primary w-full py-4 flex items-center justify-center gap-2 mt-4 text-sm">
                    {loading ? 'Authenticating...' : 'Sign In'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </div>

                <div className="pt-4 text-center">
                  <span className="font-tech text-sm text-foreground-soft">New here? </span>
                  <Link href="/signup" className="text-brand hover:underline font-bold text-sm uppercase tracking-wide transition-colors">
                    Sign up
                  </Link>
                </div>
              </form>
            </>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-xs tracking-widest font-mono text-brand uppercase font-bold">
          [System Connecting...]
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

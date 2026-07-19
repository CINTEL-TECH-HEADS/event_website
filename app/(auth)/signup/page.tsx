'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, ShieldCheck, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { OtpInput, MIN_OTP } from '@/components/auth/OtpInput'

function SignupForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/participant/portal'
  const [supabase] = useState(() => createBrowserClient())
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Failed to create account.')
        return
      }

      // Email confirmation required → move to the 6-digit code step
      if (result.data?.needsVerification) {
        setInfo(`We sent a verification code to ${email}. Enter it below to verify.`)
        setStep('otp')
        return
      }

      window.location.assign(result.data?.redirect ?? redirect)
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
    // Session is now set (cookie) — new accounts are participants
    window.location.assign('/participant/portal')
  }

  async function handleResend() {
    setError(null)
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-slate-100 relative">

      <div className="grid w-full max-w-[1100px] overflow-hidden border border-white/10 bg-[#112240]  lg:grid-cols-2 relative z-10 app-fade-in">

        {/* Left Side: Auth Block */}
        <section className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">

          {step === 'otp' ? (
            <>
              <div className="mb-10 space-y-3">
                <div className="w-12 h-12 bg-white/5 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-8">
                  <MailCheck size={24} />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Verify your email.</h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
                  Enter the code we sent to <span className="text-slate-300">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <OtpInput value={otp} onChange={setOtp} autoFocus disabled={loading} />

                {error && (
                  <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm font-medium text-amber-200">
                    {info}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < MIN_OTP}
                  className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                  {!loading && <ArrowRight size={16} />}
                </button>

                <div className="pt-1 text-center text-sm text-slate-500">
                  Didn't get it?{' '}
                  <button type="button" onClick={handleResend} className="text-amber-400 hover:text-amber-300 font-semibold">
                    Resend code
                  </button>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setOtp(''); setError(null); setInfo(null) }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Use a different email
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-10 space-y-3">
                <div className="w-12 h-12 bg-white/5 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-8">
                  <ShieldCheck size={24} />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Create your account.</h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
                  Sign up to track your event registrations, QR passes, teams and certificates — all in one place.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400 tracking-wide">Password</label>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all font-mono tracking-widest text-lg"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400 tracking-wide">Confirm Password</label>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all font-mono tracking-widest text-lg"
                    />
                  </div>

                  {error && (
                    <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all mt-4 text-sm">
                    {loading ? 'Creating account…' : 'Create account'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </div>

                <div className="pt-4 text-center">
                  <span className="text-slate-500 text-sm">Already have an account? </span>
                  <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold text-sm tracking-wide transition-colors">
                    Sign in
                  </Link>
                </div>
              </form>
            </>
          )}

        </section>

        {/* Right Side: Showcase (Premium EdTech Style) */}
        <section className="hidden lg:flex flex-col justify-between border-l border-white/10 bg-[#0a1629] p-12 lg:p-16 relative overflow-hidden">
           {/* Abstract Geometric shapes */}
           <div className="absolute right-0 bottom-0 w-64 h-64 border border-amber-300/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
           <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/5 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-300/25 bg-amber-300/10 text-amber-200 text-[0.65rem] font-bold tracking-[0.14em] uppercase mb-8">
                 <TerminalSquare size={14} /> Cintel Events
              </div>
              <h2 className="text-3xl font-semibold text-white leading-tight">
                 Everything you registered for <br/><span className="text-slate-500">in one place.</span>
              </h2>
           </div>

           <div className="space-y-6 mt-12">
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8  bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Zap size={14} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm mb-1">Your QR passes, always handy</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Pull up your check-in QR code for any event you've registered for, right from your phone.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8  bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <LayoutGrid size={14} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm mb-1">Teams &amp; certificates</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Manage your team for group events and download certificates once they're released.</p>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[0.65rem] tracking-widest font-mono text-amber-500 uppercase">
          [System Connecting...]
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}

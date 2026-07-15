'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, ArrowRight } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { OtpInput, MIN_OTP } from '@/components/auth/OtpInput'

function ResetForm() {
  const searchParams = useSearchParams()
  const prefill = searchParams.get('email') ?? ''
  const [supabase] = useState(() => createBrowserClient())
  const [step, setStep] = useState<'email' | 'code' | 'done'>(prefill ? 'code' : 'email')
  const [email, setEmail] = useState(prefill)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(prefill ? `Enter the code we sent to ${prefill}.` : null)
  const [loading, setLoading] = useState(false)

  async function sendCode(target: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      })
      const result = await res.json()
      setInfo(result.data?.message ?? 'If an account exists, a code is on its way.')
      setStep('code')
    } catch {
      setError('Could not send the code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Enter your email.'); return }
    await sendCode(email)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < MIN_OTP) { setError('Enter the code from your email.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError(null)

    const { error: vErr } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' })
    if (vErr) { setError(vErr.message); setLoading(false); return }

    const { error: uErr } = await supabase.auth.updateUser({ password })
    if (uErr) { setError(uErr.message); setLoading(false); return }

    // Sign the recovery session out so they sign in fresh (login handles role routing)
    await supabase.auth.signOut()
    setStep('done')
    setTimeout(() => window.location.assign('/login'), 1600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-slate-100 relative">
      <div className="w-full max-w-md border border-white/10 bg-[#112240] p-8 sm:p-10 relative z-10 app-fade-in">
        <div className="mb-8 space-y-3">
          <div className="w-12 h-12 bg-white/5 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-4">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Reset your password.</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {step === 'email'
              ? "Enter your email and we'll send you a verification code."
              : step === 'code'
              ? 'Enter the code from your email and choose a new password.'
              : 'All set.'}
          </p>
        </div>

        {step === 'done' ? (
          <div className="border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
            Password updated. Redirecting you to sign in…
          </div>
        ) : step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all text-sm font-medium"
              />
            </div>
            {error && (
              <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
            >
              {loading ? 'Sending…' : 'Send code'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Verification code</label>
              <OtpInput value={otp} onChange={setOtp} autoFocus disabled={loading} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">New password</label>
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
              <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Confirm new password</label>
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
              <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400">{error}</div>
            )}
            {info && (
              <div className="border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm font-medium text-amber-200">{info}</div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < MIN_OTP}
              className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
            >
              {loading ? 'Updating…' : 'Update password'}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="text-center text-sm text-slate-500">
              Didn't get a code?{' '}
              <button type="button" onClick={() => sendCode(email)} className="text-amber-400 hover:text-amber-300 font-semibold">
                Resend
              </button>
            </div>
          </form>
        )}

        <div className="pt-6 text-center">
          <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetForm />
    </Suspense>
  )
}

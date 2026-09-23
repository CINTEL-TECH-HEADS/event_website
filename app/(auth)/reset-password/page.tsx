'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, ArrowRight } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { OtpInput, MIN_OTP } from '@/components/auth/OtpInput'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Sparkle } from '@/components/brand/Starburst'

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
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-foreground relative">
      <div className="w-full max-w-md rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg p-8 sm:p-10 relative z-10 app-fade-in overflow-hidden">
        {/* Poster corner accent */}
        <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-yellow border-2 border-border pointer-events-none">
          <Sparkle className="h-4 w-4 text-[#14120F]" />
        </div>

        <div className="mb-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white border-2 border-border flex items-center justify-center mb-4">
            <KeyRound size={22} />
          </div>
          <PosterHeading as="h1" fillClassName="text-brand" className="text-2xl sm:text-3xl">Reset your password.</PosterHeading>
          <p className="text-sm text-foreground-soft leading-relaxed">
            {step === 'email'
              ? "Enter your email and we'll send you a verification code."
              : step === 'code'
              ? 'Enter the code from your email and choose a new password.'
              : 'All set.'}
          </p>
        </div>

        {step === 'done' ? (
          <div className="app-alert-success px-4 py-3 text-sm font-bold">
            Password updated. Redirecting you to sign in…
          </div>
        ) : step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="app-input w-full text-sm font-medium"
              />
            </div>
            {error && (
              <div className="bg-brand text-white border-2 border-border rounded-xl px-4 py-3 text-sm font-bold">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="app-button-primary w-full py-4 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send code'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Verification code</label>
              <OtpInput value={otp} onChange={setOtp} autoFocus disabled={loading} />
            </div>
            <div>
              <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="app-input w-full font-mono tracking-widest text-lg"
              />
            </div>
            <div>
              <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="app-input w-full font-mono tracking-widest text-lg"
              />
            </div>

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
              {loading ? 'Updating…' : 'Update password'}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="text-center font-tech text-xs text-foreground-soft">
              Didn't get a code?{' '}
              <button type="button" onClick={() => sendCode(email)} className="text-brand hover:underline font-bold uppercase tracking-wide">
                Resend
              </button>
            </div>
          </form>
        )}

        <div className="pt-6 text-center">
          <Link href="/login" className="font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground transition-colors">
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

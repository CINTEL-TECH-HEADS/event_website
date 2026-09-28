'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { OtpInput, MIN_OTP } from '@/components/auth/OtpInput'
import { PosterHeading } from '@/components/brand/PosterHeading'

function ResetForm() {
  const searchParams = useSearchParams()
  const prefill = searchParams.get('email') ?? ''
  const [supabase] = useState(() => createBrowserClient())
  // Always start on the email step: a code is only sent when they press "Send code".
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState(prefill)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
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
    <div className="w-full max-w-md app-fade-in">
      <div className="rounded-2xl border-2 border-border bg-panel p-6 shadow-lg sm:p-8 lg:border-4">
        <div className="mb-6">
          <PosterHeading as="h1" fillClassName="text-primary-yellow" className="text-3xl">Reset password</PosterHeading>
          <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
            {step === 'email'
              ? 'For organizer accounts. Enter your email and we’ll send a verification code.'
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
              Didn&apos;t get a code?{' '}
              <button type="button" onClick={() => sendCode(email)} className="text-brand hover:underline font-bold uppercase tracking-wide">
                Resend
              </button>
            </div>
          </form>
        )}

      </div>
      <p className="mt-5 text-center">
        <Link href="/login" className="font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <ResetForm />
    </Suspense>
  )
}

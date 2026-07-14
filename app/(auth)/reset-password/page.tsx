'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, ArrowRight } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createBrowserClient())
  const [password, setPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Supabase establishes a temporary recovery session from the email link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setStatus('loading')
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setStatus('idle')
      return
    }
    setStatus('done')
    setTimeout(() => router.replace('/login'), 1600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-slate-100 relative">
      <div className="w-full max-w-md border border-white/10 bg-[#112240] p-8 sm:p-10 relative z-10 app-fade-in">
        <div className="mb-8 space-y-3">
          <div className="w-12 h-12 bg-white/5 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-4">
            <KeyRound size={22} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Set a new password.</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Choose a new password for your account. Minimum 8 characters.
          </p>
        </div>

        {status === 'done' ? (
          <div className="border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
            Password updated. Redirecting you to sign in…
          </div>
        ) : !ready ? (
          <div className="border border-white/10 bg-[#0a1629] px-4 py-3 text-sm text-slate-400">
            Open this page from the reset link in your email. Waiting for a valid reset session…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {error && (
              <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="public-force-white w-full border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
            >
              {status === 'loading' ? 'Updating…' : 'Update password'}
              {status !== 'loading' && <ArrowRight size={16} />}
            </button>
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

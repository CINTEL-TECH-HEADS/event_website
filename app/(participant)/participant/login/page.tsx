'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Blocks, LogIn } from 'lucide-react'

export default function ParticipantLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading'>('idle')
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const res  = await fetch('/api/participant/auth/magic-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (json.error) {
        setError(json.error)
        setStatus('idle')
      } else {
        window.location.href = json.data?.redirect ?? '/participant/portal'
      }
    } catch {
      setError('Something went wrong. Try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-[0.2em] mb-6">
            <Blocks size={12} />
            Participant Portal
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Registrations</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in with your registered email</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 py-3 rounded-xl font-bold hover:bg-slate-100 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} className="text-amber-500" />
                  Sign In / Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
            Use the email you registered with.<br />
            A new account is created automatically on first login.
          </p>

          <div className="mt-5 pt-5 border-t border-white/5 text-center">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Organizer? Sign in here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, KeyRound } from 'lucide-react'

type State = 'checking' | 'ready' | 'joining' | 'success' | 'error'

export default function JoinTeamPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [state, setState]     = useState<State>('checking')
  const [message, setMessage] = useState('')
  const [regId, setRegId]     = useState<string | null>(null)

  // Require login: bounce to /login with a redirect back here.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then((me) => {
        if (!me.authenticated) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/join/${code}`)}`
          return
        }
        setState('ready')
      })
      .catch(() => setState('ready'))
  }, [code])

  async function handleJoin() {
    setState('joining')
    const { data, error } = await fetch('/api/participant/team/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: code.toUpperCase() }),
    }).then(r => r.json())

    if (error) { setMessage(error); setState('error') }
    else {
      setMessage(data.message)
      setRegId(data.registration_id)
      setState('success')
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <div className="w-full border border-white/10 bg-[#0a1629] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-amber-300/30 bg-amber-300/10">
          <Users className="h-7 w-7 text-amber-300" />
        </div>

        {state === 'checking' && (
          <p className="text-sm text-slate-400">Checking your session…</p>
        )}

        {(state === 'ready' || state === 'joining') && (
          <>
            <h1 className="text-xl font-semibold text-white">Join a team</h1>
            <p className="mt-2 text-sm text-slate-400">
              You&apos;re about to join the team for this event with your account.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 border border-white/10 bg-[#07101f] px-4 py-2 font-mono text-sm font-bold tracking-widest text-white">
              <KeyRound size={14} className="text-amber-300" />
              {code?.toUpperCase()}
            </div>
            <button
              onClick={handleJoin}
              disabled={state === 'joining'}
              className="mt-6 w-full bg-amber-300 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
            >
              {state === 'joining' ? 'Joining…' : 'Join Team'}
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-white">Couldn&apos;t join</h1>
            <p className="mt-2 text-sm text-red-300">{message}</p>
            <Link href="/participant/portal" className="mt-6 inline-block text-sm font-semibold text-amber-300 hover:text-amber-200">
              Go to My Events
            </Link>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="text-4xl">🎉</div>
            <h1 className="mt-2 text-xl font-semibold text-white">You&apos;re in!</h1>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
            <button
              onClick={() => router.push(regId ? `/participant/portal/events/${regId}` : '/participant/portal')}
              className="mt-6 w-full bg-white py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              View in Portal
            </button>
          </>
        )}
      </div>
    </div>
  )
}

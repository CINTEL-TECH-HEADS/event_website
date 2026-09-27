'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, KeyRound, PartyPopper } from 'lucide-react'

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
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <div className="w-full rounded-2xl border-2 border-border bg-panel p-6 shadow-md sm:p-8 lg:border-4">
        <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">Team invite</p>

        {state === 'checking' && (
          <div className="mt-6 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        )}

        {(state === 'ready' || state === 'joining') && (
          <>
            <h1 className="mt-2 font-display text-3xl uppercase leading-tight text-foreground">Join a team</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
              You&apos;ll be added to the team that owns this code, under the Google account you&apos;re signed in with.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-panel-muted px-4 py-3">
              <KeyRound size={18} className="shrink-0 text-brand" strokeWidth={2.5} />
              <span className="font-mono text-lg font-bold tracking-widest text-foreground">{code?.toUpperCase()}</span>
            </div>
            <button
              onClick={handleJoin}
              disabled={state === 'joining'}
              className="app-button-primary mt-6 w-full disabled:opacity-50"
            >
              <Users size={16} strokeWidth={2.5} />
              {state === 'joining' ? 'Joining…' : 'Join team'}
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="mt-2 font-display text-3xl uppercase leading-tight text-foreground">Couldn&apos;t join</h1>
            <p className="mt-3 rounded-xl border-2 border-border bg-danger px-4 py-3 text-sm font-bold text-white">{message}</p>
            <Link href="/participant/portal" className="app-button-secondary mt-6 w-full">
              Go to My events
            </Link>
          </>
        )}

        {state === 'success' && (
          <>
            <span className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary-yellow text-[#14120F]">
              <PartyPopper size={24} strokeWidth={2.5} />
            </span>
            <h1 className="mt-3 font-display text-3xl uppercase leading-tight text-foreground">You&apos;re in</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">{message}</p>
            <button
              onClick={() => router.push(regId ? `/participant/portal/events/${regId}` : '/participant/portal')}
              className="app-button-primary mt-6 w-full"
            >
              Open your team
            </button>
          </>
        )}
      </div>
    </div>
  )
}

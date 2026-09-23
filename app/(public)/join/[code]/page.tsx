'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, KeyRound, PartyPopper } from 'lucide-react'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
      <div className="poster-panel relative w-full overflow-hidden p-8 text-center">
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
        <RockShape variant={2} fill="#D6294C" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rotate-[14deg] opacity-90" />
        {state === 'success' ? (
          <Starburst rings color="#F2C230" className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 opacity-80" />
        ) : (
          <Sparkle className="pointer-events-none absolute left-8 bottom-6 h-3 w-3 text-primary-yellow" />
        )}

        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F5F0E3] bg-white/10 text-primary-yellow">
          <Users className="h-7 w-7" strokeWidth={2.5} />
        </div>

        {state === 'checking' && (
          <p className="relative font-tech text-xs text-[#F5F0E3]/80">Checking your session…</p>
        )}

        {(state === 'ready' || state === 'joining') && (
          <>
            <h1 className="relative font-display text-2xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow">Join a team</h1>
            <p className="relative mt-2 font-tech text-xs leading-relaxed text-[#F5F0E3]/80">
              You&apos;re about to join the team for this event with your account.
            </p>
            <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-white/10 px-4 py-2 font-mono text-sm font-bold tracking-widest text-[#F5F0E3]">
              <KeyRound size={14} className="text-primary-yellow" />
              {code?.toUpperCase()}
            </div>
            <button
              onClick={handleJoin}
              disabled={state === 'joining'}
              className="app-button-primary relative mt-6 w-full disabled:opacity-50"
            >
              {state === 'joining' ? 'Joining…' : 'Join Team'}
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="relative font-display text-2xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow">Couldn&apos;t join</h1>
            <p className="relative mt-2 text-sm font-medium text-danger">{message}</p>
            <Link
              href="/participant/portal"
              className="relative mt-6 inline-block font-tech text-xs font-bold uppercase tracking-wider text-primary-yellow transition-colors duration-200 hover:text-[#F5F0E3]"
            >
              Go to My Events
            </Link>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F5F0E3] bg-primary-yellow text-[#14120F]">
              <PartyPopper size={26} strokeWidth={2.5} />
            </div>
            <h1 className="relative mt-3 font-display text-2xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow">You&apos;re in!</h1>
            <p className="relative mt-2 font-tech text-xs leading-relaxed text-[#F5F0E3]/80">{message}</p>
            <button
              onClick={() => router.push(regId ? `/participant/portal/events/${regId}` : '/participant/portal')}
              className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-transparent px-6 py-3 font-tech text-xs font-bold uppercase tracking-wider text-[#F5F0E3] shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              View in Portal
            </button>
          </>
        )}
      </div>
    </div>
  )
}

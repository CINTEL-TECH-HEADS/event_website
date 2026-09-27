// Shown after a solo registration. Polls the registration until the QR pass is
// ready (it is generated after the insert), for up to 30 seconds.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check, Clock, Loader2 } from 'lucide-react'
import { QRDisplay } from '@/components/public/QRDisplay'
import { PosterHeading } from '@/components/brand/PosterHeading'

type RegistrationResponse = {
  display_id: string
  leader_name: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  qr_code_url: string | null
}

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!id) return

    let interval: ReturnType<typeof setInterval> | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null

    function stopPolling() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }

      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
    }

    async function loadRegistration() {
      try {
        const res = await fetch(`/api/registrations/${id}`)
        const { data, error } = await res.json()

        if (error) {
          setError(error)
          stopPolling()
          return
        }

        setRegistration(data as RegistrationResponse)
        setError(null)

        if ((data as RegistrationResponse).qr_code_url) {
          stopPolling()
        }
      } catch {
        setError('Unable to load confirmation details.')
        stopPolling()
      } finally {
        setLoading(false)
      }
    }

    loadRegistration()
    interval = setInterval(loadRegistration, 2000)
    timeout = setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      setTimedOut(true)
    }, 30000)

    return () => {
      stopPolling()
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="rounded-2xl border-2 border-border bg-danger p-8 text-sm font-bold text-white">{error ?? 'Registration not found'}</p>
        <Link href="/participant/portal" className="app-button-secondary mt-6">Open My events</Link>
      </div>
    )
  }

  const waitlisted = registration.status === 'waitlisted'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
        <div>
          <span
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-border ${
              waitlisted ? 'bg-warning text-foreground' : 'bg-success text-white'
            }`}
          >
            {waitlisted ? <Clock size={26} strokeWidth={2.5} /> : <Check size={28} strokeWidth={3} />}
          </span>
          <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-5 text-4xl sm:text-5xl">
            {waitlisted ? 'You’re on the waitlist' : 'You’re registered'}
          </PosterHeading>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-foreground-soft">
            {waitlisted
              ? 'All confirmed spots are taken right now. If a spot opens up, it will appear in My events for you to accept.'
              : 'Show the QR pass at check-in. It is also saved in My events, so you don’t need to keep this page open.'}
          </p>

          <dl className="mt-6 inline-block rounded-2xl border-2 border-border bg-panel px-5 py-3">
            <dt className="font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">Registration ID</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold text-foreground">{registration.display_id}</dd>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/participant/portal" className="app-button-primary">
              Go to My events
            </Link>
            <Link href="/events" className="app-button-secondary">
              Browse events
            </Link>
          </div>
        </div>

        {!waitlisted && (
          <div className="poster-panel p-6 text-center">
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.12]" />
            <p className="relative font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-primary-yellow">Your pass</p>
            <p className="relative mt-1 truncate text-sm font-bold text-[#F5F0E3]">{registration.leader_name}</p>
            <div className="relative mt-5 flex justify-center">
              {registration.qr_code_url ? (
                <QRDisplay qrCodeUrl={registration.qr_code_url} />
              ) : (
                <div className="w-full rounded-2xl border-2 border-[#F5F0E3]/30 bg-white/5 p-8">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-yellow" strokeWidth={2.5} />
                  <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[#F5F0E3]">Preparing your QR pass…</p>
                  {timedOut && (
                    <p className="mt-2 text-xs font-medium leading-5 text-[#F5F0E3]/70">
                      This is taking longer than usual. Your pass will also appear in My events.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

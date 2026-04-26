//FE! This is the confirmation page that users see after registering for an event. It polls the registration status every 2 seconds for up to 30 seconds to check if the QR code is ready, which is needed for event check-in. If the QR code isn't ready within 30 seconds, it shows a message that it may take a little longer and suggests using the resend page if needed. This polling mechanism is necessary because the QR code generation happens asynchronously in a background job after registration, and we want to provide a smooth user experience by automatically updating the page when the QR code is ready without requiring the user to refresh manually.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { QRDisplay } from '@/components/public/QRDisplay'

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
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-sm backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading your confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          {error ?? 'Registration not found'}
        </div>
      </div>
    )
  }

  const waitlisted = registration.status === 'waitlisted'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border border-white/10 bg-[#0a1629] p-8 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
          waitlisted ? 'bg-blue-500/15 text-sky-300' : 'bg-emerald-500/15 text-emerald-300'
        }`}>
          {waitlisted ? '⏳' : '✓'}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          {waitlisted ? 'You are on the waitlist' : 'You are registered successfully'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
          {waitlisted
            ? 'Your registration was received, but confirmed spots are currently full. We’ll notify you if a seat opens up.'
            : 'Your registration was submitted successfully. Keep this page open or use your QR code during event check-in.'}
        </p>

        <div className="mx-auto mt-8 max-w-md border border-white/10 bg-[#0f1d36] p-4 text-left text-sm text-slate-300">
          <p className="font-semibold text-white">Registration ID</p>
          <p className="mt-1 font-mono text-amber-200">{registration.display_id}</p>
        </div>

        {!waitlisted ? (
          <div className="mx-auto mt-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Confirmed
          </div>
        ) : null}

        {!waitlisted ? (
          <div className="mt-8 flex justify-center">
            {registration.qr_code_url ? (
              <QRDisplay qrCodeUrl={registration.qr_code_url} />
            ) : (
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-white">Generating your QR code...</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  We&apos;re checking every 2 seconds for up to 30 seconds.
                  {timedOut ? ' It may take a little longer, so try the resend page if needed.' : ''}
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/resend"
            className="inline-flex items-center justify-center border border-amber-300/20 bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-amber-200"
          >
            Resend Confirmation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-200 transition hover:bg-white/10"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </div>
  )
}

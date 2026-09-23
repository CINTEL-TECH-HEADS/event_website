//FE! This is the confirmation page that users see after registering for an event. It polls the registration status every 2 seconds for up to 30 seconds to check if the QR code is ready, which is needed for event check-in. If the QR code isn't ready within 30 seconds, it shows a message that it may take a little longer and suggests using the resend page if needed. This polling mechanism is necessary because the QR code generation happens asynchronously in a background job after registration, and we want to provide a smooth user experience by automatically updating the page when the QR code is ready without requiring the user to refresh manually.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check, Clock, Loader2 } from 'lucide-react'
import { QRDisplay } from '@/components/public/QRDisplay'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
        <div className="app-panel px-8 py-10 text-center !rounded-poster">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-foreground-soft">Loading your confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="w-full rounded-poster border-2 border-danger bg-danger/10 p-8 text-center font-medium text-danger lg:border-4">
          {error ?? 'Registration not found'}
        </div>
      </div>
    )
  }

  const waitlisted = registration.status === 'waitlisted'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="poster-panel relative overflow-hidden p-8 text-center">
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
        <Starburst rings color={waitlisted ? '#F5F0E3' : '#F2C230'} className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 opacity-80 sm:h-44 sm:w-44" />
        <RockShape variant={1} fill="#D6294C" className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rotate-[-10deg] opacity-90 sm:h-28 sm:w-28" />
        <RockShape variant={2} fill="#D6294C" className="pointer-events-none absolute bottom-8 right-8 hidden h-14 w-14 rotate-[14deg] opacity-90 sm:block" />
        <Sparkle className="pointer-events-none absolute left-10 top-8 h-3 w-3 text-primary-yellow" />

        <div
          className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F5F0E3] ${
            waitlisted ? 'bg-[#F5F0E3]/15 text-[#F5F0E3]' : 'bg-success/25 text-success'
          }`}
        >
          {waitlisted ? <Clock size={32} strokeWidth={2.5} /> : <Check size={36} strokeWidth={3} />}
        </div>

        <h1 className="relative mt-6 font-display text-3xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow sm:text-5xl">
          {waitlisted ? 'You are on the waitlist' : 'You are registered successfully'}
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
          {waitlisted
            ? 'Your registration was received, but confirmed spots are currently full. We’ll notify you if a seat opens up.'
            : 'Your registration was submitted successfully. Keep this page open or use your QR code during event check-in.'}
        </p>

        <div className="relative mx-auto mt-8 max-w-md rounded-2xl border-2 border-[#F5F0E3]/30 bg-white/5 p-4 text-left text-sm">
          <p className="font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5F0E3]/70">Registration ID</p>
          <p className="mt-1 font-mono text-base font-bold text-primary-yellow">{registration.display_id}</p>
        </div>

        {!waitlisted ? (
          <div className="relative mx-auto mt-4">
            <span className="app-badge-success">Confirmed</span>
          </div>
        ) : null}

        {!waitlisted ? (
          <div className="relative mt-8 flex justify-center">
            {registration.qr_code_url ? (
              <QRDisplay qrCodeUrl={registration.qr_code_url} />
            ) : (
              <div className="w-full max-w-md rounded-2xl border-2 border-[#F5F0E3]/30 bg-white/5 p-8 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-yellow" strokeWidth={2.5} />
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[#F5F0E3]">Generating your QR code...</p>
                <p className="mt-2 text-xs font-medium leading-5 text-[#F5F0E3]/70">
                  We&apos;re checking every 2 seconds for up to 30 seconds.
                  {timedOut ? ' It may take a little longer, so try the resend page if needed.' : ''}
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/resend" className="app-button-primary">
            Resend Confirmation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-transparent px-6 py-3 font-tech text-xs font-bold uppercase tracking-wider text-[#F5F0E3] shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </div>
  )
}

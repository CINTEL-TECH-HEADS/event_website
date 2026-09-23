'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'
import { Starburst } from '@/components/brand/Starburst'

export default function QRPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const [qrUrl, setQrUrl]         = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [displayId, setDisplayId] = useState('')
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/participant/registrations/${registration_id}`)
      .then(r => r.json())
      .then(({ data }) => {
        setQrUrl(data?.qr_code_url ?? null)
        setEventName(data?.events?.title ?? '')
        setEventDate(data?.events?.starts_at ?? '')
        setDisplayId(data?.display_id ?? '')
        // attendance has a UNIQUE(registration_id) constraint, so PostgREST may
        // return it as a single object rather than an array — handle both.
        const att = Array.isArray(data?.attendance) ? data.attendance[0] : data?.attendance
        setCheckedInAt(att?.checked_in_at ?? null)
        setLoading(false)
      })
  }, [registration_id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-border border-t-brand rounded-full animate-spin" />
    </div>
  )

  if (!qrUrl) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <p className="font-medium text-foreground-soft mb-2">QR code not available yet.</p>
      <p className="text-sm font-medium text-foreground-soft mb-6">This may happen if you are on the waitlist.</p>
      <Link href={`/participant/portal/events/${registration_id}`} className="text-sm font-bold text-brand hover:text-foreground">
        ← Back
      </Link>
    </div>
  )

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  function saveQR() {
    const link = document.createElement('a')
    link.href = qrUrl!
    link.download = `cintel-qr-${displayId}.png`
    link.click()
  }

  // Already checked in — the QR has served its purpose. Show a clear
  // "verified" confirmation instead of the scannable pass.
  if (checkedInAt) {
    const checkedInDisplay = new Date(checkedInAt).toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-border bg-success text-white mb-6">
          <CheckCircle2 size={44} />
        </div>
        <p className="font-tech text-xs font-bold uppercase tracking-[0.28em] text-success mb-2">Already verified</p>
        <h2 className="font-display text-2xl uppercase text-foreground mb-1">You&apos;re checked in</h2>
        {eventName && <p className="font-medium text-foreground mb-1">{eventName}</p>}
        <p className="text-sm font-medium text-foreground-soft mb-8">Checked in on {checkedInDisplay}</p>
        {displayId && <p className="text-xs text-foreground-soft font-mono mb-8">ID: {displayId}</p>}
        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="flex items-center gap-1.5 text-sm font-bold text-foreground-soft hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to registration
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
      <p className="text-sm font-medium text-foreground-soft mb-8 text-center">
        Show this to the organiser at the entrance
      </p>

      {/* QR frame — poster space-panel with corner tick marks and a starburst accent */}
      <div className="poster-panel relative overflow-hidden p-6 mb-6">
        <Starburst rings color="#F2C230" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 opacity-40" />
        <div className="relative rounded-2xl border-4 border-[#F5F0E3] bg-white p-4">
          <span aria-hidden className="absolute -left-1 -top-1 h-4 w-4 rounded-tl-lg border-l-4 border-t-4 border-primary-red" />
          <span aria-hidden className="absolute -right-1 -top-1 h-4 w-4 rounded-tr-lg border-r-4 border-t-4 border-primary-red" />
          <span aria-hidden className="absolute -left-1 -bottom-1 h-4 w-4 rounded-bl-lg border-b-4 border-l-4 border-primary-red" />
          <span aria-hidden className="absolute -right-1 -bottom-1 h-4 w-4 rounded-br-lg border-b-4 border-r-4 border-primary-red" />
          <img src={qrUrl} alt="Check-in QR Code" className="relative w-64 h-64" />
        </div>
      </div>

      <h2 className="font-display text-xl uppercase leading-tight tracking-tight text-foreground text-center mb-1">{eventName}</h2>

      {formattedDate && (
        <p className="text-foreground-soft text-sm font-medium text-center mb-1">{formattedDate}</p>
      )}

      {displayId && (
        <p className="text-xs text-foreground-soft font-mono mb-8">ID: {displayId}</p>
      )}

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <button
          onClick={saveQR}
          className="app-button-secondary !bg-panel !text-foreground w-full"
        >
          <Download size={16} className="text-accent" />
          Save QR to Device
        </button>

        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="flex items-center gap-1.5 text-sm font-bold text-foreground-soft hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to registration
        </Link>
      </div>
    </div>
  )
}
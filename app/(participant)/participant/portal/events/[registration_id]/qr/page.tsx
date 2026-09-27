'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'

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

  const back = (
    <Link
      href={`/participant/portal/events/${registration_id}`}
      className="mb-6 inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-foreground"
    >
      <ArrowLeft size={14} /> Registration
    </Link>
  )

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand" />
    </div>
  )

  if (!qrUrl) return (
    <div className="mx-auto max-w-md px-4 py-12">
      {back}
      <div className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm">
        <h1 className="font-display text-xl uppercase text-foreground">No pass yet</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
          Your QR pass appears here once your registration is confirmed. If you&apos;re on the waitlist, or the
          event has a fee that hasn&apos;t been verified yet, check back after that.
        </p>
      </div>
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
      <div className="mx-auto max-w-md px-4 py-12">
        {back}
        <div className="rounded-2xl border-2 border-border bg-panel p-6 text-center shadow-sm">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-success text-white">
            <CheckCircle2 size={36} />
          </span>
          <p className="mt-4 font-tech text-xs font-bold uppercase tracking-[0.28em] text-success">Already verified</p>
          <h1 className="mt-1 font-display text-2xl uppercase text-foreground">You&apos;re checked in</h1>
          {eventName && <p className="mt-1 font-medium text-foreground">{eventName}</p>}
          <p className="mt-1 text-sm font-medium text-foreground-soft">Checked in on {checkedInDisplay}</p>
          {displayId && <p className="mt-4 font-mono text-xs text-foreground-soft">ID: {displayId}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {back}
      <div className="grid overflow-hidden rounded-2xl border-2 border-border bg-panel shadow-md sm:grid-cols-[auto_1fr] lg:border-4">
        <div className="flex items-center justify-center border-b-2 border-dashed border-border bg-[#14120F] p-6 sm:border-b-0 sm:border-r-2">
          <div className="rounded-2xl border-4 border-[#F5F0E3] bg-white p-3">
            <img src={qrUrl} alt="Check-in QR code" className="h-60 w-60" />
          </div>
        </div>
        <div className="flex flex-col p-6">
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">QR pass</p>
          <h1 className="mt-2 font-display text-2xl uppercase leading-tight tracking-tight text-foreground">{eventName}</h1>
          {formattedDate && <p className="mt-2 text-sm font-medium text-foreground-soft">{formattedDate}</p>}
          {displayId && <p className="mt-1 font-mono text-sm font-bold text-foreground">ID: {displayId}</p>}
          <p className="mt-4 text-sm font-medium leading-6 text-foreground-soft">Show this to the organizer at the entrance.</p>
          <button onClick={saveQR} className="app-button-secondary mt-6 w-full sm:mt-auto sm:w-auto">
            <Download size={16} className="text-accent" />
            Save QR to device
          </button>
        </div>
      </div>
    </div>
  )
}

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
        setCheckedInAt(data?.attendance?.[0]?.checked_in_at ?? null)
        setLoading(false)
      })
  }, [registration_id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  if (!qrUrl) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <p className="text-slate-400 mb-2">QR code not available yet.</p>
      <p className="text-sm text-slate-500 mb-6">This may happen if you are on the waitlist.</p>
      <Link href={`/participant/portal/events/${registration_id}`} className="text-sm text-amber-400 hover:text-amber-300">
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 mb-6">
          <CheckCircle2 size={44} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400 mb-2">Already verified</p>
        <h2 className="text-2xl font-bold text-white mb-1">You&apos;re checked in</h2>
        {eventName && <p className="text-slate-300 mb-1">{eventName}</p>}
        <p className="text-sm text-slate-400 mb-8">Checked in on {checkedInDisplay}</p>
        {displayId && <p className="text-xs text-slate-500 font-mono mb-8">ID: {displayId}</p>}
        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to registration
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
      <p className="text-sm text-slate-400 mb-8 text-center">
        Show this to the organiser at the entrance
      </p>

      <div className="bg-white  p-6 mb-6 ">
        <img src={qrUrl} alt="Check-in QR Code" className="w-64 h-64" />
      </div>

      <h2 className="text-xl font-semibold text-white text-center mb-1">{eventName}</h2>

      {formattedDate && (
        <p className="text-slate-400 text-sm text-center mb-1">{formattedDate}</p>
      )}

      {displayId && (
        <p className="text-xs text-slate-500 font-mono mb-8">ID: {displayId}</p>
      )}

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <button
          onClick={saveQR}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 py-3  font-bold hover:bg-slate-100 transition-colors "
        >
          <Download size={16} className="text-amber-500" />
          Save QR to Device
        </button>

        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to registration
        </Link>
      </div>
    </div>
  )
}
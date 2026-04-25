'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default function QRPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const [qrUrl, setQrUrl]         = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [displayId, setDisplayId] = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/participant/registrations/${registration_id}`)
      .then(r => r.json())
      .then(({ data }) => {
        setQrUrl(data?.qr_code_url ?? null)
        setEventName(data?.events?.title ?? '')
        setEventDate(data?.events?.starts_at ?? '')
        setDisplayId(data?.display_id ?? '')
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12">
      <p className="text-sm text-slate-400 mb-8 text-center">
        Show this to the organiser at the entrance
      </p>

      <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_0_60px_rgba(245,158,11,0.15)]">
        <img src={qrUrl} alt="Check-in QR Code" className="w-64 h-64" />
      </div>

      <h2 className="text-xl font-black text-white text-center mb-1">{eventName}</h2>

      {formattedDate && (
        <p className="text-slate-400 text-sm text-center mb-1">{formattedDate}</p>
      )}

      {displayId && (
        <p className="text-xs text-slate-500 font-mono mb-8">ID: {displayId}</p>
      )}

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <button
          onClick={saveQR}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
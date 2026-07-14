'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Award, Clock, X } from 'lucide-react'

type CertState = 'loading' | 'not_attended' | 'pending' | 'ready'

export default function CertificatePage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const [state, setState]             = useState<CertState>('loading')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [eventName, setEventName]     = useState('')

  useEffect(() => {
    fetch(`/api/participant/registrations/${registration_id}`)
      .then(r => r.json())
      .then(async ({ data }) => {
        setEventName(data?.events?.title ?? '')

        const attended = Array.isArray(data?.attendance)
          ? data.attendance.length > 0
          : !!data?.attendance?.id
        const cert = Array.isArray(data?.certificates)
          ? data.certificates[0]
          : data?.certificates

        if (!attended) { setState('not_attended'); return }
        if (!cert)     { setState('pending');      return }

        const res = await fetch(
          `/api/certificates/download?email=${encodeURIComponent(data.leader_email)}&event_id=${data.event_id}`
        ).then(r => r.json())

        if (res.data?.downloadUrl) {
          setDownloadUrl(res.data.downloadUrl)
          setState('ready')
        } else {
          setState('pending')
        }
      })
  }, [registration_id])

  function handleDownload() {
    if (!downloadUrl) return
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'certificate.pdf'
    link.click()
  }

  const STATES = {
    loading: {
      icon: <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />,
      title: 'Loading...', body: '', color: 'text-slate-400',
    },
    not_attended: {
      icon: <div className="w-16 h-16 bg-red-500/10 border border-red-500/20  flex items-center justify-center mx-auto"><X className="w-8 h-8 text-red-400" /></div>,
      title: 'Not available', body: 'Attendance was not recorded for this event.', color: 'text-red-400',
    },
    pending: {
      icon: <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20  flex items-center justify-center mx-auto"><Clock className="w-8 h-8 text-amber-400" /></div>,
      title: 'Being prepared', body: 'The organiser is generating certificates. Check back soon.', color: 'text-amber-400',
    },
    ready: {
      icon: <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20  flex items-center justify-center mx-auto"><Award className="w-8 h-8 text-amber-300" /></div>,
      title: 'Certificate ready!', body: '', color: 'text-amber-300',
    },
  }

  const current = STATES[state]

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="text-left mb-10">
        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="mb-6">{current.icon}</div>
      <h1 className={`text-xl font-semibold mb-2 ${current.color}`}>{current.title}</h1>
      {current.body && <p className="text-slate-400 text-sm">{current.body}</p>}
      {eventName && <p className="text-slate-500 text-sm mt-1">{eventName}</p>}

      {state === 'ready' && downloadUrl && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 mt-8 bg-white text-slate-950 px-8 py-3  font-bold hover:bg-slate-100 transition-colors "
        >
          <Download size={16} className="text-amber-500" />
          Download Certificate
        </button>
      )}
    </div>
  )
}

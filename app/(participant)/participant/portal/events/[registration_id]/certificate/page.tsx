'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Award, Clock, X, Loader2, Eye, ShieldCheck } from 'lucide-react'
import { generateCertificateBlob, makeSafeFilename } from '@/lib/certificates/canvas-renderer'

type CertState = 'loading' | 'unreleased' | 'not_eligible' | 'ready' | 'error'

interface CertData {
  released: boolean
  eligible?: boolean
  assignmentId?: string
  certificateType?: string
  participantName?: string
  teamName?: string | null
  registrationType?: 'solo' | 'team'
  eventName?: string
  issueDate?: string
  downloadUrl?: string | null
  template?: {
    id: string
    previewUrl: string | null
    layoutConfig: any
  } | null
  message?: string
}

export default function ParticipantCertificatePage() {
  const { registration_id } = useParams<{ registration_id: string }>()

  const [state, setState] = useState<CertState>('loading')
  const [certData, setCertData] = useState<CertData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Rendering & Download state
  const [rendering, setRendering] = useState(false)
  const [certPreviewBlobUrl, setCertPreviewBlobUrl] = useState<string | null>(null)
  const previewImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!registration_id) return

    fetch(`/api/participant/registrations/${registration_id}/certificate`)
      .then((r) => r.json())
      .then(async (json) => {
        if (json.error) {
          setErrorMessage(json.error)
          setState('error')
          return
        }

        const data: CertData = json.data
        setCertData(data)

        if (!data.released) {
          setState('unreleased')
          return
        }

        if (data.eligible === false) {
          setState('not_eligible')
          return
        }

        setState('ready')

        // Pre-render certificate canvas blob for display & download
        if (data.assignmentId) {
          setRendering(true)
          try {
            const baseUrl = window.location.origin
            const verificationUrl = `${baseUrl}/verify/${data.assignmentId}`

            const blob = await generateCertificateBlob({
              templateImageUrl: data.template?.previewUrl ?? null,
              layoutConfig: data.template?.layoutConfig ?? null,
              participantName: data.participantName ?? 'Participant',
              teamName: data.teamName ?? null,
              verificationUrl,
              eventName: data.eventName,
              certificateType: data.certificateType,
            })

            const blobUrl = URL.createObjectURL(blob)
            setCertPreviewBlobUrl(blobUrl)

            // Save generated certificate blob to database & storage asynchronously if missing
            if (!data.downloadUrl && data.assignmentId) {
              const formData = new FormData()
              formData.append(
                'file',
                blob,
                makeSafeFilename(data.participantName ?? 'Participant', data.certificateType ?? 'Certificate')
              )
              formData.append('assignment_id', data.assignmentId)

              fetch(`/api/participant/registrations/${registration_id}/certificate`, {
                method: 'POST',
                body: formData,
              }).catch((e) => console.warn('Background certificate save error:', e))
            }
          } catch (renderErr) {
            console.error('[ParticipantCertificatePage] Canvas render failed:', renderErr)
          } finally {
            setRendering(false)
          }
        }
      })
      .catch((err) => {
        console.error('[ParticipantCertificatePage] Fetch error:', err)
        setErrorMessage('Failed to load certificate information.')
        setState('error')
      })
  }, [registration_id])

  async function handleDownload() {
    if (!certData) return

    // If pre-rendered blob URL exists, download it
    let targetUrl = certPreviewBlobUrl

    // Fallback to server downloadUrl if blob not generated
    if (!targetUrl && certData.downloadUrl) {
      targetUrl = certData.downloadUrl
    }

    if (!targetUrl && certData.assignmentId) {
      // Generate on demand
      try {
        const baseUrl = window.location.origin
        const verificationUrl = `${baseUrl}/verify/${certData.assignmentId}`
        const blob = await generateCertificateBlob({
          templateImageUrl: certData.template?.previewUrl ?? null,
          layoutConfig: certData.template?.layoutConfig ?? null,
          participantName: certData.participantName ?? 'Participant',
          teamName: certData.teamName ?? null,
          verificationUrl,
          eventName: certData.eventName,
          certificateType: certData.certificateType,
        })
        targetUrl = URL.createObjectURL(blob)
        setCertPreviewBlobUrl(targetUrl)
      } catch (e: any) {
        alert(`Download failed: ${e.message}`)
        return
      }
    }

    if (!targetUrl) {
      alert('Certificate file is not ready yet.')
      return
    }

    const filename = makeSafeFilename(
      certData.participantName ?? 'Participant',
      certData.certificateType ?? 'Certificate'
    )

    const a = document.createElement('a')
    a.href = targetUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Event Details
        </Link>
      </div>

      {state === 'loading' && (
        <div className="bg-slate-900/80 border border-white/10 p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Checking certificate release status...</p>
        </div>
      )}

      {state === 'unreleased' && (
        <div className="bg-slate-900/80 border border-amber-500/30 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto rounded-full">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-amber-300">Certificates Have Not Been Released Yet</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The event organizer has not published certificates for this event yet. Please check back later after the organizer posts them!
          </p>
          {certData?.eventName && (
            <p className="text-xs font-mono text-slate-500 mt-2">Event: {certData.eventName}</p>
          )}
        </div>
      )}

      {state === 'not_eligible' && (
        <div className="bg-slate-900/80 border border-white/10 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto rounded-full">
            <X className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-white">No Certificate Assigned</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {certData?.message ?? 'No certificate record is available for your registration in this event.'}
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-slate-900/80 border border-red-500/30 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto rounded-full">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-red-400">Unable to Load Certificate</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {errorMessage ?? 'An error occurred while loading your certificate.'}
          </p>
        </div>
      )}

      {state === 'ready' && certData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900/90 border border-[#243B72] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <ShieldCheck size={14} />
                Certificate Released
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5E62D] border border-[#F5E62D]/30 bg-[#0B1736] px-3 py-1">
                {certData.certificateType}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white">{certData.participantName}</h1>
            {certData.teamName && (
              <p className="text-sm text-slate-300 font-semibold">Team: {certData.teamName}</p>
            )}
            <p className="text-xs text-slate-400">Event: <span className="text-slate-200 font-medium">{certData.eventName}</span></p>
          </div>

          {/* Certificate Canvas / Image Preview */}
          <div className="bg-slate-950 border border-[#243B72] p-4 text-center space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                <Eye size={14} /> Certificate Preview
              </span>
              <span>ID: {certData.assignmentId}</span>
            </div>

            <div className="relative min-h-[240px] flex items-center justify-center bg-slate-900 border border-slate-800 p-2">
              {rendering ? (
                <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
                  <Loader2 size={24} className="animate-spin text-[#F5E62D]" />
                  <span className="text-xs font-semibold">Rendering Certificate Canvas...</span>
                </div>
              ) : certPreviewBlobUrl ? (
                <img
                  ref={previewImgRef}
                  src={certPreviewBlobUrl}
                  alt={`Certificate for ${certData.participantName}`}
                  className="w-full h-auto max-h-[500px] object-contain shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
                  <Award size={48} className="text-amber-400" />
                  <p className="text-sm font-semibold text-white">Your Certificate is Ready!</p>
                  <p className="text-xs text-slate-400">Click below to download your official certificate.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 bg-[#F5E62D] text-[#0B1736] px-8 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-[#FFF27A] transition-colors"
              >
                <Download size={18} />
                Download Certificate (PNG)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

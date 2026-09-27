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
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/participant/portal/events/${registration_id}`}
          className="inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} /> Registration
        </Link>
      </div>

      {state === 'loading' && (
        <div className="rounded-2xl border-2 border-border bg-panel p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 border-4 border-border border-t-brand rounded-full animate-spin mx-auto" />
          <p className="font-tech text-xs font-bold uppercase tracking-wide text-foreground">Checking certificate release status...</p>
        </div>
      )}

      {state === 'unreleased' && (
        <div className="rounded-2xl border-2 border-border bg-panel p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 border-2 border-border bg-warning/15 flex items-center justify-center mx-auto rounded-full">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <h1 className="font-display text-xl uppercase text-foreground">Certificates not released yet</h1>
          <p className="text-sm font-medium text-foreground-soft max-w-md mx-auto leading-relaxed">
            The organizers haven’t released certificates for this event yet. They will appear here once they do.
          </p>
          {certData?.eventName && (
            <p className="text-xs font-mono font-bold text-foreground-soft mt-2">Event: {certData.eventName}</p>
          )}
        </div>
      )}

      {state === 'not_eligible' && (
        <div className="rounded-2xl border-2 border-border bg-panel p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 border-2 border-border bg-panel-muted flex items-center justify-center mx-auto rounded-full">
            <X className="w-8 h-8 text-foreground-soft" />
          </div>
          <h1 className="font-display text-xl uppercase text-foreground">No Certificate Assigned</h1>
          <p className="text-sm font-medium text-foreground-soft max-w-md mx-auto leading-relaxed">
            {certData?.message ?? 'No certificate record is available for your registration in this event.'}
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-2xl border-2 border-border bg-panel p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 border-2 border-border bg-danger/15 flex items-center justify-center mx-auto rounded-full">
            <X className="w-8 h-8 text-danger" />
          </div>
          <h1 className="font-display text-xl uppercase text-danger">Unable to Load Certificate</h1>
          <p className="text-sm font-medium text-foreground-soft max-w-md mx-auto">
            {errorMessage ?? 'An error occurred while loading your certificate.'}
          </p>
        </div>
      )}

      {state === 'ready' && certData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border-2 border-border bg-panel p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="app-badge-success app-badge">
                <ShieldCheck size={14} />
                Certificate Released
              </span>
              <span className="rounded-full border-2 border-border bg-primary-yellow px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-widest text-[#121212]">
                {certData.certificateType}
              </span>
            </div>

            <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground">{certData.participantName}</h1>
            {certData.teamName && (
              <p className="text-sm text-foreground font-semibold">Team: {certData.teamName}</p>
            )}
            <p className="text-xs font-medium text-foreground-soft">Event: <span className="text-foreground font-bold">{certData.eventName}</span></p>
          </div>

          {/* Certificate Canvas / Image Preview */}
          <div className="rounded-2xl border-2 border-border bg-panel p-4 text-center space-y-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-foreground-soft px-2">
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wide text-foreground">
                <Eye size={14} /> Certificate Preview
              </span>
              <span>ID: {certData.assignmentId}</span>
            </div>

            <div className="relative min-h-[240px] flex items-center justify-center rounded-2xl border-2 border-border bg-panel-muted p-2">
              {rendering ? (
                <div className="flex flex-col items-center gap-2 text-foreground-soft py-12">
                  <Loader2 size={24} className="animate-spin text-brand" />
                  <span className="font-tech text-[10px] font-bold uppercase tracking-wide">Preparing your certificate…</span>
                </div>
              ) : certPreviewBlobUrl ? (
                <img
                  ref={previewImgRef}
                  src={certPreviewBlobUrl}
                  alt={`Certificate for ${certData.participantName}`}
                  className="w-full h-auto max-h-[500px] object-contain shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-foreground-soft py-12">
                  <Award size={48} className="text-brand" />
                  <p className="text-sm font-bold text-foreground">Your Certificate is Ready!</p>
                  <p className="text-xs font-medium text-foreground-soft">Click below to download your official certificate.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="app-button-primary !bg-primary-yellow !text-[#121212] !px-8 !py-3.5"
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

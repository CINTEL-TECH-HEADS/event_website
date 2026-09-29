'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Download, AlertTriangle } from 'lucide-react'
import { TemplateConfig } from './types'
import { generateCertificateBlob } from '@/lib/certificates/canvas-renderer'

interface Props {
  registrationId: string
  teamMemberId: string | null
  assignmentId?: string | null
  name: string
  teamName: string | null
  certType: string
  registrationType: 'solo' | 'team'
  templates: TemplateConfig[]
  onClose: () => void
}

export function PreviewModal({
  registrationId,
  teamMemberId,
  assignmentId: propAssignmentId,
  name,
  teamName,
  certType,
  registrationType,
  templates,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-select template based on registration type + certificate type
  const tmpl = templates.find(
    (t) => t.certificate_type === certType && t.template_type === registrationType
  )

  useEffect(() => {
    let active = true
    let blobUrlToRevoke: string | null = null

    async function renderPreview() {
      if (!tmpl || !tmpl.previewUrl) {
        setError(`No ${registrationType === 'solo' ? 'Solo' : 'Team'} template configured for certificate type: "${certType}". Upload the ${registrationType === 'solo' ? 'Solo' : 'Team'} template first.`)
        setLoading(false)
        return
      }

      // No saved layout → the renderer falls back to default positions.

      try {
        setLoading(true)
        setError(null)

        // Unique assignment ID for QR code
        const finalAssignmentId = propAssignmentId || (teamMemberId
          ? `${registrationId}-${teamMemberId}`
          : registrationId)

        // The site this dashboard is served from — the QR must point back here.
        const baseUrl = window.location.origin
        const verificationUrl = `${baseUrl}/verify/${finalAssignmentId}`

        const blob = await generateCertificateBlob({
          templateImageUrl: tmpl.previewUrl,
          layoutConfig: tmpl.layout_config,
          participantName: name,
          teamName: teamName,
          verificationUrl,
        })

        if (active) {
          const url = URL.createObjectURL(blob)
          blobUrlToRevoke = url
          setPreviewUrl(url)
        }
      } catch (err: any) {
        if (active) setError(err.message ?? 'Failed to render certificate preview')
      } finally {
        if (active) setLoading(false)
      }
    }

    renderPreview()

    return () => {
      active = false
      if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke)
    }
  }, [tmpl, name, teamName, certType, registrationId, teamMemberId, registrationType])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border-4 border-border bg-panel p-6 shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-border pb-4">
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-foreground">Certificate Preview</h3>
            <p className="text-xs font-medium text-foreground-soft">
              {name} {teamName ? `(${teamName})` : ''} — <span className="text-warning">{certType}</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-foreground-soft">({registrationType})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-soft transition hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="my-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-foreground-soft">
              <Loader2 size={32} className="animate-spin text-warning" />
              <span className="text-xs font-bold uppercase tracking-wider">Rendering Certificate Canvas...</span>
            </div>
          )}

          {error && (
            <div className="app-alert-warning max-w-md space-y-2 text-center">
              <AlertTriangle size={24} className="mx-auto text-warning" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <div className="rounded-2xl border-4 border-border shadow-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Generated Certificate"
                className="max-h-[60vh] w-auto object-contain block"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t-2 border-border pt-4">
          <span className="text-[11px] font-medium text-foreground-soft">
            Rendered at template full resolution using browser HTML Canvas.
          </span>
          <div className="flex gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                download={`${name.replace(/\s+/g, '_')}_${certType}.png`}
                className="app-button-primary text-xs"
              >
                <Download size={14} />
                Download Single PNG
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-full border-2 border-border bg-panel-muted px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground-soft transition active:translate-x-[2px] active:translate-y-[2px] hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


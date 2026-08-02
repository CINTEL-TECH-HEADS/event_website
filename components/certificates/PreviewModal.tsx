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

      if (!tmpl.layout_config) {
        setError(`Template for "${certType}" (${registrationType}) is missing layout positioning. Open the Layout editor first.`)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Unique assignment ID for QR code
        const finalAssignmentId = propAssignmentId || (teamMemberId
          ? `${registrationId}-${teamMemberId}`
          : registrationId)

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
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
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col border border-[#243B72] bg-[#0B1736] p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#243B72] pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Certificate Preview</h3>
            <p className="text-xs text-slate-400">
              {name} {teamName ? `(${teamName})` : ''} — <span className="text-[#F5E62D]">{certType}</span>
              <span className="ml-2 text-[10px] uppercase text-slate-500">({registrationType})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="my-4 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <Loader2 size={32} className="animate-spin text-[#F5E62D]" />
              <span className="text-xs font-semibold">Rendering Certificate Canvas...</span>
            </div>
          )}

          {error && (
            <div className="max-w-md border border-amber-500/40 bg-amber-500/10 p-4 text-center text-amber-200 space-y-2">
              <AlertTriangle size={24} className="mx-auto text-amber-400" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && previewUrl && (
            <div className="border border-[#243B72] overflow-hidden">
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
        <div className="flex items-center justify-between border-t border-[#243B72] pt-4">
          <span className="text-[11px] text-slate-500">
            Rendered at template full resolution using browser HTML Canvas.
          </span>
          <div className="flex gap-2">
            {previewUrl && (
              <a
                href={previewUrl}
                download={`${name.replace(/\s+/g, '_')}_${certType}.png`}
                className="inline-flex items-center gap-1.5 bg-[#F5E62D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0B1736] hover:bg-[#FFF27A]"
              >
                <Download size={14} />
                Download Single PNG
              </a>
            )}
            <button
              onClick={onClose}
              className="border border-[#243B72] bg-[#10224A] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


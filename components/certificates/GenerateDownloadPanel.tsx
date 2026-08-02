'use client'

import { useState } from 'react'
import { Download, Loader2, AlertTriangle, Send, CheckCircle2 } from 'lucide-react'
import JSZip from 'jszip'
import { TeamGroup, SoloParticipant, AssignmentRow, TemplateConfig } from './types'
import { generateCertificateBlob, makeSafeFilename } from '@/lib/certificates/canvas-renderer'

interface Props {
  eventId: string
  eventTitle: string
  teams: TeamGroup[]
  solos: SoloParticipant[]
  assignments: AssignmentRow[]
  templates: TemplateConfig[]
  certificatesReleasedAt?: string | null
  onPostCertificatesSuccess?: (releasedAt: string) => void
}

interface BatchProgress {
  total: number
  processed: number
  succeeded: number
  skipped: number
  failed: number
  statusText: string
}

export function GenerateDownloadPanel({
  eventId,
  eventTitle,
  teams,
  solos,
  assignments,
  templates,
  certificatesReleasedAt,
  onPostCertificatesSuccess,
}: Props) {
  const [generating, setGenerating] = useState(false)
  const [posting, setPosting] = useState(false)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [releasedAt, setReleasedAt] = useState<string | null>(certificatesReleasedAt ?? null)

  async function handlePostCertificates() {
    if (!eventId) return
    if (!confirm('Are you sure you want to Post Certificates? Once posted, participants will be able to view/download their certificates, and QR verification will be active.')) {
      return
    }

    setPosting(true)
    setErrorNotice(null)
    try {
      const res = await fetch(`/api/events/${eventId}/post-certificates`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Failed to post certificates')
      }

      const newReleasedAt = json.data?.released_at ?? new Date().toISOString()
      setReleasedAt(newReleasedAt)
      if (onPostCertificatesSuccess) {
        onPostCertificatesSuccess(newReleasedAt)
      }
      alert('Certificates posted successfully! Participants can now access their certificates.')
    } catch (err: any) {
      console.error('[handlePostCertificates]', err)
      setErrorNotice(err.message ?? 'Failed to post certificates')
    } finally {
      setPosting(false)
    }
  }

  async function handleDownloadAllZip() {
    setErrorNotice(null)

    // 1. Build recipient list from checked-in teams & solos + assignments
    interface Recipient {
      registrationId: string
      teamMemberId: string | null
      name: string
      teamName: string | null
      certificateType: string
      registrationType: 'solo' | 'team'
    }

    const recipients: Recipient[] = []

    // Teams
    teams.forEach((t) => {
      t.members.forEach((m) => {
        const asgn = assignments.find(
          (a) => a.registration_id === t.registrationId && a.team_member_id === m.teamMemberId
        )
        const certType = asgn?.certificate_type ?? 'Participation'
        recipients.push({
          registrationId: t.registrationId,
          teamMemberId: m.teamMemberId,
          name: m.name,
          teamName: t.teamName,
          certificateType: certType,
          registrationType: 'team',
        })
      })
    })

    // Solos
    solos.forEach((s) => {
      const asgn = assignments.find(
        (a) => a.registration_id === s.registrationId && a.team_member_id === null
      )
      const certType = asgn?.certificate_type ?? 'Participation'
      recipients.push({
        registrationId: s.registrationId,
        teamMemberId: null,
        name: s.name,
        teamName: null,
        certificateType: certType,
        registrationType: 'solo',
      })
    })

    if (recipients.length === 0) {
      alert('No checked-in participants available for certificate generation.')
      return
    }

    // 2. Validate required templates exist
    const requiredTemplateKeys = Array.from(
      new Set(
        recipients
          .filter((r) => r.certificateType !== 'Not Eligible')
          .map((r) => `${r.registrationType}:${r.certificateType}`)
      )
    )

    const missingTemplates = requiredTemplateKeys.filter((key) => {
      const [regType, certType] = key.split(':')
      const tmpl = templates.find((t) => t.certificate_type === certType && t.template_type === regType)
      return !tmpl || !tmpl.previewUrl || !tmpl.layout_config
    })

    if (missingTemplates.length > 0) {
      setErrorNotice(
        `The following required templates are missing or not fully configured: ${missingTemplates
          .map((k) => k.replace(':', ' '))
          .join(', ')}. Please upload their image templates and configure layout in Step 1 first.`
      )
      return
    }

    // 3. Initialize progress
    setGenerating(true)
    const total = recipients.length
    let succeeded = 0
    let skipped = 0
    let failed = 0

    const zip = new JSZip()
    const usedFilenames = new Set<string>()

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Template cache to avoid repeated image fetching in browser
    const templateImageCache: Record<string, string> = {}

    for (let i = 0; i < total; i++) {
      const rec = recipients[i]

      // Progress update
      setProgress({
        total,
        processed: i + 1,
        succeeded,
        skipped,
        failed,
        statusText: `Rendering ${rec.name} (${rec.certificateType})...`,
      })

      // Skip Not Eligible
      if (rec.certificateType === 'Not Eligible') {
        skipped++
        continue
      }

      try {
        // Auto-select template based on registration type + certificate type
        const tmpl = templates.find(
          (t) => t.certificate_type === rec.certificateType && t.template_type === rec.registrationType
        )!

        // Cache image url
        const cacheKey = `${rec.registrationType}:${rec.certificateType}`
        let imgUrl = templateImageCache[cacheKey]
        if (!imgUrl && tmpl.previewUrl) {
          imgUrl = tmpl.previewUrl
          templateImageCache[cacheKey] = imgUrl
        }

        const asgn = assignments.find(
          (a) => a.registration_id === rec.registrationId && (rec.teamMemberId ? a.team_member_id === rec.teamMemberId : a.team_member_id === null)
        )
        const assignmentId = asgn?.id ?? (rec.teamMemberId ? `${rec.registrationId}-${rec.teamMemberId}` : rec.registrationId)

        const verificationUrl = `${baseUrl}/verify/${assignmentId}`

        if (!tmpl.layout_config) {
          failed++
          continue
        }

        // Render Canvas PNG Blob
        const blob = await generateCertificateBlob({
          templateImageUrl: imgUrl,
          layoutConfig: tmpl.layout_config,
          participantName: rec.name,
          teamName: rec.teamName,
          verificationUrl,
        })

        // Generate safe unique filename in ZIP
        let filename = makeSafeFilename(rec.name, rec.certificateType)
        let dupIdx = 1
        while (usedFilenames.has(filename)) {
          filename = makeSafeFilename(rec.name, rec.certificateType, dupIdx)
          dupIdx++
        }
        usedFilenames.add(filename)

        // Add blob to ZIP
        zip.file(filename, blob)
        succeeded++
      } catch (err: any) {
        console.error(`Failed to generate certificate for ${rec.name}:`, err)
        failed++
      }
    }

    // Finalize ZIP
    setProgress({
      total,
      processed: total,
      succeeded,
      skipped,
      failed,
      statusText: 'Compressing into ZIP file...',
    })

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const safeEventTitle = eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_')
      const zipFilename = `CINTEL_${safeEventTitle}_Certificates.zip`

      // Trigger browser download
      const downloadUrl = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = zipFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      setProgress({
        total,
        processed: total,
        succeeded,
        skipped,
        failed,
        statusText: `Complete! Generated ${succeeded} certificates into ZIP.`,
      })
    } catch (err: any) {
      alert(`ZIP creation failed: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 3: Post Certificates (Release to Participant Portal) */}
      <section className="border border-[#243B72] bg-[#0B1736] p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="rounded-none bg-[#F5E62D]/10 px-3 py-1 text-xs font-semibold text-[#F5E62D] uppercase tracking-wider">
              Step 3
            </span>
            <h2 className="mt-2 text-lg font-bold text-white">Post Certificates (Release to Participants)</h2>
            <p className="mt-1 text-xs text-slate-400">
              Publishing certificates makes them visible to participants in their dashboard and activates public QR code verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {releasedAt ? (
              <div className="inline-flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Certificates Posted ({new Date(releasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
              </div>
            ) : null}

            <button
              onClick={handlePostCertificates}
              disabled={posting}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 px-6 py-3 text-sm font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {posting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {posting ? 'Posting...' : releasedAt ? 'Re-Post Certificates' : 'Post Certificates'}
            </button>
          </div>
        </div>
      </section>

      {/* Step 4: Batch Certificate Export (ZIP) */}
      <section className="border border-[#243B72] bg-[#0B1736] p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="rounded-none bg-[#F5E62D]/10 px-3 py-1 text-xs font-semibold text-[#F5E62D] uppercase tracking-wider">
              Step 4
            </span>
            <h2 className="mt-2 text-lg font-bold text-white">Batch Certificate Export (ZIP)</h2>
            <p className="mt-1 text-xs text-slate-400">
              Renders full-resolution PNG certificates for all eligible checked-in attendees and packages them into a single ZIP file.
              Templates are automatically selected based on registration type (Solo/Team) and assigned certificate type.
            </p>
          </div>

          <button
            onClick={handleDownloadAllZip}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 bg-[#F5E62D] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0B1736] hover:bg-[#FFF27A] disabled:opacity-50"
          >
            {generating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {generating ? 'Generating ZIP...' : 'Download All Certificates (ZIP)'}
          </button>
        </div>

        {errorNotice && (
          <div className="flex items-start gap-2 border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
            <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
            <span>{errorNotice}</span>
          </div>
        )}

        {progress && (
          <div className="border border-[#243B72] bg-[#10224A] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white">{progress.statusText}</span>
              <span className="text-[#F5E62D]">
                {Math.round((progress.processed / (progress.total || 1)) * 100)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden bg-[#070E1E]">
              <div
                className="h-full bg-[#F5E62D] transition-all duration-200"
                style={{
                  width: `${(progress.processed / (progress.total || 1)) * 100}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300">
              <span>Total: {progress.total}</span>
              <span className="text-emerald-400">Succeeded: {progress.succeeded}</span>
              <span className="text-slate-500">Skipped (Not Eligible): {progress.skipped}</span>
              {progress.failed > 0 && <span className="text-red-400">Failed: {progress.failed}</span>}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}


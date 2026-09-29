// app/dashboard/events/[id]/certificates/page.tsx
//
// Image-based certificate workflow:
//   1. Upload PNG/JPG templates (solo + team, per certificate type) and
//      position Participant Name, Team Name and QR in the layout editor
//   2. Assign a certificate type per team / solo participant
//   3. Post certificates (release to participants + activate QR verification)
//   4. Canvas PNG rendering and batch ZIP export
//   Public QR verification lives at /verify/<assignment-id>.

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Award, Loader2, RefreshCw } from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import {
  TemplateConfig,
  TeamGroup,
  SoloParticipant,
  AssignmentRow,
} from '@/components/certificates/types'
import { CertificateTemplates } from '@/components/certificates/CertificateTemplates'
import { TemplateEditor } from '@/components/certificates/TemplateEditor'
import { CertificateAssignments } from '@/components/certificates/CertificateAssignments'
import { GenerateDownloadPanel } from '@/components/certificates/GenerateDownloadPanel'
import { PreviewModal } from '@/components/certificates/PreviewModal'

export default function CertificatesPage() {
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [eventTitle, setEventTitle] = useState('CINTEL Event')
  const [certificatesReleasedAt, setCertificatesReleasedAt] = useState<string | null>(null)

  const [templates, setTemplates] = useState<TemplateConfig[]>([])
  const [teams, setTeams] = useState<TeamGroup[]>([])
  const [solos, setSolos] = useState<SoloParticipant[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])

  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null)

  const [previewTarget, setPreviewTarget] = useState<{
    registrationId: string
    teamMemberId: string | null
    name: string
    teamName: string | null
    certType: string
    registrationType: 'solo' | 'team'
  } | null>(null)

  const loadAllData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [eventJson, checkedInJson, templatesJson, assignmentsJson] = await Promise.all([
        fetch(`/api/events/${id}`).then((r) => r.json()),
        fetch(`/api/certificates/checked-in?event_id=${id}`).then((r) => r.json()),
        fetch(`/api/certificates/templates?event_id=${id}`).then((r) => r.json()),
        fetch(`/api/certificates/assignments?event_id=${id}`).then((r) => r.json()),
      ])

      if (eventJson.data?.title) setEventTitle(eventJson.data.title)
      setCertificatesReleasedAt(eventJson.data?.certificates_released_at ?? null)

      if (checkedInJson.data) {
        setTeams(checkedInJson.data.teams ?? [])
        setSolos(checkedInJson.data.solos ?? [])
      }
      if (templatesJson.data) setTemplates(templatesJson.data)
      if (assignmentsJson.data) setAssignments(assignmentsJson.data)
    } catch (err) {
      console.error('[CertificatesPage] Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-foreground-soft">
        <Loader2 size={24} className="animate-spin text-warning" />
        <span className="text-sm font-bold">Loading certificates…</span>
      </div>
    )
  }

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        otherTemplates={templates}
        onSave={(updatedList) => {
          // PATCH responses carry no signed previewUrl and may have a NULL
          // template_type (legacy-constraint workaround) — keep ours.
          const byId = new Map(updatedList.map((u) => [u.id, u]))
          setTemplates((prev) =>
            prev.map((t) => {
              const u = byId.get(t.id)
              return u
                ? { ...t, ...u, template_type: t.template_type, previewUrl: t.previewUrl }
                : t
            })
          )
          setEditingTemplate(null)
        }}
        onClose={() => setEditingTemplate(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={Award}
        kicker="Certificates"
        title="Certificates"
        description="Upload image templates, place the name and QR code, assign certificate types, then post certificates and export them as a ZIP."
        actions={
          <button onClick={loadAllData} className="app-button-secondary text-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* Step 1: Templates & layout */}
      <section className="app-panel-muted p-6">
        <CertificateTemplates
          eventId={id}
          templates={templates}
          onTemplatesChange={setTemplates}
          onEditTemplate={(tmpl) => setEditingTemplate(tmpl)}
        />
      </section>

      {/* Step 2: Assignments */}
      <section className="app-panel-muted space-y-4 p-6">
        <div className="border-b-2 border-border pb-4">
          <span className="app-badge app-badge-warning">Step 2</span>
          <h2 className="mt-2 text-lg font-black uppercase tracking-tight text-foreground">
            Certificate Type Assignments
          </h2>
          <p className="mt-1 text-sm font-medium text-foreground-soft">
            Team registrations get one type for the whole team; solo registrations are assigned individually.
          </p>
        </div>

        <CertificateAssignments
          eventId={id}
          teams={teams}
          solos={solos}
          assignments={assignments}
          onAssignmentsSaved={setAssignments}
          onPreviewIndividual={(registrationId, teamMemberId, name, teamName, certType, registrationType) => {
            setPreviewTarget({ registrationId, teamMemberId, name, teamName, certType, registrationType })
          }}
        />
      </section>

      {/* Step 3 + 4: Post & ZIP export */}
      <section className="app-panel-muted p-6">
        <GenerateDownloadPanel
          eventId={id}
          eventTitle={eventTitle}
          teams={teams}
          solos={solos}
          assignments={assignments}
          templates={templates}
          certificatesReleasedAt={certificatesReleasedAt}
          onPostCertificatesSuccess={(releasedAt) => setCertificatesReleasedAt(releasedAt)}
        />
      </section>

      {previewTarget && (() => {
        const asgn = assignments.find(
          (a) =>
            a.registration_id === previewTarget.registrationId &&
            (previewTarget.teamMemberId
              ? a.team_member_id === previewTarget.teamMemberId
              : a.team_member_id === null)
        )
        return (
          <PreviewModal
            registrationId={previewTarget.registrationId}
            teamMemberId={previewTarget.teamMemberId}
            assignmentId={asgn?.id}
            name={previewTarget.name}
            teamName={previewTarget.teamName}
            certType={previewTarget.certType}
            registrationType={previewTarget.registrationType}
            templates={templates}
            onClose={() => setPreviewTarget(null)}
          />
        )
      })()}
    </div>
  )
}

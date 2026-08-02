// app/dashboard/events/[id]/certificates/page.tsx
//
// CINTEL EVENTS & REGISTRATION PORTAL — CERTIFICATE MANAGEMENT MODULE
//
// Complete image-based certificate workflow:
//   1. Upload PNG/JPG Templates & Configure Layout (Participant Name, Team Name, QR)
//   2. Team-wise & Solo Certificate Type Assignment (Persists individual assignment per person)
//   3. JS Canvas PNG rendering & Batch ZIP Export
//   4. Public QR Verification (/verify/<assignment-id>)

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Award, Loader2, RefreshCw } from 'lucide-react'
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

  // Data states
  const [templates, setTemplates] = useState<TemplateConfig[]>([])
  const [teams, setTeams] = useState<TeamGroup[]>([])
  const [solos, setSolos] = useState<SoloParticipant[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])

  // Editor modal state
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig | null>(null)

  // Preview modal state
  const [previewTarget, setPreviewTarget] = useState<{
    registrationId: string
    teamMemberId: string | null
    name: string
    teamName: string | null
    certType: string
    registrationType: 'solo' | 'team'
  } | null>(null)

  // Load all initial data for the event
  const loadAllData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      // 1. Fetch event info
      const eventRes = await fetch(`/api/events/${id}`)
      const eventJson = await eventRes.json()
      if (eventJson.data?.title) setEventTitle(eventJson.data.title)
      if (eventJson.data?.certificates_released_at) {
        setCertificatesReleasedAt(eventJson.data.certificates_released_at)
      }

      // 2. Fetch checked-in participants (team-grouped + solo)
      const checkedInRes = await fetch(`/api/certificates/checked-in?event_id=${id}`)
      const checkedInJson = await checkedInRes.json()
      if (checkedInJson.data) {
        setTeams(checkedInJson.data.teams ?? [])
        setSolos(checkedInJson.data.solos ?? [])
      }

      // 3. Fetch configured templates
      const templatesRes = await fetch(`/api/certificates/templates?event_id=${id}`)
      const templatesJson = await templatesRes.json()
      if (templatesJson.data) {
        setTemplates(templatesJson.data ?? [])
      }

      // 4. Fetch saved assignments
      const assignmentsRes = await fetch(`/api/certificates/assignments?event_id=${id}`)
      const assignmentsJson = await assignmentsRes.json()
      if (assignmentsJson.data) {
        setAssignments(assignmentsJson.data ?? [])
      }
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
      <div className="flex h-64 items-center justify-center space-x-2 text-slate-400">
        <Loader2 size={24} className="animate-spin text-[#F5E62D]" />
        <span className="text-sm font-semibold">Loading Certificate Management Module...</span>
      </div>
    )
  }

  // If in Template Layout Editor mode
  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={(updated) => {
          setTemplates((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          )
          setEditingTemplate(null)
        }}
        onClose={() => setEditingTemplate(null)}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="app-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 border border-[#F5E62D]/40 bg-[#0B1736] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
              <Award size={14} />
              Certificate System
            </span>

            <h1 className="mt-4 text-3xl font-bold text-white">
              Image Certificate Generator
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Manage image templates, assign certificate types team-wise or solo, render canvas PNGs, and export bulk ZIP archives with public QR verification.
            </p>
          </div>

          <button
            onClick={loadAllData}
            className="inline-flex items-center gap-2 border border-[#243B72] bg-[#10224A] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <RefreshCw size={14} />
            Refresh Data
          </button>
        </div>
      </section>

      {/* Step 1: Templates & Layout Editor */}
      <section className="app-panel p-6">
        <CertificateTemplates
          eventId={id}
          templates={templates}
          onTemplatesChange={setTemplates}
          onEditTemplate={(tmpl) => setEditingTemplate(tmpl)}
        />
      </section>

      {/* Step 2: Assignments (Team-Wise & Solo) */}
      <section className="app-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#243B72] pb-4">
          <div>
            <span className="rounded-none bg-[#F5E62D]/10 px-3 py-1 text-xs font-semibold text-[#F5E62D] uppercase tracking-wider">
              Step 2
            </span>
            <h2 className="mt-2 text-lg font-bold text-white">Certificate Type Assignments</h2>
            <p className="mt-1 text-xs text-slate-400">
              For team registrations, choose certificate type at the TEAM level (all members inherit the selection). For solo registrations, assign individually.
            </p>
          </div>
        </div>

        <CertificateAssignments
          eventId={id}
          teams={teams}
          solos={solos}
          assignments={assignments}
          onAssignmentsSaved={setAssignments}
          onPreviewIndividual={(registrationId, teamMemberId, name, teamName, certType, registrationType) => {
            setPreviewTarget({
              registrationId,
              teamMemberId,
              name,
              teamName,
              certType,
              registrationType,
            })
          }}
        />
      </section>

      {/* Step 3: Post & Batch Export ZIP */}
      <section className="app-panel p-6">
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

      {/* Single Preview Modal */}
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

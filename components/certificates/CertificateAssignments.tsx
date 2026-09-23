'use client'

import { useState, useMemo } from 'react'
import { Search, Save, CheckSquare, Square, Loader2, Users, User, ShieldAlert } from 'lucide-react'
import { TeamGroup, SoloParticipant, AssignmentRow, CERT_TYPES, CertType } from './types'

// Local Bauhaus-token mapping for certificate type accents (kept out of ./types.ts,
// which still exports the legacy hex CERT_TYPE_COLORS used elsewhere).
const CERT_TYPE_TEXT_CLASS: Record<string, string> = {
  Winner: 'text-warning',
  'Runner Up': 'text-accent',
  '2nd Runner Up': 'text-success',
  Participation: 'text-foreground-soft',
  'Not Eligible': 'text-foreground-soft',
}

interface Props {
  eventId: string
  teams: TeamGroup[]
  solos: SoloParticipant[]
  assignments: AssignmentRow[]
  onAssignmentsSaved: (assignments: AssignmentRow[]) => void
  onPreviewIndividual: (registrationId: string, teamMemberId: string | null, name: string, teamName: string | null, type: string, registrationType: 'solo' | 'team') => void
}

export function CertificateAssignments({
  eventId,
  teams,
  solos,
  assignments,
  onAssignmentsSaved,
  onPreviewIndividual,
}: Props) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Local state map for team & solo certificate type assignments:
  // Key for team: `team:<registrationId>` -> CertType
  // Key for solo: `solo:<registrationId>` -> CertType
  const [assignmentMap, setAssignmentMap] = useState<Record<string, CertType>>(() => {
    const map: Record<string, CertType> = {}

    // Initialize from existing assignment records from DB
    teams.forEach((t) => {
      // Find assignment for any member of this team registration
      const existing = assignments.find((a) => a.registration_id === t.registrationId)
      map[`team:${t.registrationId}`] = (existing?.certificate_type as CertType) || 'Participation'
    })

    solos.forEach((s) => {
      const existing = assignments.find((a) => a.registration_id === s.registrationId)
      map[`solo:${s.registrationId}`] = (existing?.certificate_type as CertType) || 'Participation'
    })

    return map
  })

  // Bulk selection state (selected team registration IDs)
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [bulkType, setBulkType] = useState<CertType>('Participation')

  // Search filter
  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams
    const q = search.toLowerCase()
    return teams.filter(
      (t) =>
        t.teamName.toLowerCase().includes(q) ||
        t.members.some(
          (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        )
    )
  }, [teams, search])

  const filteredSolos = useMemo(() => {
    if (!search.trim()) return solos
    const q = search.toLowerCase()
    return solos.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    )
  }, [solos, search])

  // Bulk selection toggles
  const toggleSelectAllTeams = () => {
    if (selectedTeams.size === filteredTeams.length) {
      setSelectedTeams(new Set())
    } else {
      setSelectedTeams(new Set(filteredTeams.map((t) => t.registrationId)))
    }
  }

  const toggleSelectTeam = (regId: string) => {
    const next = new Set(selectedTeams)
    if (next.has(regId)) next.delete(regId)
    else next.add(regId)
    setSelectedTeams(next)
  }

  const applyBulkType = () => {
    if (selectedTeams.size === 0) return
    setAssignmentMap((prev) => {
      const next = { ...prev }
      selectedTeams.forEach((id) => {
        next[`team:${id}`] = bulkType
      })
      return next
    })
  }

  // Save all assignments to database
  async function handleSaveAssignments() {
    setSaving(true)
    try {
      // Build individual assignment objects (1 per person!)
      const payload: {
        registration_id: string
        team_member_id: string | null
        certificate_type: string
      }[] = []

      // Teams: organizer chose ONE type per team, but every member gets an individual record
      teams.forEach((t) => {
        const certType = assignmentMap[`team:${t.registrationId}`] ?? 'Participation'
        t.members.forEach((m) => {
          payload.push({
            registration_id: t.registrationId,
            team_member_id: m.teamMemberId,
            certificate_type: certType,
          })
        })
      })

      // Solos: individual record
      solos.forEach((s) => {
        const certType = assignmentMap[`solo:${s.registrationId}`] ?? 'Participation'
        payload.push({
          registration_id: s.registrationId,
          team_member_id: null,
          certificate_type: certType,
        })
      })

      const res = await fetch('/api/certificates/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, assignments: payload }),
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save assignments')

      // Refresh assignments from GET endpoint
      const getRes = await fetch(`/api/certificates/assignments?event_id=${eventId}`)
      const getJson = await getRes.json()
      if (getJson.data) {
        onAssignmentsSaved(getJson.data)
      }

      alert(`Successfully persisted ${json.data.saved} individual certificate assignments!`)
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 border-b-2 border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams, participant names, or emails..."
            className="app-input pl-9 text-xs"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveAssignments}
          disabled={saving}
          className="app-button-primary text-xs disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Certificate Assignments
        </button>
      </div>

      {/* Bulk Action Bar (For Teams) */}
      {teams.length > 0 && (
        <div className="app-panel-muted flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAllTeams}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-soft transition hover:text-foreground"
            >
              {selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 ? (
                <CheckSquare size={16} className="text-warning" />
              ) : (
                <Square size={16} className="text-foreground-soft" />
              )}
              Select All Teams ({selectedTeams.size}/{filteredTeams.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Bulk Certificate Type:</span>
            <select
              value={bulkType}
              onChange={(e) => setBulkType(e.target.value as CertType)}
              className="app-select text-xs py-1 px-2 w-auto"
            >
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={applyBulkType}
              disabled={selectedTeams.size === 0}
              className="rounded-full border-2 border-border bg-panel px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground transition active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
            >
              Apply To Selected
            </button>
          </div>
        </div>
      )}

      {/* TEAM REGISTRATIONS SECTION */}
      {teams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-warning" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Team Registrations ({filteredTeams.length})
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {filteredTeams.map((team) => {
              const currentType = assignmentMap[`team:${team.registrationId}`] ?? 'Participation'
              const isSelected = selectedTeams.has(team.registrationId)

              return (
                <div
                  key={team.registrationId}
                  className={`flex flex-col justify-between rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-warning bg-panel-muted'
                      : 'border-border bg-panel hover:border-brand'
                  } p-4`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-border pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectTeam(team.registrationId)}
                        className="text-foreground-soft hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-warning" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <div>
                        <h4 className="text-base font-bold text-foreground">{team.teamName}</h4>
                        <span className="text-[11px] font-medium text-foreground-soft">
                          {team.members.length} Members
                        </span>
                      </div>
                    </div>

                    {/* TEAM-LEVEL CERTIFICATE TYPE SELECTOR */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Type:</span>
                      <select
                        value={currentType}
                        onChange={(e) =>
                          setAssignmentMap((prev) => ({
                            ...prev,
                            [`team:${team.registrationId}`]: e.target.value as CertType,
                          }))
                        }
                        className={`app-select text-xs py-1 px-2 font-bold ${CERT_TYPE_TEXT_CLASS[currentType] ?? 'text-foreground'}`}
                      >
                        {CERT_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-panel text-foreground">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="my-3 space-y-2">
                    {team.members.map((m) => (
                      <div
                        key={m.teamMemberId}
                        className="flex items-center justify-between rounded-lg bg-panel-muted px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{m.name}</span>
                          {m.isLeader && (
                            <span className="app-badge app-badge-warning py-0 text-[9px]">
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="max-w-[150px] truncate text-[11px] font-medium text-foreground-soft">
                            {m.email}
                          </span>
                          <button
                            onClick={() =>
                              onPreviewIndividual(
                                team.registrationId,
                                m.teamMemberId,
                                m.name,
                                team.teamName,
                                currentType,
                                'team'
                              )
                            }
                            className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] font-medium italic text-foreground-soft">
                    All {team.members.length} members will receive individual certificates with type: &quot;{currentType}&quot;
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SOLO REGISTRATIONS SECTION */}
      {solos.length > 0 && (
        <div className="space-y-4 border-t-2 border-border pt-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Solo Registrations ({filteredSolos.length})
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredSolos.map((solo) => {
              const currentType = assignmentMap[`solo:${solo.registrationId}`] ?? 'Participation'

              return (
                <div
                  key={solo.registrationId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-border bg-panel p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{solo.name}</h4>
                      <p className="max-w-[180px] truncate text-xs font-medium text-foreground-soft">{solo.email}</p>
                    </div>
                    <button
                      onClick={() =>
                        onPreviewIndividual(
                          solo.registrationId,
                          null,
                          solo.name,
                          null,
                          currentType,
                          'solo'
                        )
                      }
                      className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                    >
                      Preview
                    </button>
                  </div>

                  {/* Individual type selector */}
                  <div className="flex items-center justify-between border-t-2 border-border pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Type:</span>
                    <select
                      value={currentType}
                      onChange={(e) =>
                        setAssignmentMap((prev) => ({
                          ...prev,
                          [`solo:${solo.registrationId}`]: e.target.value as CertType,
                        }))
                      }
                      className={`app-select w-auto py-1 px-2 text-xs font-bold ${CERT_TYPE_TEXT_CLASS[currentType] ?? 'text-foreground'}`}
                    >
                      {CERT_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-panel text-foreground">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {teams.length === 0 && solos.length === 0 && (
        <div className="app-empty-state">
          <ShieldAlert size={24} className="mx-auto mb-2 text-foreground-soft" />
          No checked-in participants found for this event. Ensure attendance has been recorded first.
        </div>
      )}
    </div>
  )
}

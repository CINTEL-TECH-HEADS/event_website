'use client'

import { useState, useMemo } from 'react'
import { Search, Save, CheckSquare, Square, Loader2, Users, User, ShieldAlert } from 'lucide-react'
import { TeamGroup, SoloParticipant, AssignmentRow, CERT_TYPES, CertType, CERT_TYPE_COLORS } from './types'

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#243B72] pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
          className="inline-flex items-center gap-2 bg-[#F5E62D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0B1736] hover:bg-[#FFF27A] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Certificate Assignments
        </button>
      </div>

      {/* Bulk Action Bar (For Teams) */}
      {teams.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#243B72] bg-[#0B1736] p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAllTeams}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              {selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 ? (
                <CheckSquare size={16} className="text-[#F5E62D]" />
              ) : (
                <Square size={16} className="text-slate-500" />
              )}
              Select All Teams ({selectedTeams.size}/{filteredTeams.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Bulk Certificate Type:</span>
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
              className="border border-[#243B72] bg-[#10224A] px-3 py-1 text-xs font-semibold text-[#F5E62D] hover:bg-[#1E3A8A] disabled:opacity-50"
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
            <Users size={16} className="text-[#F5E62D]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
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
                  className={`flex flex-col justify-between border transition-all ${
                    isSelected
                      ? 'border-[#F5E62D] bg-[#0E1F4A]'
                      : 'border-[#243B72] bg-[#0B1736] hover:border-[#243B72]/80'
                  } p-4`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#243B72] pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectTeam(team.registrationId)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-[#F5E62D]" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <div>
                        <h4 className="text-base font-bold text-white">{team.teamName}</h4>
                        <span className="text-[11px] text-slate-400">
                          {team.members.length} Members
                        </span>
                      </div>
                    </div>

                    {/* TEAM-LEVEL CERTIFICATE TYPE SELECTOR */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Type:</span>
                      <select
                        value={currentType}
                        onChange={(e) =>
                          setAssignmentMap((prev) => ({
                            ...prev,
                            [`team:${team.registrationId}`]: e.target.value as CertType,
                          }))
                        }
                        className="app-select text-xs py-1 px-2 font-bold"
                        style={{
                          color: CERT_TYPE_COLORS[currentType] ?? '#fff',
                        }}
                      >
                        {CERT_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-[#0B1736] text-white">
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
                        className="flex items-center justify-between bg-[#10224A]/60 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{m.name}</span>
                          {m.isLeader && (
                            <span className="rounded-none bg-[#F5E62D]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F5E62D] uppercase">
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
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
                            className="text-[10px] text-[#93C5FD] hover:underline"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 italic">
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
        <div className="space-y-4 pt-4 border-t border-[#243B72]">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#93C5FD]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Solo Registrations ({filteredSolos.length})
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredSolos.map((solo) => {
              const currentType = assignmentMap[`solo:${solo.registrationId}`] ?? 'Participation'

              return (
                <div
                  key={solo.registrationId}
                  className="flex flex-col justify-between border border-[#243B72] bg-[#0B1736] p-4 gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{solo.name}</h4>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{solo.email}</p>
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
                      className="text-xs text-[#93C5FD] hover:underline"
                    >
                      Preview
                    </button>
                  </div>

                  {/* Individual type selector */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#243B72]/60">
                    <span className="text-xs text-slate-400">Type:</span>
                    <select
                      value={currentType}
                      onChange={(e) =>
                        setAssignmentMap((prev) => ({
                          ...prev,
                          [`solo:${solo.registrationId}`]: e.target.value as CertType,
                        }))
                      }
                      className="app-select text-xs py-1 px-2 font-bold w-auto"
                      style={{
                        color: CERT_TYPE_COLORS[currentType] ?? '#fff',
                      }}
                    >
                      {CERT_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#0B1736] text-white">
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
        <div className="border border-[#243B72] bg-[#0B1736] p-8 text-center text-slate-400">
          <ShieldAlert size={24} className="mx-auto mb-2 text-slate-500" />
          No checked-in participants found for this event. Ensure attendance has been recorded first.
        </div>
      )}
    </div>
  )
}

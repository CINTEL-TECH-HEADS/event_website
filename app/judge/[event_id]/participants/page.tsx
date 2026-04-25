// Owner: FE2 - Read-only participant view for judges
'use client'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Search, Shield } from 'lucide-react'
import { RegistrationWithDetails } from '@/types'

export default function JudgeParticipantsPage() {
  const { event_id } = useParams<{ event_id: string }>()
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      event_id,
      ...(searchQuery && { search: searchQuery }),
    })

    try {
      const res = await fetch(`/api/events/${event_id}/registrations?${params}`)
      const { data } = await res.json()
      setRegistrations(data ?? [])
    } catch (error) {
      console.error('Failed to load registrations:', error)
    } finally {
      setLoading(false)
    }
  }, [event_id, searchQuery])

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  if (loading) {
    return <div className="text-sm text-slate-400">Loading participants...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <Shield size={14} />
          Judge View
        </span>
        <h1 className="app-heading mt-4">Participant information in read-only mode.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Search participants and expand entries for team and answer details. No edits are
          available from this view.
        </p>
      </section>

      <section className="app-panel rounded-[1.75rem] p-4">
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="app-input pl-11"
          />
        </label>
      </section>

      <section className="app-table-wrap">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="app-empty-state m-3">No participants found.</div>
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <Fragment key={registration.id}>
                    <tr
                      className="app-table-row-interactive cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === registration.id ? null : registration.id)
                      }
                    >
                      <td className="font-semibold text-slate-900">{registration.leader_name}</td>
                      <td className="text-sm text-slate-500">{registration.leader_email}</td>
                      <td>
                        <span className="app-badge app-badge-neutral">
                          {registration.registration_type === 'solo' ? 'Solo' : 'Team'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`app-badge ${
                            registration.status === 'confirmed'
                              ? 'app-badge-success'
                              : registration.status === 'waitlisted'
                              ? 'app-badge-warning'
                              : 'app-badge-danger'
                          }`}
                        >
                          {registration.status}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">
                        {new Date(registration.registered_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>

                    {expandedId === registration.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={5}>
                          <div className="grid gap-4 rounded-[1.2rem] bg-white/90 p-4 lg:grid-cols-2">
                            <div>
                              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                                Team members
                              </h3>
                              {registration.registration_type === 'team' &&
                              registration.members.length > 0 ? (
                                <div className="space-y-2 text-sm text-slate-600">
                                  {registration.members.map((member) => (
                                    <div key={member.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                                      {member.full_name}
                                      {member.is_leader && (
                                        <span className="ml-2 text-xs font-semibold text-brand-600">
                                          Leader
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Solo participant.</p>
                              )}
                            </div>

                            <div>
                              <h3 className="mb-2 text-sm font-semibold text-slate-900">Answers</h3>
                              {registration.answers.length > 0 ? (
                                <div className="space-y-2 text-sm text-slate-600">
                                  {registration.answers.map((answer) => (
                                    <div key={answer.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                                      <span className="font-medium text-slate-800">
                                        {answer.field_id}
                                      </span>
                                      : {answer.answer}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No extra details available.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="app-alert-info">
        Judge access is intentionally read-only. No action buttons are available here.
      </div>
    </div>
  )
}

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
    return <div className="text-sm font-bold uppercase tracking-widest text-foreground-soft">Loading participants...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <Shield size={14} />
          Judge View
        </span>
        <h1 className="app-heading mt-4 uppercase tracking-tighter">Participant information in read-only mode.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Search participants and expand entries for team and answer details. No edits are
          available from this view.
        </p>
      </section>

      <section className="app-panel p-4">
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-soft" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="app-input pl-11"
          />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border-2 border-border bg-panel sm:border-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-panel-muted font-tech text-xs font-bold uppercase tracking-wider text-foreground">
              <tr>
                <th className="px-4 py-4 text-left">Name</th>
                <th className="px-4 py-4 text-left">Email</th>
                <th className="px-4 py-4 text-left">Type</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    <div className="app-empty-state">No participants found.</div>
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <Fragment key={registration.id}>
                    <tr
                      className="cursor-pointer border-b-2 border-border transition duration-200 ease-out hover:bg-panel-muted"
                      onClick={() =>
                        setExpandedId(expandedId === registration.id ? null : registration.id)
                      }
                    >
                      <td className="px-4 py-4 font-bold text-foreground">{registration.leader_name}</td>
                      <td className="px-4 py-4 text-sm text-foreground-soft">{registration.leader_email}</td>
                      <td className="px-4 py-4">
                        <span className="app-badge app-badge-neutral">
                          {registration.registration_type === 'solo' ? 'Solo' : 'Team'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4 text-sm text-foreground-soft">
                        {new Date(registration.registered_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>

                    {expandedId === registration.id && (
                      <tr className="bg-panel-muted">
                        <td colSpan={5} className="p-4">
                          <div className="grid gap-4 rounded-xl border-2 border-border bg-panel p-4 lg:grid-cols-2">
                            <div>
                              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground">
                                Team members
                              </h3>
                              {registration.registration_type === 'team' &&
                              registration.members.length > 0 ? (
                                <div className="space-y-2 text-sm text-foreground-soft">
                                  {registration.members.map((member) => (
                                    <div key={member.id} className="rounded-lg border-2 border-border bg-panel-muted px-3 py-2">
                                      {member.full_name}
                                      {member.is_leader && (
                                        <span className="ml-2 text-xs font-bold uppercase tracking-widest text-brand">
                                          Leader
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-foreground-soft">Solo participant.</p>
                              )}
                            </div>

                            <div>
                              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground">Answers</h3>
                              {(registration.answers?.length ?? 0) > 0 ? (
                                <div className="space-y-2 text-sm text-foreground-soft">
                                  {registration.answers?.map((answer) => (
                                    <div key={answer.id} className="rounded-lg border-2 border-border bg-panel-muted px-3 py-2">
                                      <span className="font-bold text-foreground">
                                        {answer.field_id}
                                      </span>
                                      : {answer.answer}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-foreground-soft">No extra details available.</p>
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

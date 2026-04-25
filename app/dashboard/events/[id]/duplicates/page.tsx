// Owner: FE2 - Duplicate Review page
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, Check, Trash2 } from 'lucide-react'
import { DuplicateFlag, RegistrationWithDetails } from '@/types'

interface DuplicateWithRegistration extends DuplicateFlag {
  registration?: RegistrationWithDetails
}

export default function DuplicateReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [duplicates, setDuplicates] = useState<DuplicateWithRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const loadDuplicates = async () => {
      try {
        const res = await fetch(`/api/duplicates?event_id=${id}`)
        const { data } = await res.json()
        setDuplicates((data || []).filter((item: DuplicateFlag) => !item.reviewed))
      } catch (error) {
        console.error('Failed to load duplicates:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDuplicates()
  }, [id])

  const handleDismiss = async (duplicateId: string) => {
    setProcessing(duplicateId)
    try {
      const res = await fetch(`/api/duplicates/${duplicateId}/dismiss`, { method: 'POST' })
      if (!res.ok) {
        throw new Error('Failed to dismiss')
      }
      setDuplicates(duplicates.filter((duplicate) => duplicate.id !== duplicateId))
    } catch (error) {
      console.error('Failed to dismiss:', error)
      alert('Failed to dismiss duplicate')
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (duplicateId: string, registrationId: string) => {
    if (!confirm('Delete this registration? This action cannot be undone.')) {
      return
    }

    setProcessing(duplicateId)
    try {
      const res = await fetch(`/api/duplicates/${duplicateId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId }),
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      setDuplicates(duplicates.filter((duplicate) => duplicate.id !== duplicateId))
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete registration')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading flagged duplicates...</div>
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <AlertCircle size={14} />
          Duplicate Review
        </span>
        <h1 className="app-heading mt-4">Review flagged registrations without losing context.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Dismiss false positives or remove suspected duplicates while keeping the event list clean.
        </p>
      </section>

      {duplicates.length === 0 ? (
        <div className="app-alert-success">
          No duplicate registrations are waiting for review.
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((duplicate) => (
            <section key={duplicate.id} className="app-panel rounded-[1.8rem] border-amber-200 bg-amber-50/70 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-amber-950">
                      {duplicate.registration?.leader_name || 'Unknown'}
                    </h2>
                    <p className="mt-1 text-sm text-amber-800">
                      {duplicate.registration?.leader_email}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`app-badge ${duplicate.reason === 'same_name_phone' ? 'app-badge-danger' : 'app-badge-warning'}`}>
                      {duplicate.reason === 'same_name_phone' ? 'Same Name & Phone' : 'Rapid Submission'}
                    </span>
                    <span className="app-badge app-badge-neutral">
                      Flagged {new Date(duplicate.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  {duplicate.registration && (
                    <div className="grid gap-3 rounded-[1.3rem] bg-white/85 p-4 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        Registration ID
                        <div className="font-semibold text-slate-900">{duplicate.registration.display_id}</div>
                      </div>
                      <div>
                        Type
                        <div className="font-semibold text-slate-900">
                          {duplicate.registration.registration_type === 'solo' ? 'Solo' : 'Team'}
                        </div>
                      </div>
                      <div>
                        Status
                        <div className="font-semibold text-slate-900">{duplicate.registration.status}</div>
                      </div>
                      <div>
                        Registered
                        <div className="font-semibold text-slate-900">
                          {new Date(duplicate.registration.registered_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDismiss(duplicate.id)}
                    disabled={processing === duplicate.id}
                    className="app-button-success"
                  >
                    <Check size={16} />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDelete(duplicate.id, duplicate.registration_id)}
                    disabled={processing === duplicate.id}
                    className="app-button-danger"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="app-alert-info">
        Dismiss marks a flag as reviewed. Delete removes the suspected duplicate registration.
      </div>
    </div>
  )
}

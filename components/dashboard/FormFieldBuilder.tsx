// Owner: FE2 - Form field builder with ordering controls
'use client'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, PlusCircle, Trash2 } from 'lucide-react'
import { FieldAppliesTo, FieldType, FormField } from '@/types'

interface Props {
  eventId: string
}

interface FieldEditing extends Omit<FormField, 'id'> {
  id?: string
}

const FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'select',
  'multi_select',
  'checkbox',
  'date',
]

export function FormFieldBuilder({ eventId }: Props) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editForm, setEditForm] = useState<FieldEditing>({
    label: '',
    field_type: 'text',
    options: null,
    is_required: false,
    applies_to: 'registration',
    sort_order: 0,
    event_id: eventId,
    validation: null,
  })

  useEffect(() => {
    const loadFields = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/form-fields`)
        const { data } = await res.json()
        setFields(data ?? [])
      } catch (error) {
        console.error('Failed to load form fields:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFields()
  }, [eventId])

  const startEditField = useCallback((field: FormField) => {
    setEditingId(field.id)
    setShowAddForm(false)
    setEditForm({ ...field, id: field.id })
  }, [])

  const startAddField = useCallback(() => {
    setEditingId(null)
    setShowAddForm(true)
    setEditForm({
      event_id: eventId,
      label: '',
      field_type: 'text',
      options: null,
      validation: null,
      is_required: false,
      applies_to: 'registration',
      sort_order: fields.length,
    })
  }, [eventId, fields.length])

  const saveFields = async (nextFields: FormField[]) => {
    const fieldsToSave = nextFields.map((field, index) => ({
      ...field,
      sort_order: index,
    }))

    const res = await fetch(`/api/events/${eventId}/form-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fieldsToSave }),
    })

    if (!res.ok) {
      throw new Error('Failed to save fields')
    }

    const { data } = await res.json()
    setFields(data ?? [])
  }

  const handleSaveField = async () => {
    if (!editForm.label.trim()) {
      alert('Label is required')
      return
    }

    setSaving(true)
    try {
      const nextFields = editingId
        ? fields.map((field) => (field.id === editingId ? { ...field, ...editForm } : field))
        : [
            ...fields,
            {
              id: `temp-${Date.now()}`,
              event_id: eventId,
              label: editForm.label,
              field_type: editForm.field_type,
              options: editForm.options,
              validation: null,
              is_required: editForm.is_required,
              applies_to: editForm.applies_to,
              sort_order: fields.length,
            },
          ]

      await saveFields(nextFields)
      setEditingId(null)
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to save field:', error)
      alert('Failed to save field')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Delete this field?')) {
      return
    }

    setSaving(true)
    try {
      await saveFields(fields.filter((field) => field.id !== fieldId))
    } catch (error) {
      console.error('Failed to delete field:', error)
      alert('Failed to delete field')
    } finally {
      setSaving(false)
    }
  }

  const moveField = async (index: number, direction: 'up' | 'down') => {
    const nextFields = [...fields]
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= nextFields.length) {
      return
    }

    ;[nextFields[index], nextFields[nextIndex]] = [nextFields[nextIndex], nextFields[index]]
    setFields(nextFields)

    try {
      await saveFields(nextFields)
    } catch (error) {
      console.error('Failed to reorder field:', error)
      alert('Failed to reorder field')
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading form fields...</div>
  }

  return (
    <div className="space-y-4">
      <section className="app-panel rounded-[1.8rem] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Custom form fields</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add extra questions for registrations and team members.
            </p>
          </div>
          {!editingId && !showAddForm && (
            <button onClick={startAddField} className="app-button-primary">
              <PlusCircle size={16} />
              Add Field
            </button>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="app-empty-state">No custom fields yet. Start by adding your first field.</div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="app-panel-muted flex flex-col gap-4 rounded-[1.35rem] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{field.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="app-badge app-badge-neutral">{field.field_type}</span>
                    <span className="app-badge app-badge-brand">{field.applies_to}</span>
                    {field.is_required && <span className="app-badge app-badge-danger">Required</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="app-button-secondary px-3 py-3"
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="app-button-secondary px-3 py-3"
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => startEditField(field)}
                    className="app-button-secondary px-3 py-3 text-brand-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="app-button-secondary px-3 py-3 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {(editingId || showAddForm) && (
        <section className="app-panel rounded-[1.8rem] p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-950">
            {editingId ? 'Edit field' : 'Add new field'}
          </h3>

          <div className="mt-5 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Label</label>
              <input
                type="text"
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder="Experience Level"
                className="app-input"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Field Type</label>
                <select
                  value={editForm.field_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, field_type: e.target.value as FieldType })
                  }
                  className="app-select"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Applies To</label>
                <select
                  value={editForm.applies_to}
                  onChange={(e) =>
                    setEditForm({ ...editForm, applies_to: e.target.value as FieldAppliesTo })
                  }
                  className="app-select"
                >
                  <option value="registration">Registration</option>
                  <option value="member">Team Member</option>
                </select>
              </div>
            </div>

            {(editForm.field_type === 'select' || editForm.field_type === 'multi_select') && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.options?.join(', ') || ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      options: e.target.value
                        .split(',')
                        .map((option) => option.trim())
                        .filter(Boolean),
                    })
                  }
                  className="app-input"
                />
              </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editForm.is_required}
                onChange={(e) => setEditForm({ ...editForm, is_required: e.target.checked })}
              />
              Required field
            </label>

            <div className="flex flex-wrap gap-3 border-t border-slate-200/70 pt-5">
              <button onClick={handleSaveField} disabled={saving} className="app-button-primary">
                {saving ? 'Saving...' : 'Save Field'}
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setShowAddForm(false)
                }}
                className="app-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

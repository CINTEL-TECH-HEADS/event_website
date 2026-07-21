// Owner: FE2 - Form field builder with ordering controls
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  PlusCircle,
  Trash2,
} from 'lucide-react'

import {
  FieldAppliesTo,
  FieldType,
  FormField,
  ProfileFieldKey,
} from '@/types'

// Profile-backed "standard" fields an organiser can add in one click.
// When a logged-in participant registers, these pre-fill from their profile.
const STANDARD_FIELDS: {
  key: ProfileFieldKey
  label: string
  field_type: FieldType
  options: string[] | null
}[] = [
  { key: 'full_name', label: 'Full Name', field_type: 'text', options: null },
  { key: 'register_number', label: 'Register Number', field_type: 'text', options: null },
  { key: 'phone', label: 'Phone', field_type: 'phone', options: null },
  { key: 'college_email', label: 'College Email', field_type: 'email', options: null },
  { key: 'personal_email', label: 'Personal Email', field_type: 'email', options: null },
  { key: 'year_of_study', label: 'Year of Study', field_type: 'select', options: ['1st', '2nd', '3rd', '4th', 'Alumni'] },
  { key: 'batch', label: 'Batch', field_type: 'text', options: null },
  { key: 'section', label: 'Section', field_type: 'text', options: null },
  { key: 'fa_name', label: 'Faculty Advisor', field_type: 'text', options: null },
]

interface Props {
  eventId: string
}

interface FieldEditing
  extends Omit<FormField, 'id'> {
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

export function FormFieldBuilder({
  eventId,
}: Props) {
  const [fields, setFields] =
    useState<FormField[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [showAddForm, setShowAddForm] =
    useState(false)

  const [editForm, setEditForm] =
    useState<FieldEditing>({
      label: '',
      field_type: 'text',
      options: null,
      is_required: false,
      applies_to: 'registration',
      sort_order: 0,
      event_id: eventId,
      validation: null,
      field_key: null,
    })

  useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch(
          `/api/events/${eventId}/form-fields`
        )

        const { data } =
          await res.json()

        setFields(data ?? [])
      } catch {
        console.error(
          'Failed to load fields'
        )
      } finally {
        setLoading(false)
      }
    }

    loadFields()
  }, [eventId])

  const startEditField =
    useCallback(
      (field: FormField) => {
        setEditingId(field.id)
        setShowAddForm(false)

        setEditForm({
          ...field,
          id: field.id,
        })
      },
      []
    )

  const startAddField =
    useCallback(() => {
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
        field_key: null,
      })
    }, [eventId, fields.length])

  async function saveFields(
    nextFields: FormField[]
  ) {
    const payload =
      nextFields.map(
        (
          field,
          index
        ) => ({
          ...field,
          sort_order: index,
        })
      )

    const res = await fetch(
      `/api/events/${eventId}/form-fields`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          fields: payload,
        }),
      }
    )

    const { data } =
      await res.json()

    setFields(data ?? [])
  }

  async function handleSaveField() {
    if (
      !editForm.label.trim()
    ) {
      alert(
        'Label required'
      )
      return
    }

    setSaving(true)

    try {
      const nextFields =
        editingId
          ? fields.map(
              (
                field
              ) =>
                field.id ===
                editingId
                  ? {
                      ...field,
                      ...editForm,
                    }
                  : field
            )
          : [
              ...fields,
              {
                id: `temp-${Date.now()}`,
                event_id:
                  eventId,
                label:
                  editForm.label,
                field_type:
                  editForm.field_type,
                options:
                  editForm.options,
                validation:
                  null,
                is_required:
                  editForm.is_required,
                applies_to:
                  editForm.applies_to,
                sort_order:
                  fields.length,
                field_key:
                  editForm.field_key ?? null,
              },
            ]

      await saveFields(
        nextFields
      )

      setEditingId(null)
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteField(
    fieldId: string
  ) {
    if (
      !confirm(
        'Delete this field?'
      )
    )
      return

    setSaving(true)

    try {
      await saveFields(
        fields.filter(
          (
            field
          ) =>
            field.id !==
            fieldId
        )
      )
    } finally {
      setSaving(false)
    }
  }

  async function moveField(
    index: number,
    direction:
      | 'up'
      | 'down'
  ) {
    const nextFields = [
      ...fields,
    ]

    const nextIndex =
      direction === 'up'
        ? index - 1
        : index + 1

    if (
      nextIndex < 0 ||
      nextIndex >=
        nextFields.length
    )
      return

    ;[
      nextFields[index],
      nextFields[nextIndex],
    ] = [
      nextFields[nextIndex],
      nextFields[index],
    ]

    setFields(nextFields)

    await saveFields(
      nextFields
    )
  }

  async function addStandardField(
    sf: (typeof STANDARD_FIELDS)[number]
  ) {
    setSaving(true)
    try {
      await saveFields([
        ...fields,
        {
          id: `temp-${Date.now()}`,
          event_id: eventId,
          label: sf.label,
          field_type: sf.field_type,
          options: sf.options,
          validation: null,
          is_required: false,
          applies_to: 'registration',
          sort_order: fields.length,
          field_key: sf.key,
        },
      ])
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading custom fields...
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* List */}
      <section className="app-panel  p-5 sm:p-6">

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-xl font-semibold text-white">
              Custom Fields
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Add extra questions
              for registrations
              and members.
            </p>

          </div>

          {!editingId &&
            !showAddForm && (
              <button
                onClick={
                  startAddField
                }
                className="app-button-primary"
              >
                <PlusCircle
                  size={16}
                />
                Add Field
              </button>
            )}

        </div>

        {(() => {
          const usedKeys = new Set(
            fields.map((f) => f.field_key).filter(Boolean)
          )
          const available = STANDARD_FIELDS.filter(
            (sf) => !usedKeys.has(sf.key)
          )
          if (available.length === 0) return null
          return (
            <div className="mb-5 border border-[#243B72] bg-[#0B1736] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Standard fields — pre-fill from the participant&apos;s profile
              </p>
              <div className="flex flex-wrap gap-2">
                {available.map((sf) => (
                  <button
                    key={sf.key}
                    type="button"
                    disabled={saving}
                    onClick={() => addStandardField(sf)}
                    className="inline-flex items-center gap-1.5 border border-amber-300/25 bg-amber-300/5 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/10 disabled:opacity-50"
                  >
                    <PlusCircle size={13} /> {sf.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {fields.length ===
        0 ? (
          <div className=" border border-dashed border-[#243B72] bg-[#0B1736] p-6 text-sm text-slate-400">
            No custom fields
            yet.
          </div>
        ) : (
          <div className="space-y-3">

            {fields.map(
              (
                field,
                index
              ) => (
                <div
                  key={
                    field.id
                  }
                  className="flex flex-col gap-4  border border-[#243B72] bg-[#10224A] p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="font-semibold text-white">
                      {
                        field.label
                      }
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      <span className="app-badge app-badge-neutral">
                        {
                          field.field_type
                        }
                      </span>

                      <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-[#93C5FD]">
                        {
                          field.applies_to
                        }
                      </span>

                      {field.is_required && (
                        <span className="app-badge app-badge-danger">
                          Required
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      onClick={() =>
                        moveField(
                          index,
                          'up'
                        )
                      }
                      disabled={
                        index ===
                        0
                      }
                      className="app-button-secondary px-3 py-3"
                    >
                      <ChevronUp size={16} />
                    </button>

                    <button
                      onClick={() =>
                        moveField(
                          index,
                          'down'
                        )
                      }
                      disabled={
                        index ===
                        fields.length -
                          1
                      }
                      className="app-button-secondary px-3 py-3"
                    >
                      <ChevronDown size={16} />
                    </button>

                    <button
                      onClick={() =>
                        startEditField(
                          field
                        )
                      }
                      className="app-button-secondary px-3 py-3 text-[#F5E62D]"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteField(
                          field.id
                        )
                      }
                      className="app-button-secondary px-3 py-3 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* Form */}
      {(editingId ||
        showAddForm) && (
        <section className="app-panel  p-5 sm:p-6">

          <h3 className="text-lg font-semibold text-white">
            {editingId
              ? 'Edit Field'
              : 'Add New Field'}
          </h3>

          <div className="mt-5 grid gap-5">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Label
              </label>

              <input
                type="text"
                value={
                  editForm.label
                }
                onChange={(
                  e
                ) =>
                  setEditForm({
                    ...editForm,
                    label:
                      e.target
                        .value,
                  })
                }
                className="app-input"
              />

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Field Type
                </label>

                <select
                  value={
                    editForm.field_type
                  }
                  onChange={(
                    e
                  ) =>
                    setEditForm({
                      ...editForm,
                      field_type:
                        e.target
                          .value as FieldType,
                    })
                  }
                  className="app-select"
                >
                  {FIELD_TYPES.map(
                    (
                      type
                    ) => (
                      <option
                        key={
                          type
                        }
                        value={
                          type
                        }
                      >
                        {
                          type
                        }
                      </option>
                    )
                  )}
                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Applies To
                </label>

                <select
                  value={
                    editForm.applies_to
                  }
                  onChange={(
                    e
                  ) =>
                    setEditForm({
                      ...editForm,
                      applies_to:
                        e.target
                          .value as FieldAppliesTo,
                    })
                  }
                  className="app-select"
                >
                  <option value="registration">
                    Registration
                  </option>

                  <option value="member">
                    Team Member
                  </option>

                </select>

              </div>

            </div>

            {/* Accepted file types — only for file/upload fields */}
            {editForm.field_type === 'file' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Accepted files
                </label>
                <select
                  className="app-select"
                  value={(() => {
                    const a = editForm.validation?.allowed_types ?? []
                    const hasImg = a.some((t) => /png|jpg|jpeg|webp/.test(t))
                    const hasDoc = a.some((t) => /pdf|ppt/.test(t))
                    if (hasImg && !hasDoc) return 'images'
                    if (hasDoc && !hasImg) return 'documents'
                    return 'any'
                  })()}
                  onChange={(e) => {
                    const map: Record<string, string[]> = {
                      images: ['.png', '.jpg', '.jpeg', '.webp'],
                      documents: ['.pdf', '.ppt', '.pptx'],
                      any: ['.pdf', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp'],
                    }
                    setEditForm({
                      ...editForm,
                      validation: { ...(editForm.validation ?? {}), allowed_types: map[e.target.value] },
                    })
                  }}
                >
                  <option value="images">Images (photo, payment proof)</option>
                  <option value="documents">Documents (PDF, PPT/PPTX)</option>
                  <option value="any">Any (images + documents)</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-3  border border-[#243B72] bg-[#0B1736] px-4 py-3 text-sm font-medium text-slate-300">

              <input
                type="checkbox"
                checked={
                  editForm.is_required
                }
                onChange={(
                  e
                ) =>
                  setEditForm({
                    ...editForm,
                    is_required:
                      e.target
                        .checked,
                  })
                }
              />

              Required field

            </label>

            <div className="flex flex-wrap gap-3 border-t border-[#243B72] pt-5">

              <button
                onClick={
                  handleSaveField
                }
                disabled={
                  saving
                }
                className="app-button-primary"
              >
                {saving
                  ? 'Saving...'
                  : 'Save Field'}
              </button>

              <button
                onClick={() => {
                  setEditingId(
                    null
                  )
                  setShowAddForm(
                    false
                  )
                }}
                className=" border border-[#243B72] px-4 py-2 text-slate-300 hover:bg-[#0B1736]"
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
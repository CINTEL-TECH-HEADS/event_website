// Owner: FE2 - Form field builder with ordering controls
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Lock,
  PlusCircle,
  Trash2,
} from 'lucide-react'

import {
  FieldAppliesTo,
  FieldType,
  FormAudience,
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

// Standard fields that make sense for students from other colleges (no SRM
// registration number, SRM email, batch, section or faculty advisor).
const EXTERNAL_KEYS = new Set<ProfileFieldKey>(['full_name', 'phone', 'personal_email', 'year_of_study'])

const audienceOf = (f: { audience?: FormAudience }): FormAudience => f.audience ?? 'srm'

interface Props {
  eventId: string
  // When the event is open to other colleges, it has two forms.
  openToExternal?: boolean
  // Set once the event is published or has registrations: the form is read-only.
  lock?: 'published' | 'registrations' | null
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
  openToExternal = false,
  lock = null,
}: Props) {
  const locked = lock !== null
  // All fields of both forms; saving always sends the full list.
  const [fields, setFields] =
    useState<FormField[]>([])

  const [form, setForm] = useState<FormAudience>('srm')
  const active: FormAudience = openToExternal ? form : 'srm'
  const visible = fields.filter((f) => audienceOf(f) === active)
  const srmCount = fields.filter((f) => audienceOf(f) === 'srm').length
  const externalCount = fields.length - srmCount

  // Rebuild the full list after changing the active form: SRM fields first.
  const withActive = (nextVisible: FormField[]) => {
    const others = fields.filter((f) => audienceOf(f) !== active)
    return active === 'srm' ? [...nextVisible, ...others] : [...others, ...nextVisible]
  }

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

    const { data, error } =
      await res.json().catch(() => ({ data: null, error: null }))

    // Keep what's on screen if the save was refused (e.g. the form is locked).
    if (!res.ok) {
      alert(error ?? 'Could not save the form. Try again.')
      return
    }

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
          : withActive([
              ...visible,
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
                audience: active,
              },
            ])

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
      ...visible,
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

    setFields(withActive(nextFields))

    await saveFields(
      withActive(nextFields)
    )
  }

  async function addStandardField(
    sf: (typeof STANDARD_FIELDS)[number]
  ) {
    setSaving(true)
    try {
      await saveFields(withActive([
        ...visible,
        {
          id: `temp-${Date.now()}`,
          event_id: eventId,
          label: sf.label,
          field_type: sf.field_type,
          options: sf.options,
          validation: null,
          is_required: false,
          applies_to: 'registration',
          sort_order: visible.length,
          field_key: sf.key,
          audience: active,
        },
      ]))
    } finally {
      setSaving(false)
    }
  }

  async function copyFromSrmForm() {
    const copies = fields
      .filter((f) => audienceOf(f) === 'srm')
      .filter((f) => !f.field_key || EXTERNAL_KEYS.has(f.field_key))
      .filter((f) => !f.field_key || !visible.some((v) => v.field_key === f.field_key))
      .map((f, i) => ({ ...f, id: `temp-${Date.now()}-${i}`, audience: 'external' as const }))
    if (copies.length === 0) return
    setSaving(true)
    try {
      await saveFields(withActive([...visible, ...copies]))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-sm font-bold uppercase tracking-wide text-foreground-soft">
        Loading custom fields...
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* List */}
      <section className="app-panel p-5 sm:p-6">

        <div className="mb-5 flex items-center justify-between gap-4">

          <div>

            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Custom Fields
            </h2>

            <p className="mt-1 text-sm font-medium text-foreground-soft">
              {openToExternal
                ? 'This event is open to other colleges, so it has two forms: one for SRM KTR students and one for students from other colleges.'
                : 'Add extra questions for registrations and members.'}
            </p>

          </div>

          {!locked &&
            !editingId &&
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

        {locked ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border-2 border-border bg-warning-soft p-4">
            <Lock size={16} className="mt-0.5 shrink-0 text-foreground" />
            <p className="text-sm font-bold text-foreground">
              {lock === 'published'
                ? 'This form is locked because the event is published. Unpublish it to make changes, as long as nobody has registered yet.'
                : 'This form is locked because people have already registered. Their answers depend on these fields.'}
            </p>
          </div>
        ) : (
          <p className="mb-5 text-xs font-bold uppercase tracking-wide text-foreground-soft">
            Finish the form before publishing. It can&apos;t be changed after that.
          </p>
        )}

        {openToExternal && (
          <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Registration forms">
            {([
              ['srm', 'SRM KTR students', srmCount],
              ['external', 'Other-college students', externalCount],
            ] as const).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active === value}
                onClick={() => { setForm(value); setEditingId(null); setShowAddForm(false) }}
                className={`rounded-full border-2 border-border px-4 py-2 font-tech text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
                  active === value ? 'bg-accent text-white shadow-sm' : 'bg-panel-muted text-foreground-soft hover:text-foreground'
                }`}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
            {!locked && active === 'external' && srmCount > 0 && (
              <button
                type="button"
                disabled={saving}
                onClick={copyFromSrmForm}
                className="ml-auto inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-widest text-brand hover:underline disabled:opacity-50"
              >
                <PlusCircle size={13} /> Copy from SRM form
              </button>
            )}
          </div>
        )}

        {(() => {
          const usedKeys = new Set(
            visible.map((f) => f.field_key).filter(Boolean)
          )
          const available = STANDARD_FIELDS.filter(
            (sf) => !usedKeys.has(sf.key) && (active === 'srm' || EXTERNAL_KEYS.has(sf.key))
          )
          if (locked || available.length === 0) return null
          return (
            <div className="mb-5 rounded-xl border-2 border-border bg-warning-soft p-4">
              <p className="mb-3 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
                Standard fields — pre-fill from the participant&apos;s profile
              </p>
              <div className="flex flex-wrap gap-2">
                {available.map((sf) => (
                  <button
                    key={sf.key}
                    type="button"
                    disabled={saving}
                    onClick={() => addStandardField(sf)}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground shadow-sm transition-all duration-200 ease-out hover:bg-warning disabled:opacity-50"
                  >
                    <PlusCircle size={13} /> {sf.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {visible.length ===
        0 ? (
          <div className="app-empty-state">
            {active === 'external'
              ? 'No fields in the other-college form yet.'
              : 'No custom fields yet.'}
          </div>
        ) : (
          <div className="space-y-3">

            {visible.map(
              (
                field,
                index
              ) => (
                <div
                  key={
                    field.id
                  }
                  className="flex flex-col gap-4 rounded-xl border-2 border-border bg-panel-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="font-bold text-foreground">
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

                      <span className="app-badge bg-accent text-white">
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

                  {!locked && (
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
                      aria-label="Move up"
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
                        visible.length -
                          1
                      }
                      aria-label="Move down"
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
                      aria-label="Edit field"
                      className="app-button-secondary px-3 py-3"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteField(
                          field.id
                        )
                      }
                      aria-label="Delete field"
                      className="app-button-danger px-3 py-3"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* Form */}
      {!locked &&
        (editingId ||
        showAddForm) && (
        <section className="app-panel p-5 sm:p-6">

          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
            {editingId
              ? 'Edit Field'
              : 'Add New Field'}
          </h3>

          <div className="mt-5 grid gap-5">

            <div>

              <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
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

                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
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

                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
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
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
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

            <label className="flex items-center gap-3 rounded-xl border-2 border-border bg-panel-muted px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground">

              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
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

            <div className="flex flex-wrap gap-3 border-t-2 border-border pt-5">

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
                className="rounded-full border-2 border-border px-4 py-2 text-sm font-bold uppercase tracking-wide text-foreground-soft transition-all duration-200 ease-out hover:bg-panel-muted hover:text-foreground"
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
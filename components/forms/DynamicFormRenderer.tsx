// Owner: SHARED — coordinate FE1 + FE2 before modifying
// Renders a list of FormField objects as actual form inputs.
// Used in RegistrationForm (FE1) and FormFieldBuilder preview (FE2).
// Styled for the dark registration panel (amber/navy) so fields are visible.
'use client'

import { useState } from 'react'
import type { FormField } from '@/types'

interface Props {
  fields: FormField[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any    // react-hook-form register function
  errors: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue?: any   // react-hook-form setValue — required for file/image uploads
  memberIndex?: number // provided when rendering applies_to='member' fields for a specific member
}

const inputClass =
  'w-full rounded-2xl border border-[#243B72] bg-[#07101f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F5E62D] focus:ring-4 focus:ring-[#F5E62D]/10'

// Uploads a file/image and stores the returned storage path as the field answer.
function FileField({
  name,
  accept,
  required,
  register,
  setValue,
}: {
  name: string
  accept?: string
  required?: boolean
  register: any
  setValue?: any
}) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading'); setErr(null); setPreview(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data, error } = await fetch('/api/uploads/file', { method: 'POST', body: fd }).then(r => r.json())
      if (error) { setErr(error); setStatus('error'); return }
      setValue?.(name, data.path, { shouldValidate: true })
      if (data.kind === 'image' && data.url) setPreview(data.url)
      setStatus('done')
    } catch {
      setErr('Upload failed'); setStatus('error')
    }
  }

  return (
    <div>
      {/* Registered hidden input holds the stored path (the answer). */}
      <input type="hidden" {...register(name, { required })} />
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#243B72] file:px-3 file:py-2 file:text-sm file:text-white"
      />
      {status === 'uploading' && <p className="mt-1 text-xs text-slate-400">Uploading…</p>}
      {status === 'done' && !preview && <p className="mt-1 text-xs text-emerald-400">Uploaded ✓</p>}
      {preview && (
        <img src={preview} alt="preview" className="mt-2 max-h-40 rounded-lg border border-white/10" />
      )}
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  )
}

export function DynamicFormRenderer({ fields, register, errors, setValue, memberIndex }: Props) {
  return (
    <div className="space-y-4">
      {fields.map(field => {
        const name = memberIndex !== undefined
          ? `members.${memberIndex}.answers.${field.id}`
          : `answers.${field.id}`

        const isCheckbox = field.field_type === 'checkbox'

        return (
          <div key={field.id}>
            {!isCheckbox && (
              <label className="mb-2 block text-sm text-slate-300">
                {field.label}
                {field.is_required && <span className="ml-1 text-red-400">*</span>}
              </label>
            )}

            {/* Text / email / phone / number / date */}
            {['text', 'email', 'phone', 'number', 'date'].includes(field.field_type) && (
              <input
                type={field.field_type === 'phone' ? 'tel' : field.field_type}
                {...register(name, { required: field.is_required })}
                className={inputClass}
              />
            )}

            {/* Textarea */}
            {field.field_type === 'textarea' && (
              <textarea
                {...register(name, { required: field.is_required })}
                rows={3}
                className={inputClass}
              />
            )}

            {/* Select dropdown */}
            {field.field_type === 'select' && (
              <select {...register(name, { required: field.is_required })} className={inputClass}>
                <option value="">Select...</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {/* Multi-select */}
            {field.field_type === 'multi_select' && (
              <select multiple {...register(name, { required: field.is_required })} className={inputClass}>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {/* Checkbox */}
            {isCheckbox && (
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  {...register(name, { required: field.is_required })}
                  className="h-4 w-4 rounded border-[#243B72] bg-[#07101f] accent-[#F5E62D]"
                />
                {field.label}
                {field.is_required && <span className="ml-1 text-red-400">*</span>}
              </label>
            )}

            {/* File / image upload */}
            {field.field_type === 'file' && (
              <FileField
                name={name}
                accept={field.validation?.allowed_types?.join(',') ?? '.pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp'}
                required={field.is_required}
                register={register}
                setValue={setValue}
              />
            )}

            {errors?.[name] && (
              <p className="mt-1 text-xs text-red-400">{errors[name]?.message ?? 'This field is required'}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

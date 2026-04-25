// Owner: SHARED — coordinate FE1 + FE2 before modifying
// Renders a list of FormField objects as actual form inputs
// Used in RegistrationForm (FE1) and FormFieldBuilder preview (FE2)
import type { FormField } from '@/types'

interface Props {
  fields: FormField[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any    // react-hook-form register function
  errors: any
  memberIndex?: number // provided when rendering applies_to='member' fields for a specific member
}

export function DynamicFormRenderer({ fields, register, errors, memberIndex }: Props) {
  return (
    <div className="space-y-4">
      {fields.map(field => {
        const name = memberIndex !== undefined
          ? `members.${memberIndex}.answers.${field.id}`
          : `answers.${field.id}`

        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Text / email / phone / number / textarea */}
            {['text', 'email', 'phone', 'number', 'textarea'].includes(field.field_type) && (
              field.field_type === 'textarea'
                ? <textarea {...register(name, { required: field.is_required })} rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                : <input type={field.field_type === 'phone' ? 'tel' : field.field_type}
                    {...register(name, { required: field.is_required })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
            )}

            {/* Select dropdown */}
            {field.field_type === 'select' && (
              <select {...register(name, { required: field.is_required })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {/* Checkbox */}
            {field.field_type === 'checkbox' && (
              <input type="checkbox" {...register(name, { required: field.is_required })}
                className="rounded border-gray-300" />
            )}

            {/* File upload — TODO FE1: wire up to Supabase Storage upload */}
            {field.field_type === 'file' && (
              <input type="file" {...register(name)}
                accept={field.validation?.allowed_types?.join(',') ?? '*'}
                className="text-sm" />
            )}

            {errors?.[name] && (
              <p className="text-red-500 text-xs mt-1">{errors[name]?.message ?? 'This field is required'}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

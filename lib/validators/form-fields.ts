// Owner: BE2
import { z } from 'zod'

export const formFieldSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  field_type: z.enum(['text', 'textarea', 'number', 'email', 'phone', 'select', 'multi_select', 'checkbox', 'file', 'date']),
  options: z.array(z.string()).nullable().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    allowed_types: z.array(z.string()).optional(),
    max_size_mb: z.number().optional(),
  }).nullable().optional(),
  is_required: z.boolean().default(false),
  applies_to: z.enum(['registration', 'member']),
  sort_order: z.number().int(),
})

export const formFieldsPayloadSchema = z.object({
  event_id: z.string().uuid(),
  fields: z.array(formFieldSchema),
})

export type FormFieldPayload = z.infer<typeof formFieldSchema>

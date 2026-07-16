// Owner: BE2
// Zod validation schemas for registration payloads
// Used in both the API route (server) and the form (client via react-hook-form)
import { z } from 'zod'

export const teamMemberSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

export const registrationAnswerSchema = z.object({
  field_id: z.string().uuid(),
  member_index: z.number().optional(),
  answer: z.string().min(1, 'This field is required'),
})

export const soloRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  registration_type: z.literal('solo'),
  leader_name: z.string().min(2),
  leader_email: z.string().email(),
  leader_phone: z.string().regex(/^[6-9]\d{9}$/),
  register_number: z.string().min(5),
  answers: z.array(registrationAnswerSchema).optional().default([]),
})

export const teamRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  registration_type: z.literal('team'),
  team_name: z.string().min(2),
  leader_name: z.string().min(2),
  leader_email: z.string().email(),
  leader_phone: z.string().regex(/^[6-9]\d{9}$/),
  register_number: z.string().min(5),
  // Group-code model: the creator makes the team with just themselves; other
  // participants join later with the code, so members are no longer required
  // up front. Kept optional for any legacy callers that still pass members.
  members: z.array(teamMemberSchema).optional().default([]),
  answers: z.array(registrationAnswerSchema).optional().default([]),
})

export const registrationSchema = z.discriminatedUnion(
  'registration_type',
  [soloRegistrationSchema, teamRegistrationSchema]
)

export const resendConfirmationSchema = z.object({
  email: z.string().email(),
  event_id: z.string().uuid(),
})
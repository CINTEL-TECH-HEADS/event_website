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

// The registration form is organizer-driven, so core identity fields are only
// collected if the organizer added them. They're optional here (validated only
// when present); the API backfills leader_email from the authenticated account.
const optionalEmail = z.union([z.literal(''), z.string().email()]).optional()
const optionalPhone = z.union([z.literal(''), z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone')]).optional()
const optionalName = z.string().optional()
const optionalRegNo = z.string().optional()

export const soloRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  registration_type: z.literal('solo'),
  leader_name: optionalName,
  leader_email: optionalEmail,
  leader_phone: optionalPhone,
  register_number: optionalRegNo,
  answers: z.array(registrationAnswerSchema).optional().default([]),
})

export const teamRegistrationSchema = z.object({
  event_id: z.string().uuid(),
  registration_type: z.literal('team'),
  team_name: z.string().min(2),
  leader_name: optionalName,
  leader_email: optionalEmail,
  leader_phone: optionalPhone,
  register_number: optionalRegNo,
  // Group-code model: the creator makes the team with just themselves; other
  // participants join later with the code, so members are no longer required
  // up front. Kept optional for any legacy callers that still pass members.
  members: z.array(teamMemberSchema).optional().default([]),
  // "Find a team" seeker: the team name is auto-generated, so uniqueness is
  // resolved silently rather than rejected.
  seeking: z.boolean().optional(),
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
// Owner: BE2
import { z } from 'zod'

export const eventBaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_type: z.enum(['workshop', 'seminar', 'fest', 'hackathon', 'talk', 'other']),
  venue: z.string().min(3, 'Venue is required'),
  starts_at: z.string().datetime({ message: 'Invalid start date' }),
  ends_at: z.string().datetime({ message: 'Invalid end date' }),
  registration_closes_at: z.string().datetime({ message: 'Invalid cutoff date' }),
  capacity: z.number().int().positive().nullable(),
  registration_mode: z.enum(['solo', 'team', 'both']),
  min_team_size: z.number().int().min(2).nullable().optional(),
  max_team_size: z.number().int().min(2).nullable().optional(),
  // Optional waitlist size (null = no waitlist → close when capacity is full).
  waitlist_capacity: z.number().int().min(0).nullable().optional(),
  // Fee in rupees (0 = free).
  fee: z.number().int().min(0).optional(),
})

export const createEventSchema = eventBaseSchema.refine(d => new Date(d.ends_at) > new Date(d.starts_at), {
  message: 'End time must be after start time',
  path: ['ends_at'],
}).refine(d => new Date(d.registration_closes_at) <= new Date(d.starts_at), {
  message: 'Registration must close before the event starts',
  path: ['registration_closes_at'],
}).refine(
  d => d.registration_mode === 'solo' || (d.min_team_size != null && d.max_team_size != null),
  { message: 'Team and both events require a min and max team size', path: ['max_team_size'] }
).refine(
  d => d.registration_mode === 'solo' || d.min_team_size == null || d.max_team_size == null || d.min_team_size <= d.max_team_size,
  { message: 'Max team size must be greater than or equal to min team size', path: ['max_team_size'] }
)

export const updateEventSchema = eventBaseSchema.partial().extend({
  is_published: z.boolean().optional(),
})

export type CreateEventPayload = z.infer<typeof createEventSchema>
export type UpdateEventPayload = z.infer<typeof updateEventSchema>

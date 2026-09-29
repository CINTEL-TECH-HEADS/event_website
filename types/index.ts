// types/index.ts
// TypeScript types for all 11 Cintel database tables.
// Every backend and frontend file imports from here.
// Never define table types anywhere else.

// ── Enums ────────────────────────────────────────────────────

export type UserRole = 'superadmin' | 'organizer'
export type OrganizerRole = 'owner' | 'sub_admin' | 'judge'
export type EventType = 'workshop' | 'seminar' | 'fest' | 'hackathon' | 'talk' | 'other'
export type RegistrationMode = 'solo' | 'team' | 'both'
export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled'
export type AttendanceMethod = 'qr_scan' | 'manual'
export type NotificationChannel = 'email' | 'whatsapp'
export type NotificationStatus = 'sent' | 'failed' | 'pending'
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'email'
  | 'phone' | 'select' | 'multi_select'
  | 'checkbox' | 'file' | 'date'
export type FieldAppliesTo = 'registration' | 'member'
export type DuplicateReason = 'same_name_phone' | 'rapid_submission'

// ── Table row types ──────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  banner_url: string | null
  event_type: EventType
  venue: string
  starts_at: string
  ends_at: string
  registration_closes_at: string
  capacity: number | null
  registration_mode: RegistrationMode
  min_team_size: number | null
  max_team_size: number | null
  slug: string
  is_published: boolean
  is_deleted: boolean
  created_by: string | null
  created_at: string
  // Waitlist + payment
  waitlist_capacity?: number | null
  fee?: number
  // Other-college students can only see and register for events with this on.
  open_to_external?: boolean
  // Payment configuration (only meaningful when fee > 0)
  payment_method?: 'upi' | 'bank' | null
  upi_id?: string | null
  upi_payee_name?: string | null
  bank_account_name?: string | null
  bank_account_number?: string | null
  bank_ifsc?: string | null
  bank_name?: string | null
  certificates_released_at?: string | null
}

export type PaymentMethod = 'upi' | 'bank'
export type PaymentStatus = 'not_required' | 'pending' | 'submitted' | 'paid' | 'rejected'

export interface EventOrganizer {
  id: string
  event_id: string
  profile_id: string
  role: OrganizerRole
  created_at: string
}

// Keys of a participant profile that a "standard" form field can map to.
// null field_key = a fully custom field.
export type ProfileFieldKey =
  | 'full_name'
  | 'register_number'
  | 'phone'
  | 'college_email'
  | 'personal_email'
  | 'year_of_study'
  | 'batch'
  | 'section'
  | 'fa_name'

export interface FormField {
  id: string
  event_id: string
  label: string
  field_type: FieldType
  options: string[] | null
  validation: FieldValidation | null
  is_required: boolean
  applies_to: FieldAppliesTo
  sort_order: number
  field_key: ProfileFieldKey | null
  // Which form the field is on: SRM KTR students, or students from other colleges.
  audience?: FormAudience
}

export type FormAudience = 'srm' | 'external'

export interface ParticipantProfile {
  id: string
  full_name: string | null
  register_number: string | null
  phone: string | null
  college_email: string | null
  personal_email: string | null
  year_of_study: string | null
  batch: string | null
  section: string | null
  fa_name: string | null
  department: string | null
  skills: string | null
  interests: string | null
  linkedin_url: string | null
  github_url: string | null
  affiliation: 'srm' | 'external' | null
  college_name: string | null
  updated_at: string
}

export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  allowed_types?: string[]
  max_size_mb?: number
}

export interface Registration {
  id: string
  display_id: string
  event_id: string
  registration_type: 'solo' | 'team'
  team_name: string | null
  leader_name: string
  leader_email: string
  leader_phone: string
  qr_code_url: string | null
  status: RegistrationStatus
  waitlist_position: number | null
  registered_at: string
}

export interface TeamMember {
  id: string
  registration_id: string
  full_name: string
  email: string
  is_leader: boolean
  created_at: string
}

export interface RegistrationAnswer {
  id: string
  registration_id: string
  member_id: string | null
  field_id: string
  answer: string
}

export interface Attendance {
  id: string
  registration_id: string
  event_id: string
  method: AttendanceMethod
  checked_in_at: string
  checked_in_by: string | null
}

export interface DuplicateFlag {
  id: string
  event_id: string
  registration_id: string
  reason: DuplicateReason
  reviewed: boolean
  reviewed_by: string | null
  created_at: string
}

export interface NotificationLog {
  id: string
  event_id: string
  registration_id: string
  type: string
  channel: NotificationChannel
  status: NotificationStatus
  sent_at: string | null
  error: string | null
}

export interface Certificate {
  id: string
  event_id: string
  registration_id: string
  certificate_url: string
  generated_at: string
  template_version: number
}

export interface CertificateTemplate {
  id: string
  event_id: string
  name: string
  storage_path: string
  is_default: boolean
  created_at: string
  template_type: string | null
  certificate_type: string | null
  layout_config: any | null
}

export interface CertificateAssignment {
  id: string
  event_id: string
  registration_id: string
  team_member_id: string | null
  template_id: string | null
  created_at: string
  certificate_type: string | null
  certificate_file_url?: string | null
}

// ── Joined / enriched types (used in API responses) ──────────

// Registration with its team members attached
export interface RegistrationWithMembers extends Registration {
  team_members: TeamMember[]
}

// Registration with members + form answers
export interface RegistrationFull extends RegistrationWithMembers {
  registration_answers: RegistrationAnswer[]
}

// Event with form fields attached (used in GET /api/events/[slug])
export interface EventWithFields extends Event {
  form_fields: FormField[]
  confirmed_count: number
  waitlist_count: number
}

// ── API response wrapper ──────────────────────────────────────
// All API routes return this shape.
// { data: T, error: null } on success
// { data: null, error: string } on failure

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// ── Database type map (used by Supabase client generics) ──────
// This tells the Supabase client what each table looks like
// so you get autocomplete and type checking on all queries.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      event_organizers: {
        Row: EventOrganizer
        Insert: Omit<EventOrganizer, 'id' | 'created_at'>
        Update: Partial<Omit<EventOrganizer, 'id' | 'created_at'>>
      }
      form_fields: {
        Row: FormField
        Insert: Omit<FormField, 'id'>
        Update: Partial<Omit<FormField, 'id'>>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'registered_at'>
        Update: Partial<Omit<Registration, 'id' | 'registered_at'>>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'>
        Update: Partial<Omit<TeamMember, 'id' | 'created_at'>>
      }
      registration_answers: {
        Row: RegistrationAnswer
        Insert: Omit<RegistrationAnswer, 'id'>
        Update: Partial<Omit<RegistrationAnswer, 'id'>>
      }
      attendance: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'checked_in_at'>
        Update: Partial<Omit<Attendance, 'id' | 'checked_in_at'>>
      }
      duplicate_flags: {
        Row: DuplicateFlag
        Insert: Omit<DuplicateFlag, 'id' | 'created_at'>
        Update: Partial<Omit<DuplicateFlag, 'id' | 'created_at'>>
      }
      notifications_log: {
        Row: NotificationLog
        Insert: Omit<NotificationLog, 'id'>
        Update: Partial<Omit<NotificationLog, 'id'>>
      }
      certificates: {
        Row: Certificate
        Insert: Omit<Certificate, 'id' | 'generated_at'>
        Update: Partial<Omit<Certificate, 'id' | 'generated_at'>>
      }
      certificate_templates: {
        Row: CertificateTemplate
        Insert: Omit<CertificateTemplate, 'id' | 'created_at'>
        Update: Partial<Omit<CertificateTemplate, 'id' | 'created_at'>>
      }
      certificate_assignments: {
        Row: CertificateAssignment
        Insert: Omit<CertificateAssignment, 'id' | 'created_at'>
        Update: Partial<Omit<CertificateAssignment, 'id' | 'created_at'>>
      }
    }
  }
}
export type EventWithStats = {
  id: string
  title: string
  description?: string
  venue?: string
  starts_at?: string
  ends_at?: string
  registration_closes_at?: string
  capacity?: number | null
  registration_mode?: 'solo' | 'team' | 'both'
  event_type?: string
  slug?: string
  is_published?: boolean
  confirmed_count?: number
  waitlist_count?: number
  banner_url?: string | null
  fee?: number
  open_to_external?: boolean
  // Returned by GET/PATCH /api/events/[id]: why the registration form (and
  // open_to_external) can no longer change, or null while it can.
  form_lock?: 'published' | 'registrations' | null
  // From GET /api/events?mine=true: the signed-in user's role on this event
  // (absent for club-wide organizers, who manage every event).
  my_role?: OrganizerRole
}
export type RegistrationWithDetails = {
  id: string
  display_id: string
  leader_name: string
  leader_email: string
  registration_type: 'solo' | 'team'
  status: string
  registered_at: string
  team_name?: string
  attendance?: any
  members: any[]
  answers?: any[]
}
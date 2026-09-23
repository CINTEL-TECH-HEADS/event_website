// components/certificates/types.ts
// Shared TypeScript types for the certificate management module.
// These are UI-level types and do NOT replace types/index.ts.

export interface TemplateConfig {
  id: string
  event_id: string
  name: string
  storage_path: string | null
  certificate_type: string | null
  layout_config: LayoutConfig | null
  is_default: boolean
  template_type: string | null
  created_at: string
  previewUrl: string | null
}

export interface LayoutConfig {
  name: TextLayerConfig
  teamName?: TextLayerConfig
  qr: QrLayerConfig
}

export interface TextLayerConfig {
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle?: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  maxWidth: number
  color?: string
}

export interface QrLayerConfig {
  x: number
  y: number
  size: number
}

export interface TeamMemberEntry {
  teamMemberId: string
  name: string
  email: string
  isLeader: boolean
}

export interface TeamGroup {
  registrationId: string
  teamName: string
  members: TeamMemberEntry[]
}

export interface SoloParticipant {
  registrationId: string
  name: string
  email: string
}

export interface AssignmentRow {
  id: string
  event_id: string
  registration_id: string
  team_member_id: string | null
  template_id: string | null
  certificate_type: string
  created_at: string
}

export const CERT_TYPES = [
  'Participation',
  'Winner',
  'Runner Up',
  '2nd Runner Up',
  'Not Eligible',
] as const

export type CertType = (typeof CERT_TYPES)[number]

export const CERT_TYPE_COLORS: Record<string, string> = {
  Winner: '#F5E62D',
  'Runner Up': '#93C5FD',
  '2nd Runner Up': '#86EFAC',
  Participation: '#94A3B8',
  'Not Eligible': '#475569',
}

export const TEMPLATE_TYPES = ['solo', 'team'] as const
export type TemplateType = (typeof TEMPLATE_TYPES)[number]

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merging — use this everywhere instead of string concatenation
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display: "Saturday, 10 May 2026 at 10:00 AM"
export function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Short date: "10 May 2026"
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Check if a date string is in the past
export function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

// An event is open for registration if its close date (falling back to end,
// then start) has not passed. Handles null ends_at / registration_closes_at,
// which the old ends_at-only check let slip through.
export function isRegistrationOpen(e: {
  registration_closes_at?: string | null
  ends_at?: string | null
  starts_at?: string | null
}): boolean {
  const cutoff = e.registration_closes_at ?? e.ends_at ?? e.starts_at
  return !(cutoff && isPast(cutoff))
}

// Calculate spots left — returns null if unlimited
export function spotsLeft(capacity: number | null, confirmedCount: number): number | null {
  if (capacity === null) return null
  return Math.max(0, capacity - confirmedCount)
}

// Mask email: pratham@gmail.com → p*****@gmail.com
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  return `${user[0]}${'*'.repeat(user.length - 1)}@${domain}`
}

// Standard API success response
export function apiSuccess<T>(data: T) {
  return Response.json({ data, error: null })
}

// Standard API error response
export function apiError(message: string, status = 400) {
  return Response.json({ data: null, error: message }, { status })
}

// Generate a random slug from event title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Math.random().toString(36).slice(2, 7)
}

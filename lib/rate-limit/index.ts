// lib/rate-limit/index.ts
// Simple in-memory rate limiter for development.
// Swap the store for Upstash Redis in production for multi-instance support.
//
// Presets:
//   register  — 5 requests per IP per 10 minutes
//   resend    — 3 requests per IP per 10 minutes
//   checkin   — 60 requests per IP per minute (scanner fires fast)
//
// Usage in an API route:
//   import { rateLimit } from '@/lib/rate-limit'
//
//   const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
//   const { success } = rateLimit('register', ip)
//   if (!success) {
//     return NextResponse.json(
//       { data: null, error: 'Too many requests. Please wait and try again.' },
//       { status: 429 }
//     )
//   }

type Preset = 'register' | 'resend' | 'checkin' | 'login' | 'password-reset'

interface RateLimitConfig {
  maxRequests: number   // max allowed in the window
  windowMs: number   // window size in milliseconds
}

const PRESETS: Record<Preset, RateLimitConfig> = {
  register: { maxRequests: 5, windowMs: 10 * 60 * 1000 },   // 5 per 10 min
  resend: { maxRequests: 3, windowMs: 10 * 60 * 1000 },   // 3 per 10 min
  checkin: { maxRequests: 60, windowMs: 60 * 1000 },         // 60 per 1 min
  login: { maxRequests: 8, windowMs: 10 * 60 * 1000 },   // 8 per 10 min per IP
  'password-reset': { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min per IP
}

// In-memory store: key = `${preset}:${identifier}`, value = { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  preset: Preset,
  identifier: string
): { success: boolean; remaining: number; resetAt: number } {
  const config = PRESETS[preset]
  const key = `${preset}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  // Window expired or first request — reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: config.maxRequests - 1, resetAt }
  }

  // Within window — check count
  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

// Clean up expired entries every 15 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 15 * 60 * 1000)

// Named exports for specific routes (aliases for FE2 compatibility)
export const registrationRateLimit = (identifier: string) =>
  rateLimit('register', identifier)

export const resendRateLimit = (identifier: string) =>
  rateLimit('resend', identifier)

export const checkInRateLimit = (identifier: string) =>
  rateLimit('checkin', identifier)

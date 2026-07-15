'use client'

// Shared numeric code input for email OTP (signup verify + password reset).
// Supabase's OTP length is configurable (6–10); we accept up to MAX_OTP and
// treat MIN_OTP as the minimum before submit. `verifyOtp` is the real authority.

export const MIN_OTP = 6
const MAX_OTP = 10

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function OtpInput({ value, onChange, disabled, autoFocus }: OtpInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={MAX_OTP}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, MAX_OTP))}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder="••••••"
      aria-label="Verification code"
      className="w-full bg-[#0a1629] border border-white/10 px-4 py-3.5 text-center text-2xl font-mono tracking-[0.4em] text-white placeholder-slate-600 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition-all disabled:opacity-60"
    />
  )
}

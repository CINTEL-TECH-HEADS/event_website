// lib/email/resend.ts
// Initializes the Resend client with your API key.
// Every email send function imports { resend } from here.
// Never initialize Resend anywhere else.

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

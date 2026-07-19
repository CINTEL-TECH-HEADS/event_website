import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build'
export const resend = new Resend(apiKey)

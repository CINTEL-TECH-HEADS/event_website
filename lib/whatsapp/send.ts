// lib/whatsapp/send.ts
// Twilio WhatsApp API wrapper.
// All functions are fire-and-forget — they log errors but never throw.
//
// ⚠  SETUP REQUIRED before this works:
//   1. Sign up at twilio.com
//   2. Go to Messaging → Try it out → Send a WhatsApp message
//   3. Follow sandbox setup — send "join <keyword>" from your phone
//   4. Add to .env.local:
//        TWILIO_ACCOUNT_SID=ACxxxxxxxxx
//        TWILIO_AUTH_TOKEN=xxxxxxxxx
//        TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
//
// For production: apply for a WhatsApp Business number in Twilio console
// and get your message templates approved by Meta (takes 1-3 days).

import twilio from 'twilio'

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio credentials in environment variables')
  }

  return twilio(accountSid, authToken)
}

const FROM = () => process.env.TWILIO_WHATSAPP_FROM!

// Format Indian phone numbers to WhatsApp format
// Input: '9876543210' or '+919876543210'
// Output: 'whatsapp:+919876543210'
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('91') && digits.length === 12
    ? `+${digits}`
    : digits.length === 10
      ? `+91${digits}`
      : `+${digits}`
  const result = `whatsapp:${normalized}`
  console.log('Sending WhatsApp to:', result)
  return result
}

// ── 1. Confirmation WhatsApp ──────────────────────────────────
export async function sendConfirmationWhatsApp(params: {
  to: string
  leaderName: string
  eventTitle: string
  startsAt: string
  venue: string
  displayId: string
}) {
  try {
    const client = getClient()
    const date = new Date(params.startsAt).toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    await client.messages.create({
      from: FROM(),
      to: formatPhone(params.to),
      body: `Hi ${params.leaderName}! 🎉\n\nYou're registered for *${params.eventTitle}*.\n\n📅 ${date}\n📍 ${params.venue}\n🆔 ID: ${params.displayId}\n\nYour QR code has been sent to your email. Show it at the entrance on event day.`,
    })
  } catch (err) {
    console.error('[sendConfirmationWhatsApp] failed:', err)
  }
}

// ── 2. Reminder WhatsApp ──────────────────────────────────────
export async function sendReminderWhatsApp(params: {
  to: string
  leaderName: string
  eventTitle: string
  startsAt: string
  venue: string
  isOneHour: boolean
}) {
  try {
    const client = getClient()
    const date = new Date(params.startsAt).toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    })

    const message = params.isOneHour
      ? `⏰ *${params.eventTitle}* starts in 1 hour!\n\n📍 ${params.venue}\n🕐 ${date}\n\nHave your QR code ready from your confirmation email.`
      : `👋 Hi ${params.leaderName}! Just a reminder that *${params.eventTitle}* is tomorrow.\n\n📍 ${params.venue}\n🕐 ${date}\n\nSee you there!`

    await client.messages.create({
      from: FROM(),
      to: formatPhone(params.to),
      body: message,
    })
  } catch (err) {
    console.error('[sendReminderWhatsApp] failed:', err)
  }
}

// ── 3. Promotion WhatsApp ─────────────────────────────────────
export async function sendPromotionWhatsApp(params: {
  to: string
  leaderName: string
  eventTitle: string
  startsAt: string
  venue: string
}) {
  try {
    const client = getClient()
    const date = new Date(params.startsAt).toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    await client.messages.create({
      from: FROM(),
      to: formatPhone(params.to),
      body: `Hi ${params.leaderName}! 🎟️\n\nGreat news — a spot opened up for *${params.eventTitle}* and you've been moved off the waitlist!\n\n📅 ${date}\n📍 ${params.venue}\n\nYour QR code has been sent to your email.`,
    })
  } catch (err) {
    console.error('[sendPromotionWhatsApp] failed:', err)
  }
}
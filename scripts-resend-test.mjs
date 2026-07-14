// Ad-hoc Resend connectivity test. Run: node scripts-resend-test.mjs you@example.com
// Reads RESEND_API_KEY + EMAIL_FROM from .env.local
import { readFileSync } from 'node:fs'
import { Resend } from 'resend'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const key = env.RESEND_API_KEY, from = env.EMAIL_FROM
const to = process.argv[2]
if (!key)  { console.error('❌ RESEND_API_KEY is empty in .env.local'); process.exit(1) }
if (!from) { console.error('❌ EMAIL_FROM is not set in .env.local'); process.exit(1) }
if (!to)   { console.error('Usage: node scripts-resend-test.mjs recipient@example.com'); process.exit(1) }

const resend = new Resend(key)
const { data, error } = await resend.emails.send({
  from, to, subject: 'Cintel × Resend — test email',
  html: '<p>If you can read this, Resend is wired up correctly. 🎉</p>',
})
if (error) { console.error('❌ Resend error:', error); process.exit(1) }
console.log('✅ Sent. id:', data?.id, '\n   from:', from, '→ to:', to)

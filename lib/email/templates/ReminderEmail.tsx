// lib/email/templates/ReminderEmail.tsx
// Used for both the 24h and 1h before event reminders.
// Pass isOneHour=true for the 1h reminder — changes the subject + tone.

import {
  Body, Container, Head, Heading,
  Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface ReminderEmailProps {
  leaderName: string
  eventTitle: string
  eventVenue: string
  startsAt: string
  displayId: string
  isOneHour: boolean   // true = 1h reminder, false = 24h reminder
}

export function ReminderEmail({
  leaderName,
  eventTitle,
  eventVenue,
  startsAt,
  displayId,
  isOneHour,
}: ReminderEmailProps) {
  const formattedDate = new Date(startsAt).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const heading = isOneHour
    ? `${eventTitle} starts in 1 hour ⏰`
    : `${eventTitle} is tomorrow — see you there!`

  const preview = isOneHour
    ? `${eventTitle} starts in 1 hour. Have your QR code ready.`
    : `${eventTitle} is tomorrow. Here's everything you need.`

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>

          <Heading style={h1}>{heading}</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text}>
            {isOneHour
              ? 'This is your final reminder — the event starts in 1 hour. Make sure you have your QR code ready to show at the entrance.'
              : "Just a reminder that your event is tomorrow. We're looking forward to seeing you!"}
          </Text>

          {/* Event details */}
          <Section style={detailsBox}>
            <Text style={detailRow}><strong>Event:</strong> {eventTitle}</Text>
            <Text style={detailRow}><strong>Date:</strong> {formattedDate}</Text>
            <Text style={detailRow}><strong>Venue:</strong> {eventVenue}</Text>
            <Text style={detailRow}><strong>Registration ID:</strong> <span style={mono}>{displayId}</span></Text>
          </Section>

          <Text style={text}>
            Your QR code was sent in your original confirmation email.
            Can't find it? Check your spam folder or{' '}
            search for "Cintel" in your inbox.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            — Cintel, SRM Institute of Science and Technology
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default ReminderEmail

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 32px',
  borderRadius: '8px',
  maxWidth: '560px',
}

const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
}

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 12px',
}

const detailsBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0 24px',
}

const detailRow: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: '4px 0',
}

const mono: React.CSSProperties = {
  fontFamily: 'monospace',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
}
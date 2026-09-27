// lib/email/templates/ConfirmationEmail.tsx
// Sent immediately after a successful registration.
// Contains QR code image, event details, display ID, and calendar link.

import {
  Body, Button, Container, Head, Heading,
  Hr, Html, Img, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface ConfirmationEmailProps {
  leaderName: string
  teamName: string | null
  eventTitle: string
  eventVenue: string
  startsAt: string        // ISO string
  displayId: string        // e.g. 'A3F2K9M1'
  qrCodeUrl: string        // public URL or base64
  calendarUrl: string        // Google Calendar deep link
  portalUrl: string        // link to the participant portal (My events)
}

export function ConfirmationEmail({
  leaderName,
  teamName,
  eventTitle,
  eventVenue,
  startsAt,
  displayId,
  qrCodeUrl,
  calendarUrl,
  portalUrl,
}: ConfirmationEmailProps) {
  const formattedDate = new Date(startsAt).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Html>
      <Head />
      <Preview>You're registered for {eventTitle} — your QR code is inside</Preview>
      <Body style={main}>
        <Container style={container}>

          <Heading style={h1}>You're in! 🎉</Heading>

          <Text style={text}>
            Hi {leaderName}{teamName ? ` (Team: ${teamName})` : ''},
          </Text>

          <Text style={text}>
            Your registration for <strong>{eventTitle}</strong> is confirmed.
            Show the QR code below at the entrance on event day.
          </Text>

          {/* QR Code */}
          <Section style={qrSection}>
            <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer">
              <Img
                src={qrCodeUrl}
                width="200"
                height="200"
                alt="Your QR code"
                style={qrImage}
              />
            </a>
            <Text style={{ ...displayIdText, marginTop: '12px' }}>Registration ID: {displayId}</Text>
            <Text style={fallbackText}>If the QR image doesn't load, please click the box above to view it in your browser.</Text>
          </Section>

          {/* Event details */}
          <Section style={detailsBox}>
            <Text style={detailRow}><strong>Event:</strong> {eventTitle}</Text>
            <Text style={detailRow}><strong>Date:</strong> {formattedDate}</Text>
            <Text style={detailRow}><strong>Venue:</strong> {eventVenue}</Text>
          </Section>

          {/* Calendar button */}
          <Button style={button} href={calendarUrl}>
            Add to Google Calendar
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Your registration and QR pass are always available in{' '}
            <a href={portalUrl} style={link}>My events</a>.
          </Text>

          <Text style={footer}>
            — Cintel, SRM Institute of Science and Technology
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmationEmail

// ── Styles ───────────────────────────────────────────────────

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

const qrSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
}

const qrImage: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '8px',
}

const displayIdText: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginTop: '8px',
  fontFamily: 'monospace',
}

const fallbackText: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
  marginTop: '4px',
}

const detailsBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px',
}

const detailRow: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: '4px 0',
}

const button: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '4px 0',
}

const link: React.CSSProperties = {
  color: '#2563eb',
}
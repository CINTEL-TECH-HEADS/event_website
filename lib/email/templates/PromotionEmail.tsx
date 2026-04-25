// lib/email/templates/PromotionEmail.tsx
// Sent when someone cancels and this person gets promoted off the waitlist.
// Urgent tone — they need to know a spot just opened for them.

import {
  Body, Button, Container, Head, Heading,
  Hr, Html, Img, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface PromotionEmailProps {
  leaderName: string
  eventTitle: string
  eventVenue: string
  startsAt: string
  displayId: string
  qrCodeUrl: string
  calendarUrl: string
}

export function PromotionEmail({
  leaderName,
  eventTitle,
  eventVenue,
  startsAt,
  displayId,
  qrCodeUrl,
  calendarUrl,
}: PromotionEmailProps) {
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
      <Preview>Great news — a spot opened up for {eventTitle}! Your QR code is inside.</Preview>
      <Body style={main}>
        <Container style={container}>

          <Heading style={h1}>A spot opened up for you! 🎟️</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text}>
            Good news — someone cancelled their registration for{' '}
            <strong>{eventTitle}</strong> and you've been moved off the
            waitlist. Your spot is confirmed.
          </Text>

          <Text style={text}>
            Show the QR code below at the entrance on event day.
          </Text>

          {/* QR Code */}
          <Section style={qrSection}>
            <Img
              src={qrCodeUrl}
              width="200"
              height="200"
              alt="Your QR code"
              style={qrImage}
            />
            <Text style={displayIdText}>Registration ID: {displayId}</Text>
          </Section>

          {/* Event details */}
          <Section style={detailsBox}>
            <Text style={detailRow}><strong>Event:</strong> {eventTitle}</Text>
            <Text style={detailRow}><strong>Date:</strong> {formattedDate}</Text>
            <Text style={detailRow}><strong>Venue:</strong> {eventVenue}</Text>
          </Section>

          <Button style={button} href={calendarUrl}>
            Add to Google Calendar
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            — Cintel, SRM Institute of Science and Technology
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default PromotionEmail

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
}
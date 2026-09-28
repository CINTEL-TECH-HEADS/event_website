// lib/email/templates/WaitlistEmail.tsx
// Sent when the event is full and the registrant is added to the waitlist.

import {
  Body, Container, Head, Heading,
  Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

interface WaitlistEmailProps {
  leaderName: string
  eventTitle: string
  // May be absent — the email falls back to a generic waitlist confirmation.
  waitlistPosition?: number | null
}

export function WaitlistEmail({
  leaderName,
  eventTitle,
  waitlistPosition,
}: WaitlistEmailProps) {
  const hasPosition = waitlistPosition != null
  return (
    <Html>
      <Head />
      <Preview>
        {hasPosition
          ? `You're on the waitlist for ${eventTitle} — position #${waitlistPosition}`
          : `You're on the waitlist for ${eventTitle}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>

          <Heading style={h1}>You&apos;re on the waitlist</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text}>
            <strong>{eventTitle}</strong> is currently full, but you&apos;ve been
            added to the waitlist.
          </Text>

          {hasPosition && (
            <Section style={positionBox}>
              <Text style={positionLabel}>Your position</Text>
              <Text style={positionNumber}>#{waitlistPosition}</Text>
            </Section>
          )}

          <Text style={text}>
            If a spot opens up, you&apos;ll be automatically promoted and receive
            a new email with your QR code. No action needed from your side.
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

export default WaitlistEmail

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

const positionBox: React.CSSProperties = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde047',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  margin: '20px 0',
}

const positionLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0 0 4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const positionNumber: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: '700',
  color: '#92400e',
  margin: '0',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
}
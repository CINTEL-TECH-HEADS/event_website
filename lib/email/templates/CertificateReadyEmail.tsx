// lib/email/templates/CertificateReadyEmail.tsx
// Sent after BE4 generates and releases certificates.
// Contains a download button linking to /certificate page.

import {
  Body, Button, Container, Head, Heading,
  Hr, Html, Preview, Text,
} from '@react-email/components'
import * as React from 'react'

interface CertificateReadyEmailProps {
  leaderName: string
  eventTitle: string
  certificateUrl: string   // direct signed URL to the PDF
}

export function CertificateReadyEmail({
  leaderName,
  eventTitle,
  certificateUrl,
}: CertificateReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your certificate for {eventTitle} is ready to download</Preview>
      <Body style={main}>
        <Container style={container}>

          <Heading style={h1}>Your certificate is ready 🎓</Heading>

          <Text style={text}>Hi {leaderName},</Text>

          <Text style={text}>
            Thank you for attending <strong>{eventTitle}</strong>.
            Your certificate of participation is ready to download.
          </Text>

          <Button style={button} href={certificateUrl}>
            Download Certificate
          </Button>

          <Text style={note}>
            This link expires in 7 days. Download and save your certificate before then.
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

export default CertificateReadyEmail

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
  margin: '0 0 16px',
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

const note: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginTop: '16px',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
}
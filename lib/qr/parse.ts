// lib/qr/parse.ts
// The attendance QR encodes a URL like `${APP_URL}/checkin/<registration-uuid>`.
// The scanner decodes that text; we extract the registration UUID from it.

export function parseUuidFromQr(content: string): string | null {
  const match = content.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return match ? match[0] : null
}

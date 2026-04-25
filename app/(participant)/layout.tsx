import Link from 'next/link'
import { Blocks } from 'lucide-react'

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', position: 'relative' }}>

      {/* Full page solid background — no gradient cutoff */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#020617',
        zIndex: 0,
      }} />

      {/* Top gradient overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '600px',
        background: 'radial-gradient(ellipse at top, rgba(30,58,138,0.35) 0%, rgba(2,6,23,0) 70%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Bottom right glow */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle at bottom right, rgba(120,53,15,0.08) 0%, transparent 60%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '4rem 4rem',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/participant/portal" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Blocks size={16} color="#f59e0b" />
          <span style={{ fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em' }}>Cintel</span>
        </Link>
        <Link href="/participant/portal" style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'none' }}>
          My Events
        </Link>
      </header>

      {/* Main */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        minHeight: 'calc(100vh - 57px)',
      }}>
        {children}
      </main>

    </div>
  )
}
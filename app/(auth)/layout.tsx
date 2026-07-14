// Owner: FE2
import { ThemeToggle } from '@/components/public/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-theme-shell relative min-h-screen w-full overflow-hidden bg-[#07101d] text-slate-100">
      {/* Grid overlay — matches homescreen */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px,24px_24px]" />
      {/* Amber top glow — matches homescreen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]" />

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

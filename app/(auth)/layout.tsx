// Owner: FE2
import { ThemeToggle } from '@/components/public/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-theme-shell relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Poster corner accents */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border-4 border-border opacity-[0.08]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary-red opacity-[0.08]" />

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

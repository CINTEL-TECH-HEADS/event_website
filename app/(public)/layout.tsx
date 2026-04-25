// Owner: FE1 — Public Layout (Neon Premium)

import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen text-slate-200">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 decoration-transparent">
            {/* The actual logo image loaded from public directory once provided */}
            <img src="/cintel-logo.png" alt="CINTEL Logo" className="w-12 h-12 rounded-lg bg-white p-1 object-contain" />
            
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white leading-none">CINTEL</span>
              <span className="text-[0.65rem] font-bold tracking-widest text-amber-400 uppercase leading-tight">Association</span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-[0.8rem] uppercase tracking-widest font-bold">
            <Link
              href="/"
              className="text-slate-400 hover:text-amber-400 transition-colors hidden sm:block"
            >
              Events
            </Link>
            <Link
              href="/resend"
              className="text-slate-400 hover:text-amber-400 transition-colors hidden sm:block"
            >
              Resend
            </Link>
            <Link
              href="/certificate"
              className="px-5 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2"
            >
              Certificates
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#020617] relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 opacity-60">
            <BrainCircuit className="text-slate-500" size={18} />
            <p className="text-sm font-semibold tracking-wide text-slate-400">
              Department of Computational Intelligence
            </p>
          </div>
          <p className="text-[0.7rem] tracking-widest uppercase text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} Cintel Association
          </p>
        </div>
      </footer>
    </div>
  )
}

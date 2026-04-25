'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, TerminalSquare, LayoutGrid, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

function SignupForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Failed to create account.')
        return
      }

      // Automatically redirect to the dashboard (or requested route) upon successful signup
      window.location.assign(redirect)
    } catch (error) {
      setError('Connection dropped. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-[#030507] text-slate-300 font-sans relative overflow-hidden">
      
      {/* EdTech / Premium Background Beams */}
      <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -translate-x-1/4 translate-y-1/2" />

      {/* Grid pattern overlay (sleek tech feel) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="grid w-full max-w-[1100px] overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f12]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] lg:grid-cols-2 relative z-10 transition-all app-fade-in-up">
        
        {/* Left Side: Auth Block */}
        <section className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          
          <div className="mb-10 space-y-3">
             <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-[1rem] flex items-center justify-center text-amber-400 mb-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
               <ShieldCheck size={24} />
             </div>
             <h1 className="text-3xl font-bold text-white tracking-tight">Initialize Workspace.</h1>
             <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
                Provision a new administrative account to deploy and manage structural event parameters.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 tracking-wide">Workspace Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cintel.in"
                  required
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-400 tracking-wide">Master Password</label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono tracking-widest text-lg"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] text-sm">
                {loading ? 'Provisioning...' : 'Create Infrastructure'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
            
            <div className="pt-4 text-center">
              <span className="text-slate-500 text-sm">Already initialized? </span>
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold text-sm tracking-wide transition-colors">
                Access Portal
              </Link>
            </div>
          </form>

        </section>

        {/* Right Side: Showcase (Premium EdTech Style) */}
        <section className="hidden lg:flex flex-col justify-between border-l border-white/5 bg-[#020617]/50 p-12 lg:p-16 relative overflow-hidden">
           {/* Abstract Geometric shapes */}
           <div className="absolute right-0 bottom-0 w-64 h-64 border border-amber-500/10 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
           <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/5 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[0.65rem] font-bold tracking-widest uppercase mb-8">
                 <TerminalSquare size={14} /> Cintel Infrastructure
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">
                 Scale operations <br/><span className="text-slate-500">with precision engineering.</span>
              </h2>
           </div>

           <div className="space-y-6 mt-12">
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Zap size={14} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm mb-1">Instant Event Provisioning</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Launch and configure custom parameters with automated database scaffolding instantly.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <LayoutGrid size={14} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm mb-1">Full-Scale Control Plane</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Control global broadcasts, manage ticketing queues, and enforce check-in cryptography at scale.</p>
                 </div>
              </div>
           </div>
        </section>

      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[0.65rem] tracking-widest font-mono text-amber-500 uppercase">
          [System Connecting...]
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}

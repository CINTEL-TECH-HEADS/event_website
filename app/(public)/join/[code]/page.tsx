'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function JoinTeamPage() {
  const { code } = useParams<{ code: string }>()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/participant/team/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: code.toUpperCase(), full_name: fullName, email }),
    })

    const { data, error } = await res.json()
    if (error) { setMessage(error); setStatus('error') }
    else       { setMessage(data.message); setStatus('success') }
  }

  if (status === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">You're in!</h2>
        <p className="text-gray-500 text-sm">{message}</p>
        <p className="text-gray-400 text-xs mt-3">Check your email for a confirmation with your QR code.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">👥</div>
          <h1 className="text-xl font-bold">Join Team</h1>
          <p className="text-sm text-gray-500 mt-1">You've been invited to join a team</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {status === 'error' && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Joining...' : 'Join Team'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">Invite code: {code?.toUpperCase()}</p>
      </div>
    </div>
  )
}

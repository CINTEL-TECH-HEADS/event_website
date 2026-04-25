// Owner: FE1 — Team Member Fields (Neon Cyberpunk UI)

'use client'

import { useState } from 'react'
import { PlusSquare, MinusSquare } from 'lucide-react'

type Member = {
  name: string
  email: string
}

export function TeamMemberFields({
  onChange
}: {
  onChange: (members: Member[]) => void
}) {
  const [members, setMembers] = useState<Member[]>([
    { name: '', email: '' }
  ])

  function emit(updated: Member[]) {
    setMembers(updated)
    onChange(updated)
  }

  function update(index: number, field: keyof Member, value: string) {
    const updated = members.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    )
    emit(updated)
  }

  function addMember() {
    emit([...members, { name: '', email: '' }])
  }

  function removeMember(index: number) {
    const updated = members.filter((_, i) => i !== index)
    // always keep at least one row
    emit(updated.length ? updated : [{ name: '', email: '' }])
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
           Auxiliary Units <span className="bg-white/10 text-white rounded px-1.5 py-0.5">{members.length}</span>
        </h3>

        <button
          type="button"
          onClick={addMember}
          className="text-[0.65rem] uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <PlusSquare size={14} /> Add Operative
        </button>
      </div>

      {/* Members Box */}
      <div className="space-y-3">
        {members.map((member, index) => (
          <div
            key={index}
            className="app-panel-muted rounded-xl p-4 space-y-4 border border-white/5 relative overflow-hidden"
          >
            {/* Visual Number Indicator */}
            <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-white/5 text-[0.6rem] font-bold text-slate-600 rounded-bl-xl border-l border-b border-white/5 pointer-events-none">
              #{index + 1}
            </div>

            {/* Row header */}
            <div className="flex items-center justify-between pointer-events-none">
              <p className="text-[0.65rem] font-bold text-cyan-500/70 uppercase tracking-widest">
                Unit {index + 1} Parameters
              </p>

              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-[0.65rem] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-400 flex items-center gap-1 transition-colors pointer-events-auto"
              >
                <MinusSquare size={12} /> Terminate
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {/* Name */}
              <input
                type="text"
                placeholder="Designator [Name]"
                value={member.name}
                onChange={(e) => update(index, 'name', e.target.value)}
                className="app-input text-sm py-2 px-3 bg-black/40 border-white/5 focus:border-cyan-500/50"
              />

              {/* Email */}
              <input
                type="email"
                placeholder="Commlink [Email]"
                value={member.email}
                onChange={(e) => update(index, 'email', e.target.value)}
                className="app-input text-sm py-2 px-3 bg-black/40 border-white/5 font-mono focus:border-cyan-500/50"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-[0.65rem] text-slate-500 tracking-wider">
        Ensure all squad operative parameters are valid prior to final transmission.
      </p>
    </div>
  )
}

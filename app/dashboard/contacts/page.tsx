// Owner: FE2 — organizer management for the public Contact Us directory.
'use client'

import { useEffect, useState } from 'react'
import { Contact as ContactIcon, Plus, Trash2, Save, X, Pencil } from 'lucide-react'

type Contact = {
  id: string
  name: string
  designation: string
  email: string | null
  phone: string | null
}

type Draft = { name: string; designation: string; email: string; phone: string }

const emptyDraft: Draft = { name: '', designation: '', email: '', phone: '' }

const inputClass =
  'w-full border border-[#243B72] bg-[#0B1736] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F5E62D]'

export default function ContactsAdminPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [newContact, setNewContact] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)

  async function load() {
    setLoading(true)
    try {
      const { data } = await fetch('/api/contacts').then((r) => r.json())
      setContacts((data ?? []) as Contact[])
    } catch {
      setError('Failed to load contacts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addContact() {
    if (!newContact.name.trim() || !newContact.designation.trim()) {
      setError('Name and designation are required.')
      return
    }
    setBusy(true)
    setError(null)
    const { error } = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact),
    }).then((r) => r.json())
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    setNewContact(emptyDraft)
    load()
  }

  function startEdit(c: Contact) {
    setEditingId(c.id)
    setEditDraft({
      name: c.name,
      designation: c.designation,
      email: c.email ?? '',
      phone: c.phone ?? '',
    })
  }

  async function saveEdit(id: string) {
    setBusy(true)
    setError(null)
    const { error } = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    }).then((r) => r.json())
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    setEditingId(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this contact?')) return
    setBusy(true)
    setError(null)
    const { error } = await fetch(`/api/contacts/${id}`, { method: 'DELETE' }).then((r) => r.json())
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    load()
  }

  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <ContactIcon size={14} />
          Contacts
        </span>
        <h1 className="mt-5 text-3xl font-bold text-white">Contact Us directory.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          These contacts appear on the public{' '}
          <a href="/contact" target="_blank" className="text-[#F5E62D] hover:underline">
            Contact Us
          </a>{' '}
          page. Add your team with their designation and how attendees can reach them.
        </p>
      </section>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Add form */}
      <section className="app-panel p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">Add a contact</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Name *"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Designation *"
            value={newContact.designation}
            onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Email"
            type="email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Phone"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
          />
        </div>
        <button
          onClick={addContact}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 border border-[#FFF27A] bg-[#F5E62D] px-5 py-2.5 text-sm font-bold text-[#0B1736] transition hover:bg-[#FFF27A] disabled:opacity-50"
        >
          <Plus size={16} />
          Add Contact
        </button>
      </section>

      {/* List */}
      <section className="app-panel p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">
          Current contacts ({contacts.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : contacts.length === 0 ? (
          <div className="border border-dashed border-[#243B72] bg-[#0B1736] p-8 text-center text-sm text-slate-400">
            No contacts yet. Add one above.
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) =>
              editingId === c.id ? (
                <div key={c.id} className="border border-[#F5E62D]/40 bg-[#0B1736] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      placeholder="Name *"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Designation *"
                      value={editDraft.designation}
                      onChange={(e) => setEditDraft({ ...editDraft, designation: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Email"
                      value={editDraft.email}
                      onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Phone"
                      value={editDraft.phone}
                      onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 border border-[#FFF27A] bg-[#F5E62D] px-4 py-2 text-sm font-bold text-[#0B1736] disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 border border-[#243B72] bg-[#10224A] px-4 py-2 text-sm font-semibold text-slate-300"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 border border-[#243B72] bg-[#10224A] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {c.name} <span className="text-sm font-normal text-amber-200">· {c.designation}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {[c.email, c.phone].filter(Boolean).join('  ·  ') || 'No contact details'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      aria-label="Edit"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#243B72] bg-[#0B1736] text-slate-300 transition hover:border-[#F5E62D] hover:text-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="Delete"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#243B72] bg-[#0B1736] text-slate-300 transition hover:border-red-500 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  )
}

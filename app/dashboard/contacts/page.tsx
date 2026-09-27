// Owner: FE2 — organizer management for the public Contact Us directory.
'use client'

import { useEffect, useState } from 'react'
import { Contact as ContactIcon, Plus, Trash2, Save, X, Pencil } from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

type Contact = {
  id: string
  name: string
  designation: string
  email: string | null
  phone: string | null
}

type Draft = { name: string; designation: string; email: string; phone: string }

const emptyDraft: Draft = { name: '', designation: '', email: '', phone: '' }

const inputClass = 'app-input'

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
      <DashboardPageHeader
        icon={ContactIcon}
        kicker="Contacts"
        title="Contact page directory"
        description={<>These people are listed on the public <a href="/contact" target="_blank" className="text-brand hover:underline">Contact</a> page. Add organizers with their designation and how attendees can reach them.</>}
      />

      {error && (
        <div className="rounded-xl border-2 border-l-8 border-border border-l-brand bg-brand-soft px-5 py-4 text-sm font-medium text-foreground">
          {error}
        </div>
      )}

      {/* Add form */}
      <section className="app-panel p-6 sm:p-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground-soft">Add a contact</h2>
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
          className="app-button-primary mt-4 disabled:opacity-50"
        >
          <Plus size={16} />
          Add Contact
        </button>
      </section>

      {/* List */}
      <section className="app-panel p-6 sm:p-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground-soft">
          Current contacts ({contacts.length})
        </h2>

        {loading ? (
          <p className="text-sm font-medium text-foreground-soft">Loading…</p>
        ) : contacts.length === 0 ? (
          <div className="app-empty-state">
            No contacts yet. Add one above.
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) =>
              editingId === c.id ? (
                <div key={c.id} className="rounded-xl border-2 border-brand bg-panel-muted p-4">
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
                      className="app-button-primary disabled:opacity-50"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="app-button-secondary"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-xl border-2 border-border bg-panel p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {c.name} <span className="text-sm font-medium text-foreground-soft">· {c.designation}</span>
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-foreground-soft">
                      {[c.email, c.phone].filter(Boolean).join('  ·  ') || 'No contact details'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      aria-label="Edit"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-panel text-foreground-soft shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:border-brand hover:text-foreground"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="Delete"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-panel text-foreground-soft shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:border-brand hover:text-brand"
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

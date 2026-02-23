/**
 * Run 7: Clients CRM — list, profiles, tags, notes, import/export
 * Growth tier required
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api, { API_BASE_URL } from '../../utils/api'
import Card from '../../components/shared/Card'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'
import { isFeatureUnlocked } from '../../config/tiers'
import { TIERS } from '../../config/tiers'
import UpgradeModal from '../../components/layout/UpgradeModal'

const TAG_COLORS = { vip: 'bg-amber-100 text-amber-800', regular: 'bg-green-100 text-green-800', 'walk-in': 'bg-gray-100 text-gray-600', new: 'bg-blue-100 text-blue-800' }
const SEGMENTS = ['all', 'new', 'returning', 'inactive', 'at_risk']
const SEGMENT_LABELS = { all: 'All', new: 'New', returning: 'Returning', inactive: 'Inactive', 'at_risk': 'At Risk' }
const SORT_OPTS = [
  { value: 'last_visit_desc', label: 'Last Visit' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'total_spent_desc', label: 'Total Spent' },
  { value: 'bookings_desc', label: 'Bookings' },
]

const Clients = () => {
  const { business, tier } = useBusiness()
  const navigate = useNavigate()
  const hasAccess = isFeatureUnlocked(tier, 'growth')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')
  const [segment, setSegment] = useState('all')
  const [sort, setSort] = useState('last_visit_desc')
  const [page, setPage] = useState(1)
  const [detailClient, setDetailClient] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchClients = useCallback(async () => {
    if (!(business?.id ?? business?._id) || !hasAccess) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20, sort, segment })
      if (searchDebounce) params.set('search', searchDebounce)
      const res = await api.get(`/clients-v2/business/${(business?.id ?? business?._id)}?${params}`)
      setData(res)
    } catch (err) {
      setData({ clients: [], pagination: { total: 0, pages: 0 }, segments: {} })
    } finally {
      setLoading(false)
    }
  }, [business?.id ?? business?._id, hasAccess, page, segment, sort, searchDebounce])

  useEffect(() => {
    if (hasAccess) fetchClients()
    else setLoading(false)
  }, [fetchClients, hasAccess])

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const r = await fetch(`${API_BASE_URL}/clients-v2/business/${(business?.id ?? business?._id)}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'clients.csv'
      a.click()
    } catch (err) {
      alert(err.message || 'Export failed')
    }
  }


  if (!hasAccess) {
    return (
      <div>
        <h1 className="text-3xl font-heading font-bold mb-8">Clients</h1>
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#F3F0E8] flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-lock text-2xl text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-primary mb-2">Unlock your client database</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">Upgrade to Growth to search, filter, view profiles, and manage visit history.</p>
            <Button variant="primary" onClick={() => setUpgradeModal(true)}>Upgrade to Growth</Button>
          </div>
        </Card>
        {upgradeModal && (
          <UpgradeModal tierName={TIERS.growth?.label || 'Growth'} onClose={() => setUpgradeModal(false)} onViewPlans={() => setUpgradeModal(false)} />
        )}
      </div>
    )
  }

  const total = data?.pagination?.total ?? 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">Clients</h1>
          <p className="text-muted">{total} clients</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-64"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-40">
            {SORT_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button variant="primary" onClick={() => setAddModal(true)}>Add Client</Button>
          <Button variant="secondary" onClick={handleExport}>Export</Button>
          <input type="file" id="import-csv" accept=".csv" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) {
              try {
                const fd = new FormData()
                fd.append('file', f)
                const token = localStorage.getItem('token')
                const r = await fetch(`${API_BASE_URL}/clients-v2/business/${(business?.id ?? business?._id)}/import`, {
                  method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
                })
                const res = await r.json()
                alert(`Imported: ${res.imported}, Duplicates: ${res.duplicates}, Errors: ${res.errors}`)
                fetchClients()
              } catch (err) { alert(err.message) }
              e.target.value = ''
            }
          }} />
          <Button variant="secondary" onClick={() => document.getElementById('import-csv')?.click()}>Import</Button>
        </div>
      </div>

      {/* Segment tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {SEGMENTS.map((s) => (
          <button
            key={s}
            onClick={() => { setSegment(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${segment === s ? 'bg-primary text-white' : 'bg-border text-muted hover:bg-border/80'}`}
          >
            {SEGMENT_LABELS[s]} ({data?.segments?.[s] ?? 0})
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Phone</th>
                <th className="text-left py-3 px-4 font-semibold">Tags</th>
                <th className="text-left py-3 px-4 font-semibold">Bookings</th>
                <th className="text-left py-3 px-4 font-semibold">Total Spent</th>
                <th className="text-left py-3 px-4 font-semibold">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted">Loading...</td></tr>
              ) : !data?.clients?.length ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted">No clients yet</td></tr>
              ) : (
                data.clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetailClient(c.id)}
                    className="border-b border-border hover:bg-primary/5 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                          {(c.name || '?')[0].toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted">{c.email || '—'}</td>
                    <td className="py-3 px-4 text-muted">{c.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {(c.tags || []).map((t) => (
                          <span key={t} className={`px-2 py-0.5 rounded text-xs ${TAG_COLORS[t] || 'bg-primary/20 text-primary'}`}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">{c.totalBookings ?? 0}</td>
                    <td className="py-3 px-4">£{((c.totalSpent ?? 0) / 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-muted">{c.lastVisit || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination?.pages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-border">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded disabled:opacity-50">Prev</button>
            <span className="py-1">Page {page} of {data.pagination.pages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.pages} className="px-3 py-1 rounded disabled:opacity-50">Next</button>
          </div>
        )}
      </Card>

      {detailClient && (
        <ClientDetailPanel
          businessId={business?.id ?? business?._id}
          clientId={detailClient}
          onClose={() => setDetailClient(null)}
          onRefresh={fetchClients}
        />
      )}

      {addModal && (
        <AddClientModal
          businessId={business?.id ?? business?._id}
          onClose={() => setAddModal(false)}
          onSaved={() => { setAddModal(false); fetchClients() }}
          onViewClient={(id) => { setAddModal(false); setDetailClient(id) }}
        />
      )}
    </div>
  )
}

const ClientDetailPanel = ({ businessId, clientId, onClose, onRefresh }) => {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!businessId || !clientId) return
    api.get(`/clients-v2/business/${businessId}/${clientId}`).then((r) => {
      setClient(r.client)
    }).catch(() => onClose()).finally(() => setLoading(false))
  }, [businessId, clientId])

  const handleAddNote = async () => {
    if (!noteText.trim() || !businessId || !clientId) return
    setSaving(true)
    try {
      await api.post(`/clients-v2/business/${businessId}/${clientId}/notes`, { text: noteText.trim() })
      const r = await api.get(`/clients-v2/business/${businessId}/${clientId}`)
      setClient(r.client)
      setNoteText('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/clients-v2/business/${businessId}/${clientId}/notes/${noteId}`)
      setClient((c) => ({ ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) }))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAddTag = async (tag) => {
    try {
      await api.post(`/clients-v2/business/${businessId}/${clientId}/tags`, { tags: [tag] })
      setClient((c) => ({ ...c, tags: [...(c.tags || []), tag] }))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remove this client? They will be hidden from the list.')) return
    try {
      await api.delete(`/clients-v2/business/${businessId}/${clientId}`)
      onClose()
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading || !client) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-[400px] bg-white shadow-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  const stats = client.stats || {}

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[400px] bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-heading font-bold">{client.name}</h2>
            {client.email && <a href={`mailto:${client.email}`} className="text-sm text-primary block">{client.email}</a>}
            {client.phone && <a href={`tel:${client.phone}`} className="text-sm text-primary block">{client.phone}</a>}
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-primary"><i className="fa-solid fa-times" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-2 flex-wrap items-center">
            {(client.tags || []).map((t) => (
              <span key={t} className={`px-2 py-0.5 rounded text-xs ${TAG_COLORS[t] || 'bg-primary/20 text-primary'}`}>{t}</span>
            ))}
            <Button size="sm" variant="secondary" onClick={() => navigate(`/dashboard/bookings?customer=${client.email}`)}>Book Now</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background"><p className="text-xs text-muted">Total Bookings</p><p className="font-semibold">{stats.totalBookings ?? 0}</p></div>
            <div className="p-3 rounded-lg bg-background"><p className="text-xs text-muted">Total Spent</p><p className="font-semibold">£{((stats.totalSpent ?? 0) / 100).toFixed(2)}</p></div>
            <div className="p-3 rounded-lg bg-background"><p className="text-xs text-muted">Avg Spend</p><p className="font-semibold">£{((stats.averageSpend ?? 0) / 100).toFixed(2)}</p></div>
            <div className="p-3 rounded-lg bg-background"><p className="text-xs text-muted">Last Visit</p><p className="font-semibold">{stats.lastVisit || '—'}</p></div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Booking History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(client.bookings || []).map((b) => (
                <div key={b.id} className="flex justify-between items-center p-2 rounded bg-background">
                  <div>
                    <p className="font-medium text-sm">{b.date} {b.time}</p>
                    <p className="text-xs text-muted">{b.service} · {b.staff}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>{b.status}</span>
                    <p className="text-sm font-medium">£{(b.amount / 100).toFixed(2)}</p>
                  </div>
                  <button onClick={() => navigate(`/dashboard/bookings?booking=${b.id}`)} className="text-primary text-xs">View</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Notes</h3>
            <div className="space-y-2 mb-4">
              {(client.notes || []).map((n) => (
                <div key={n.id} className="p-3 rounded bg-background text-sm">
                  <p>{n.text}</p>
                  <p className="text-xs text-muted mt-1">{n.createdBy} · {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</p>
                  <button onClick={() => handleDeleteNote(n.id)} className="text-red text-xs mt-1">Delete</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="input flex-1"
              />
              <Button size="sm" onClick={handleAddNote} disabled={saving}>Add</Button>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate(`/dashboard/bookings?customer=${client.email}`)}>Book Now</Button>
            <button onClick={handleDelete} className="text-red text-sm hover:underline">Delete Client</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AddClientModal = ({ businessId, onClose, onSaved, onViewClient }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', tags: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [warning, setWarning] = useState(null)
  const [existingId, setExistingId] = useState(null)

  const handleSubmit = async () => {
    const name = form.name.trim()
    if (name.length < 2) {
      alert('Name must be at least 2 characters')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      alert('Provide at least email or phone')
      return
    }
    setSaving(true)
    setWarning(null)
    setExistingId(null)
    try {
      const res = await api.post(`/clients-v2/business/${businessId}`, {
        name,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes: form.notes.trim() || undefined,
      })
      if (res.warning && res.existingId) {
        setWarning(res.warning)
        setExistingId(res.existingId)
        setSaving(false)
      } else {
        onSaved()
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-lg mb-4">Add Client</h3>
        {warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-amber-800 text-sm">{warning}</p>
            {existingId && onViewClient && (
              <button onClick={() => { onClose(); onViewClient(existingId) }} className="text-primary text-sm mt-2 font-medium hover:underline">View profile</button>
            )}
          </div>
        )}
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Required" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input w-full" rows={3} />
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

export default Clients

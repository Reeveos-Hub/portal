import AppLoader from "../../components/shared/AppLoader"
/**
 * Operators Management — Owner-only page for managing self-employed operators.
 * Lists operators, invite flow, commission tracking.
 */

import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

// Monochrome SVG icons
const PlusIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const UserIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const MailIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const PhoneIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const CopyIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const XIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const STATUS_COLORS = {
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  invited: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  paused: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  removed: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

const Operators = () => {
  const { business } = useBusiness()
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', commission_rate: 30 })
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const bid = business?.id ?? business?._id

  const fetchOperators = useCallback(async () => {
    if (!bid) { setLoading(false); return }
    try {
      const res = await api.get(`/operators/business/${bid}`)
      setOperators(res.operators || [])
    } catch (e) { console.error('Failed to load operators:', e) }
    finally { setLoading(false) }
  }, [bid])

  useEffect(() => { fetchOperators() }, [fetchOperators])

  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return
    setInviting(true)
    try {
      const res = await api.post(`/operators/business/${bid}/invite`, inviteForm)
      setInviteResult(res)
      setOperators(prev => [...prev, res])
      setInviteForm({ name: '', email: '', phone: '', commission_rate: 30 })
      setToast(`Invite sent to ${inviteForm.name}`)
      setTimeout(() => setToast(null), 4000)
    } catch (e) {
      setToast(e.response?.data?.detail || e.message || 'Failed to send invite')
      setTimeout(() => setToast(null), 4000)
    }
    finally { setInviting(false) }
  }

  const handleRemove = async (opId, name) => {
    if (!confirm(`Remove ${name}? Their data will be preserved but they'll lose access.`)) return
    try {
      await api.delete(`/operators/business/${bid}/${opId}`)
      setOperators(prev => prev.map(o => o.id === opId ? { ...o, status: 'removed' } : o))
      setToast(`${name} removed`)
      setTimeout(() => setToast(null), 4000)
    } catch (e) { alert(e.message || 'Failed') }
  }

  const filtered = operators.filter(o => filter === 'all' || o.status === filter)

  if (loading) return <AppLoader message="Loading operators..." />

  if (!business?.mothership_mode) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h2 className="font-heading font-bold text-xl text-primary mb-2">Self-Employed Mode not enabled</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">Enable Self-Employed Mode in Settings to start managing operators, tracking commissions, and splitting payments.</p>
        <a href="/dashboard/settings" className="text-sm font-bold text-white bg-primary px-6 py-2.5 rounded-lg hover:bg-primary-hover transition-colors shadow-md">
          Go to Settings
        </a>
      </div>
    )
  }

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-4rem)]" style={{ fontFamily: "'Figtree',sans-serif" }}>
      {/* Header */}
      <div className="px-6 md:px-8 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-primary">Operators</h1>
            <p className="text-sm text-gray-500 mt-0.5">{operators.filter(o => o.status === 'active').length} active · {operators.filter(o => o.status === 'invited').length} pending</p>
          </div>
          <button onClick={() => { setShowInvite(true); setInviteResult(null) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-md">
            <PlusIcon /> Invite Operator
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {['all', 'active', 'invited', 'paused', 'removed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
              {f === 'all' ? `All (${operators.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${operators.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon />
            </div>
            <h3 className="font-bold text-lg text-primary mb-2">No operators yet</h3>
            <p className="text-sm text-gray-500 mb-6">Invite your first self-employed team member to get started.</p>
            <button onClick={() => setShowInvite(true)}
              className="text-sm font-bold text-white bg-primary px-6 py-2.5 rounded-lg hover:bg-primary-hover shadow-md">
              Invite Operator
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(op => {
              const sc = STATUS_COLORS[op.status] || STATUS_COLORS.active
              return (
                <div key={op.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-bold text-sm shrink-0">
                    {(op.name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary truncate">{op.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                        {op.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {op.email && <span className="flex items-center gap-1 truncate"><MailIcon /> {op.email}</span>}
                      {op.phone && <span className="flex items-center gap-1"><PhoneIcon /> {op.phone}</span>}
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-primary">
                      {op.commission_type === 'fixed' ? `£${op.chair_rental || 0}/wk` : `${op.commission_rate || 30}%`}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {op.commission_type === 'fixed' ? 'chair rental' : 'commission'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {op.status === 'invited' && op.invite_link && (
                      <button onClick={() => { navigator.clipboard.writeText(op.invite_link); setToast('Invite link copied'); setTimeout(() => setToast(null), 3000) }}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30" title="Copy invite link">
                        <CopyIcon />
                      </button>
                    )}
                    {op.status !== 'removed' && (
                      <button onClick={() => handleRemove(op.id, op.name)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200" title="Remove">
                        <XIcon />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInvite(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-[440px] max-w-[90vw] overflow-hidden" style={{ fontFamily: "'Figtree',sans-serif" }}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">Invite Operator</h2>
                <p className="text-xs text-gray-400 mt-0.5">They'll receive an email with a one-time invite link.</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><XIcon /></button>
            </div>

            {inviteResult ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="font-bold text-primary mb-1">Invite sent</h3>
                <p className="text-sm text-gray-500 mb-4">{inviteResult.name} will receive an email with their invite link. It expires in 7 days.</p>
                {inviteResult.invite_link && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 break-all border border-gray-100 mb-4">{inviteResult.invite_link}</div>
                )}
                <div className="flex gap-3">
                  {inviteResult.invite_link && (
                    <button onClick={() => { navigator.clipboard.writeText(inviteResult.invite_link); setToast('Copied'); setTimeout(() => setToast(null), 3000) }}
                      className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-primary hover:bg-gray-50">Copy Link</button>
                  )}
                  <button onClick={() => { setShowInvite(false); setInviteResult(null) }}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover">Done</button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Grace Thompson"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-primary outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="grace@email.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-primary outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">Phone</label>
                  <input value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="07700 900000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-primary outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">Commission Rate (%)</label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20, 25, 30, 35, 40].map(r => (
                      <button key={r} onClick={() => setInviteForm(f => ({ ...f, commission_rate: r }))}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${inviteForm.commission_rate === r ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'}`}>
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowInvite(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-primary hover:bg-gray-50">Cancel</button>
                  <button onClick={handleInvite} disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-md disabled:opacity-50">
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-primary text-white rounded-xl shadow-xl text-sm font-semibold animate-slide-up"
          style={{ fontFamily: "'Figtree',sans-serif" }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default Operators

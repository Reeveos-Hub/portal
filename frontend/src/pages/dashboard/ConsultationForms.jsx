/**
 * Consultation Forms — Dashboard management page
 * Salon/local services only. Shows submissions, stats, review tools, distribution.
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import { ClipboardCheck, Eye, ExternalLink, Copy, Check, AlertTriangle, ShieldX, RefreshCw, Search, Filter, ChevronDown, QrCode, Mail, MessageSquare, Link2 } from 'lucide-react'

const API = '/api'

const fetchApi = async (path, opts = {}) => {
  const token = sessionStorage.getItem('reeveos_admin_token') || sessionStorage.getItem('rezvo_token') || localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(`${API}${path}`, { ...opts, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const gold = '#C9A84C'
const black = '#111111'

const StatusBadge = ({ status }) => {
  const map = {
    clear: { bg: '#ecfdf5', color: '#059669', label: 'Clear' },
    flagged: { bg: '#fff7ed', color: '#ea580c', label: 'Flagged' },
    blocked: { bg: '#fef2f2', color: '#dc2626', label: 'Blocked' },
    expired: { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
  }
  const s = map[status] || map.clear
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: s.bg, color: s.color }}>{s.label}</span>
}

export default function ConsultationForms() {
  const { business } = useBusiness()
  const bizId = business?._id || business?.id || ''
  const [stats, setStats] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('submissions')
  const [copied, setCopied] = useState(false)
  const [selectedSub, setSelectedSub] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  const slug = business?.slug || ''
  const portalUrl = `${window.location.origin}/client/${slug}`

  const load = useCallback(async () => {
    if (!bizId) return
    setLoading(true)
    try {
      const [s, sub] = await Promise.all([
        fetchApi(`/consultation/business/${bizId}/stats`),
        fetchApi(`/consultation/business/${bizId}/submissions${filter ? `?status=${filter}` : ''}`),
      ])
      setStats(s)
      setSubmissions(sub.submissions || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [bizId, filter])

  useEffect(() => { load() }, [load])

  const copyLink = () => {
    navigator.clipboard?.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reviewSubmission = async (subId, overrideStatus) => {
    try {
      await fetchApi(`/consultation/business/${bizId}/submissions/${subId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          notes: reviewNote,
          reviewed_by: 'therapist',
          ...(overrideStatus ? { override_status: overrideStatus, override_reason: reviewNote } : {}),
        }),
      })
      setSelectedSub(null)
      setReviewNote('')
      load()
    } catch (e) {
      console.error(e)
    }
  }

  const card = { background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: 16 }
  const tabBtn = (active) => ({
    padding: '8px 16px', borderRadius: 999, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
    background: active ? black : 'transparent', color: active ? gold : '#6b7280',
  })

  return (
    <div data-tour="consultation-forms" style={{ fontFamily: "'Figtree', sans-serif", padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: black, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={20} color={gold} />
            Consultation Forms
          </h1>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Manage client health questionnaires and contraindication screening</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} color="#6b7280" /><span style={{ fontSize: 11, color: '#6b7280' }}>Refresh</span>
          </button>
          <button onClick={() => window.open(portalUrl, '_blank')} style={{ padding: '8px 12px', borderRadius: 999, border: 'none', background: gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={12} color={black} /><span style={{ fontSize: 11, fontWeight: 600, color: black }}>Preview Portal</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Submissions', value: stats?.total_submissions ?? '—', sub: stats ? `+${stats.this_week} this week` : '', color: gold },
          { label: 'Pending Review', value: stats?.pending_review ?? '—', sub: stats?.pending_review > 0 ? 'Action needed' : 'All clear', color: '#ea580c' },
          { label: 'Blocked Treatments', value: stats?.blocked_treatments ?? '—', sub: 'Auto-flagged', color: '#dc2626' },
          { label: 'Expiring Soon', value: stats?.expiring_soon ?? '—', sub: 'Next 30 days', color: '#6b7280' },
        ].map((s, i) => (
          <div key={i} style={card}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: black, margin: '4px 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 10, color: s.color, margin: 0, fontWeight: 600 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button onClick={() => setTab('submissions')} style={tabBtn(tab === 'submissions')}>Submissions</button>
        <button onClick={() => setTab('distribution')} style={tabBtn(tab === 'distribution')}>Distribution</button>
      </div>

      {/* ═══ SUBMISSIONS TAB ═══ */}
      {tab === 'submissions' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['', 'clear', 'flagged', 'blocked'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 600, border: filter === f ? `2px solid ${gold}` : '2px solid #e5e7eb', background: filter === f ? gold + '10' : '#fff', color: filter === f ? gold : '#6b7280', cursor: 'pointer' }}>
                {f || 'All'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr 0.5fr', padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
              {['Client', 'Submitted', 'Expires', 'Treatment Flags', 'Status', ''].map((h, i) => (
                <p key={i} style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', margin: 0 }}>{h}</p>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}><p style={{ fontSize: 11, color: '#9ca3af' }}>Loading...</p></div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <ClipboardCheck size={32} color="#e5e7eb" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>No submissions yet</p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>Share your form link to start receiving consultation forms</p>
              </div>
            ) : submissions.map((sub, i) => {
              const submitted = new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              const expires = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'
              const blockCount = (sub.alerts?.blocks || []).length
              const flagCount = (sub.alerts?.flags || []).length

              return (
                <div key={sub._id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1.2fr 1fr 0.5fr', padding: '10px 16px', borderBottom: '1px solid #fafafa', alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedSub(sub)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: sub.status === 'clear' ? '#22c55e' : sub.status === 'flagged' ? '#ea580c' : sub.status === 'blocked' ? '#dc2626' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(sub.client_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: 0 }}>{sub.client_name}</p>
                      <p style={{ fontSize: 9, color: '#9ca3af', margin: 0 }}>{sub.client_email}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{submitted}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{expires}</p>
                  <div>
                    {blockCount > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#dc2626', marginRight: 6 }}>{blockCount} blocked</span>}
                    {flagCount > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: '#ea580c' }}>{flagCount} flagged</span>}
                    {blockCount === 0 && flagCount === 0 && <span style={{ fontSize: 9, color: '#9ca3af' }}>None</span>}
                  </div>
                  <StatusBadge status={sub.status} />
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Eye size={14} color="#9ca3af" /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ DISTRIBUTION TAB ═══ */}
      {tab === 'distribution' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Direct Link */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Link2 size={14} color={gold} /></div>
              <div><p style={{ fontSize: 12, fontWeight: 700, color: black, margin: 0 }}>Client Portal Link</p><p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Share anywhere — social, website, WhatsApp</p></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={portalUrl} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 10, color: '#6b7280', background: '#f9fafb' }} />
              <button onClick={copyLink} style={{ padding: '8px 12px', borderRadius: 999, background: copied ? '#22c55e' : gold + '15', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {copied ? <Check size={12} color="#fff" /> : <Copy size={12} color={gold} />}
                <span style={{ fontSize: 10, fontWeight: 600, color: copied ? '#fff' : gold }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* SMS */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={14} color={gold} /></div>
              <div><p style={{ fontSize: 12, fontWeight: 700, color: black, margin: 0 }}>SMS Link</p><p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Text clients the portal link</p></div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                Hi [Name], please complete your consultation form before your appointment at {business?.name}: <span style={{ color: gold, fontWeight: 600 }}>{portalUrl}</span>
              </p>
            </div>
            <p style={{ fontSize: 9, color: '#9ca3af', marginTop: 6 }}>~1 SMS (under 160 chars)</p>
          </div>

          {/* Auto Email */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={14} color={gold} /></div>
              <div><p style={{ fontSize: 12, fontWeight: 700, color: black, margin: 0 }}>Automated Email</p><p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Auto-send when clients book</p></div>
            </div>
            {[
              { label: 'Send on new booking', on: true },
              { label: 'Reminder if not done (24hr before)', on: true },
              { label: 'Re-send on form expiry (6 months)', on: false },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.on ? '#22c55e' : '#d1d5db' }} />
                  <span style={{ fontSize: 10, color: '#374151' }}>{r.label}</span>
                </div>
                <div style={{ width: 32, height: 16, borderRadius: 999, background: r.on ? gold : '#e5e7eb', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, [r.on ? 'right' : 'left']: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Onboarding Flow */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardCheck size={14} color={gold} /></div>
              <div><p style={{ fontSize: 12, fontWeight: 700, color: black, margin: 0 }}>Client Onboarding Flow</p><p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Automatic routing based on form status</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { n: '1', t: 'Client books', d: 'Via link, social, or walk-in' },
                { n: '2', t: 'System checks', d: 'Form exists? Valid? Expired?' },
                { n: '3', t: 'Auto-routes', d: 'New → fill. Expired → re-sign' },
                { n: '4', t: 'Therapist reviews', d: 'Dashboard shows flags/blocks' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: '#f9fafb' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 10, fontWeight: 700, color: black }}>{s.n}</div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', margin: 0 }}>{s.t}</p>
                  <p style={{ fontSize: 9, color: '#9ca3af', margin: '2px 0 0' }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUBMISSION DETAIL MODAL ═══ */}
      {selectedSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setSelectedSub(null)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: black, margin: 0 }}>{selectedSub.client_name}</h2>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{selectedSub.client_email}</p>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            {/* Alerts */}
            {(selectedSub.alerts?.blocks?.length > 0 || selectedSub.alerts?.flags?.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                {selectedSub.alerts.blocks.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fef2f2', borderRadius: 8, marginBottom: 4 }}>
                    <ShieldX size={12} color="#dc2626" />
                    <span style={{ fontSize: 10, color: '#dc2626' }}><strong>{b.label}</strong> blocked — {b.condition}</span>
                  </div>
                ))}
                {selectedSub.alerts.flags.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff7ed', borderRadius: 8, marginBottom: 4 }}>
                    <AlertTriangle size={12} color="#ea580c" />
                    <span style={{ fontSize: 10, color: '#ea580c' }}><strong>{f.label}</strong> flagged — {f.condition}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Form data summary */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: black, marginBottom: 8 }}>Form Answers</p>
              {Object.entries(selectedSub.form_data || {}).filter(([k]) => !k.startsWith('consent') && !k.startsWith('auth') && k !== 'signed').map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: v === 'yes' ? '#dc2626' : v === 'no' ? '#059669' : '#374151' }}>
                    {Array.isArray(v) ? v.join(', ') : String(v)}
                  </span>
                </div>
              ))}
            </div>

            {/* Therapist review */}
            {!selectedSub.reviewed && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Therapist Notes</label>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add notes about this client's form..."
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11, resize: 'vertical', minHeight: 60, outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => reviewSubmission(selectedSub._id)} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', background: gold, color: black, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Mark Reviewed</button>
                  {selectedSub.status === 'flagged' && (
                    <button onClick={() => reviewSubmission(selectedSub._id, 'clear')} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: '2px solid #22c55e', background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Override → Clear</button>
                  )}
                </div>
              </div>
            )}
            {selectedSub.reviewed && (
              <div style={{ padding: 12, background: '#ecfdf5', borderRadius: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#059669', margin: 0 }}>Reviewed by {selectedSub.reviewed_by} on {new Date(selectedSub.reviewed_at).toLocaleDateString('en-GB')}</p>
                {selectedSub.therapist_notes && <p style={{ fontSize: 10, color: '#374151', margin: '4px 0 0' }}>{selectedSub.therapist_notes}</p>}
              </div>
            )}

            <button onClick={() => setSelectedSub(null)} style={{ width: '100%', padding: '10px 0', borderRadius: 999, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

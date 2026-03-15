import { useState, useEffect, useCallback, useRef } from 'react'
import adminFetch from '../../utils/adminFetch'

const API = import.meta.env.VITE_API_URL || '/api'

// Thin wrapper around adminFetch that matches the api.get/post/delete pattern
const adminApi = {
  async get(path) {
    const r = await adminFetch(`${API}${path}`)
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`) }
    return r.json()
  },
  async post(path, data) {
    const r = await adminFetch(`${API}${path}`, { method: 'POST', body: JSON.stringify(data) })
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`) }
    return r.json()
  },
  async delete(path) {
    const r = await adminFetch(`${API}${path}`, { method: 'DELETE' })
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${r.status}`) }
    return r.json()
  },
}

const GOLD = '#C9A84C'
const BG = '#111111'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const TEXT = '#e8e8e8'
const MUTED = '#777'
const FIG = "'Figtree', system-ui, sans-serif"

const PLATFORMS = [
  { id: 'fresha', label: 'Fresha', color: '#00b67a' },
  { id: 'treatwell', label: 'Treatwell', color: '#6c47ff' },
  { id: 'booksy', label: 'Booksy', color: '#1B5299' },
  { id: 'vagaro', label: 'Vagaro', color: '#f4760b' },
]

const VERTICALS = [
  'beauty', 'salon', 'hair', 'barber', 'aesthetics',
  'nail', 'massage', 'spa', 'gym', 'lash', 'brow',
]

const UK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol',
  'Sheffield', 'Liverpool', 'Nottingham', 'Leicester', 'Coventry',
  'Bradford', 'Edinburgh', 'Glasgow', 'Cardiff', 'Newcastle',
  'Brighton', 'Southampton', 'Derby', 'Oxford', 'Cambridge',
]

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'discover', label: 'Discover' },
  { id: 'leads', label: 'Leads' },
  { id: 'jobs', label: 'Jobs' },
]

const STATUS_STYLES = {
  new:             { bg: '#1a2e1a', text: '#4ade80', label: 'New' },
  contacted:       { bg: '#1a2540', text: '#60a5fa', label: 'Contacted' },
  interested:      { bg: '#2e2010', text: '#fb923c', label: 'Interested' },
  converted:       { bg: '#2e1a2e', text: '#c084fc', label: 'Converted' },
  outreach_queued: { bg: '#1a2540', text: '#38bdf8', label: 'Queued' },
  dead:            { bg: '#1a1a1a', text: '#6b7280', label: 'Dead' },
}

const JOB_STATUS_STYLES = {
  queued:    { bg: '#1a2540', text: '#60a5fa', label: 'Queued' },
  running:   { bg: '#2e2010', text: '#fbbf24', label: 'Running' },
  completed: { bg: '#1a2e1a', text: '#4ade80', label: 'Done' },
  failed:    { bg: '#2e1010', text: '#f87171', label: 'Failed' },
  cancelled: { bg: '#1a1a1a', text: '#6b7280', label: 'Cancelled' },
}

// ─── Icons (monochrome SVGs) ───────────────────────────────────────

const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)
const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
)
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)


// ─── Helpers ──────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '18px 20px', fontFamily: FIG }}>
      <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ color: color || TEXT, fontSize: 26, fontWeight: 700 }}>{value ?? '—'}</div>
      {sub && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Badge({ status, type = 'lead' }) {
  const map = type === 'job' ? JOB_STATUS_STYLES : STATUS_STYLES
  const s = map[status] || { bg: '#1a1a1a', text: '#777', label: status }
  return (
    <span style={{ background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: FIG }}>
      {s.label}
    </span>
  )
}


// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function GrowthHub() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // Discover state
  const [platform, setPlatform] = useState('fresha')
  const [city, setCity] = useState('London')
  const [vertical, setVertical] = useState('beauty')
  const [maxLeads, setMaxLeads] = useState(200)
  const [running, setRunning] = useState(false)
  const [activeJob, setActiveJob] = useState(null)
  const pollRef = useRef(null)
  const [jobError, setJobError] = useState(null)

  // Leads state
  const [leads, setLeads] = useState([])
  const [leadsTotal, setLeadsTotal] = useState(0)
  const [leadsPage, setLeadsPage] = useState(0)
  const [leadsFilter, setLeadsFilter] = useState({ search: '', source: '', status: '', city: '' })
  const [selectedLeads, setSelectedLeads] = useState(new Set())
  const [selectedLead, setSelectedLead] = useState(null)
  const [leadsLoading, setLeadsLoading] = useState(false)

  // Jobs state
  const [jobs, setJobs] = useState([])
  const [jobsTotal, setJobsTotal] = useState(0)

  const LIMIT = 50

  // ── Data loading ──────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      const data = await adminApi.get('/scraper/stats')
      setStats(data)
    } catch (e) {
      console.error('Stats error:', e)
    }
  }, [])

  const loadLeads = useCallback(async (page = 0, filters = leadsFilter) => {
    setLeadsLoading(true)
    try {
      const params = new URLSearchParams({ skip: page * LIMIT, limit: LIMIT })
      if (filters.search)  params.set('search', filters.search)
      if (filters.source)  params.set('source', filters.source)
      if (filters.status)  params.set('status', filters.status)
      if (filters.city)    params.set('city', filters.city)
      const data = await adminApi.get(`/scraper/leads?${params}`)
      setLeads(data.leads || [])
      setLeadsTotal(data.total || 0)
    } catch (e) {
      console.error('Leads error:', e)
    } finally {
      setLeadsLoading(false)
    }
  }, [leadsFilter])

  const loadJobs = useCallback(async () => {
    try {
      const data = await adminApi.get('/scraper/jobs?limit=30')
      setJobs(data.jobs || [])
      setJobsTotal(data.total || 0)
    } catch (e) {
      console.error('Jobs error:', e)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadStats()
      if (tab === 'leads') await loadLeads()
      if (tab === 'jobs') await loadJobs()
      setLoading(false)
    }
    init()
  }, [tab])

  // ── Job polling ───────────────────────────────────────────────

  const startPoll = useCallback((jobId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const job = await adminApi.get(`/scraper/jobs/${jobId}`)
        setActiveJob(job)
        if (!['queued', 'running'].includes(job.status)) {
          clearInterval(pollRef.current)
          setRunning(false)
          loadStats()
          if (tab === 'leads') loadLeads()
          if (tab === 'jobs') loadJobs()
        }
      } catch (e) {
        clearInterval(pollRef.current)
        setRunning(false)
      }
    }, 2500)
  }, [tab, loadLeads, loadJobs, loadStats])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── Actions ───────────────────────────────────────────────────

  async function startDiscovery() {
    setRunning(true)
    setJobError(null)
    // Show immediate placeholder so user sees something happened
    setActiveJob({
      job_id: null,
      platform,
      city,
      vertical,
      max_leads: maxLeads,
      status: 'queued',
      progress: { pages_scraped: 0, leads_found: 0, leads_added: 0, duplicates: 0 },
    })
    try {
      const res = await adminApi.post('/scraper/jobs', { platform, city, vertical, max_leads: maxLeads })
      if (!res || !res.job_id) {
        throw new Error('No job ID returned from server')
      }
      setActiveJob(prev => ({ ...prev, job_id: res.job_id, status: 'queued' }))
      startPoll(res.job_id)
    } catch (e) {
      console.error('Start job error:', e)
      setJobError(e?.message || 'Failed to start discovery. Check the Jobs tab for details.')
      setRunning(false)
      setActiveJob(null)
    }
  }

  async function cancelJob(jobId) {
    try {
      await adminApi.delete(`/scraper/jobs/${jobId}`)
      setRunning(false)
      if (pollRef.current) clearInterval(pollRef.current)
      loadJobs()
    } catch (e) {
      console.error('Cancel error:', e)
    }
  }

  async function enrichLead(leadId) {
    try {
      await adminApi.post(`/scraper/leads/${leadId}/enrich`)
      setTimeout(() => loadLeads(leadsPage), 3000)
    } catch (e) {
      alert(e.message || 'Enrichment failed')
    }
  }

  async function deleteLead(leadId) {
    if (!confirm('Delete this lead?')) return
    try {
      await adminApi.delete(`/scraper/leads/${leadId}`)
      loadLeads(leadsPage)
      loadStats()
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  async function bulkDelete() {
    if (!selectedLeads.size || !confirm(`Delete ${selectedLeads.size} leads?`)) return
    try {
      await adminApi.post('/scraper/leads/bulk-delete', { lead_ids: [...selectedLeads] })
      setSelectedLeads(new Set())
      loadLeads(leadsPage)
      loadStats()
    } catch (e) {
      console.error('Bulk delete error:', e)
    }
  }

  async function bulkEnrich() {
    if (!selectedLeads.size) return
    try {
      await adminApi.post('/scraper/leads/bulk-enrich', { lead_ids: [...selectedLeads] })
      setSelectedLeads(new Set())
      setTimeout(() => loadLeads(leadsPage), 4000)
    } catch (e) {
      console.error('Bulk enrich error:', e)
    }
  }

  function toggleLead(id) {
    const s = new Set(selectedLeads)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedLeads(s)
  }

  function toggleAll() {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(leads.map(l => l._id)))
    }
  }

  // ── Lead Detail Panel ────────────────────────────────────────

  function renderLeadPanel() {
    const lead = selectedLead
    if (!lead) return null
    const plat = PLATFORMS.find(p => lead.source?.startsWith(p.id))
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={() => setSelectedLead(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, backdropFilter: 'blur(2px)',
          }}
        />
        {/* Panel */}
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
          background: '#161616', borderLeft: `1px solid #2a2a2a`,
          zIndex: 1001, overflowY: 'auto', fontFamily: FIG,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid #2a2a2a`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{lead.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: plat?.color || GOLD, fontWeight: 600, fontSize: 12 }}>{lead.current_platform}</span>
                <span style={{ color: MUTED, fontSize: 12 }}>·</span>
                <span style={{ color: MUTED, fontSize: 12 }}>{lead.city}</span>
                <span style={{ color: MUTED, fontSize: 12 }}>·</span>
                <span style={{ color: MUTED, fontSize: 12 }}>{lead.vertical}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
            >×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', flex: 1 }}>

            {/* Status + Rating row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <Badge status={lead.status} />
              {lead.rating > 0 && (
                <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>
                  ★ {lead.rating?.toFixed(1)}
                  {lead.review_count > 0 && <span style={{ color: MUTED, fontWeight: 400 }}> ({lead.review_count} reviews)</span>}
                </span>
              )}
            </div>

            {/* Contact info */}
            <div style={{ background: CARD, border: `1px solid #2a2a2a`, borderRadius: 10, padding: '16px', marginBottom: 16 }}>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contact</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
                    <IconMail />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Email</div>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} style={{ color: GOLD, fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}>{lead.email}</a>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: MUTED, fontSize: 13 }}>Not found</span>
                        {lead.website && !lead.email_enriched && (
                          <button
                            style={{ ...S.btn('ghost'), padding: '3px 8px', fontSize: 11 }}
                            onClick={() => { enrichLead(lead._id); setSelectedLead({...lead, email_enriched: true}) }}
                          >
                            <IconZap /> Find
                          </button>
                        )}
                        {lead.email_enriched && <span style={{ color: MUTED, fontSize: 11 }}>Searched — not public</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Phone</div>
                      <a href={`tel:${lead.phone}`} style={{ color: TEXT, fontSize: 13, textDecoration: 'none' }}>{lead.phone}</a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {lead.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
                      <IconGlobe />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Website</div>
                      <a href={lead.website} target="_blank" rel="noreferrer"
                        style={{ color: GOLD, fontSize: 13, textDecoration: 'none', wordBreak: 'break-all' }}>
                        {lead.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}

                {/* Instagram */}
                {lead.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Instagram</div>
                      <span style={{ color: TEXT, fontSize: 13 }}>{lead.instagram}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source info */}
            <div style={{ background: CARD, border: `1px solid #2a2a2a`, borderRadius: 10, padding: '16px', marginBottom: 16 }}>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Source</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED, fontSize: 13 }}>Platform</span>
                  <span style={{ color: plat?.color || GOLD, fontWeight: 600, fontSize: 13 }}>{lead.current_platform}</span>
                </div>
                {lead.source_url && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: MUTED, fontSize: 13 }}>Listing</span>
                    <a href={lead.source_url} target="_blank" rel="noreferrer"
                       style={{ color: GOLD, fontSize: 12, textDecoration: 'none' }}>View original ↗</a>
                  </div>
                )}
                {lead.scraped_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED, fontSize: 13 }}>Scraped</span>
                    <span style={{ color: TEXT, fontSize: 13 }}>{fmtDate(lead.scraped_at)}</span>
                  </div>
                )}
                {lead.created_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED, fontSize: 13 }}>Added</span>
                    <span style={{ color: TEXT, fontSize: 13 }}>{fmtDate(lead.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid #2a2a2a`, display: 'flex', gap: 8 }}>
            <button
              style={{ ...S.btn(), flex: 1 }}
              onClick={() => { adminApi.post(`/scraper/leads/${lead._id}/push-outreach`); setSelectedLead(null) }}
            >
              <IconArrow /> Push to Outreach
            </button>
            <button
              style={{ ...S.btn('danger'), padding: '9px 14px' }}
              onClick={() => { deleteLead(lead._id); setSelectedLead(null) }}
            >
              <IconTrash />
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Styles ────────────────────────────────────────────────────

  const S = {
    wrap: { fontFamily: FIG, color: TEXT, minHeight: '100vh', background: BG, padding: '28px 32px' },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 700, color: TEXT },
    subtitle: { fontSize: 13, color: MUTED, marginTop: 2 },
    tabs: { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${BORDER}` },
    tab: (active) => ({
      padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
      color: active ? GOLD : MUTED, background: 'none', border: 'none',
      fontFamily: FIG, marginBottom: -1, transition: 'color 0.15s',
    }),
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 },
    label: { color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    select: {
      border: `1px solid ${BORDER}`, borderRadius: 8,
      padding: '9px 12px', fontSize: 13, fontFamily: FIG, width: '100%',
      cursor: 'pointer', outline: 'none',
    },
    input: {
      border: `1px solid ${BORDER}`, borderRadius: 8,
      padding: '9px 12px', fontSize: 13, fontFamily: FIG, width: '100%', outline: 'none',
    },
    btn: (variant = 'primary') => ({
      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', border: 'none', fontFamily: FIG, display: 'inline-flex',
      alignItems: 'center', gap: 6, transition: 'opacity 0.15s',
      background: variant === 'primary' ? GOLD : variant === 'danger' ? '#7f1d1d' : '#2a2a2a',
      color: variant === 'primary' ? '#111' : variant === 'danger' ? '#fca5a5' : TEXT,
    }),
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { padding: '10px 12px', textAlign: 'left', color: MUTED, fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${BORDER}` },
    td: { padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, color: TEXT, verticalAlign: 'middle' },
  }


  // ══════════════════════════════════════════════════════════════
  // TAB: OVERVIEW
  // ══════════════════════════════════════════════════════════════

  function renderOverview() {
    const s = stats || {}
    return (
      <div>
        <div style={S.grid4}>
          <StatCard label="Total Leads" value={s.total_leads?.toLocaleString()} color={GOLD} />
          <StatCard label="With Email" value={s.with_email?.toLocaleString()} color="#4ade80" />
          <StatCard label="Interested" value={s.interested?.toLocaleString()} color="#fb923c" />
          <StatCard label="Converted" value={s.converted?.toLocaleString()} color="#c084fc" />
        </div>
        <div style={S.grid4}>
          <StatCard label="New Today" value={s.new_today?.toLocaleString()} />
          <StatCard label="Contacted" value={s.contacted?.toLocaleString()} />
          <StatCard label="Email Enriched" value={s.enriched?.toLocaleString()} />
          <StatCard label="Running Jobs" value={s.running_jobs || 0} color={s.running_jobs ? '#fbbf24' : MUTED} />
        </div>

        {/* Source breakdown */}
        {s.by_source && Object.keys(s.by_source).length > 0 && (
          <div style={S.card}>
            <div style={S.label}>Leads by Source</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
              {Object.entries(s.by_source).map(([src, count]) => {
                const plat = PLATFORMS.find(p => src.startsWith(p.id))
                return (
                  <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: plat?.color || GOLD }} />
                    <span style={{ color: TEXT, fontWeight: 600 }}>{count?.toLocaleString()}</span>
                    <span style={{ color: MUTED, fontSize: 12 }}>{src.replace('_scrape', '')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button style={S.btn()} onClick={() => setTab('discover')}>
            <IconTarget /> Start Discovery
          </button>
          <button style={S.btn('ghost')} onClick={() => setTab('leads')}>
            <IconUsers /> View Leads
          </button>
        </div>
      </div>
    )
  }


  // ══════════════════════════════════════════════════════════════
  // TAB: DISCOVER
  // ══════════════════════════════════════════════════════════════

  function renderDiscover() {
    const prog = activeJob?.progress || {}
    const isActive = running || ['queued', 'running'].includes(activeJob?.status)
    const isDone = activeJob && ['completed', 'failed', 'cancelled'].includes(activeJob.status)

    return (
      <div style={{ maxWidth: 680 }}>
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Lead Discovery</div>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>
            Scrape UK business listings from competitor platforms directly into your outreach pipeline.
            Uses IPRoyal UK residential proxies — each request comes from a different UK IP.
          </div>

          {/* Platform */}
          <div style={{ marginBottom: 16 }}>
            <div style={S.label}>Platform</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => !isActive && setPlatform(p.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: isActive ? 'not-allowed' : 'pointer', fontFamily: FIG,
                    border: `1px solid ${platform === p.id ? p.color : BORDER}`,
                    background: platform === p.id ? `${p.color}22` : CARD,
                    color: platform === p.id ? p.color : MUTED,
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* City + Vertical row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={S.label}>City</div>
              <select
                style={S.select}
                value={city}
                onChange={e => !isActive && setCity(e.target.value)}
                disabled={isActive}
              >
                {UK_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={S.label}>Vertical</div>
              <select
                style={S.select}
                value={vertical}
                onChange={e => !isActive && setVertical(e.target.value)}
                disabled={isActive}
              >
                {VERTICALS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Max leads */}
          <div style={{ marginBottom: 20 }}>
            <div style={S.label}>Max Leads (1–1000)</div>
            <input
              type="number" min={1} max={1000}
              style={{ ...S.input, maxWidth: 160 }}
              value={maxLeads}
              onChange={e => !isActive && setMaxLeads(parseInt(e.target.value) || 200)}
              disabled={isActive}
            />
            <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
              ~{Math.round(maxLeads * 0.05)} MB proxy data estimated
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isActive ? (
              <button style={S.btn()} onClick={startDiscovery}>
                <IconPlay /> Start Discovery
              </button>
            ) : (
              <button
                style={S.btn('danger')}
                onClick={() => activeJob && cancelJob(activeJob.job_id)}
              >
                <IconStop /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress panel */}
        {activeJob && (
          <div style={{ ...S.card, borderColor: isActive ? GOLD : BORDER }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>
                {activeJob.platform?.charAt(0).toUpperCase() + activeJob.platform?.slice(1)} — {activeJob.vertical} in {activeJob.city}
              </div>
              <Badge status={activeJob.status} type="job" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Pages Scraped', value: prog.pages_scraped || 0 },
                { label: 'Found', value: prog.leads_found || 0 },
                { label: 'Added', value: prog.leads_added || 0, color: '#4ade80' },
                { label: 'Duplicates', value: prog.duplicates || 0, color: MUTED },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.color || GOLD }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {isActive && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 6, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
                  {(prog.leads_added || 0) === 0 ? (
                    /* Indeterminate animation when no leads yet */
                    <div style={{
                      height: '100%', background: GOLD, borderRadius: 4,
                      width: '30%',
                      animation: 'scan 1.8s ease-in-out infinite',
                    }} />
                  ) : (
                    /* Determinate progress once leads start coming in */
                    <div style={{
                      height: '100%', background: GOLD, borderRadius: 4,
                      width: `${Math.min(100, ((prog.leads_added || 0) / (activeJob.max_leads || 200)) * 100)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: MUTED }}>
                  <span>Scraping {activeJob.platform} — {activeJob.vertical} in {activeJob.city}</span>
                  <span>{prog.leads_added || 0} / {activeJob.max_leads || maxLeads} leads</span>
                </div>
              </div>
            )}

            {isDone && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button style={S.btn()} onClick={() => { setTab('leads'); loadLeads() }}>
                  <IconUsers /> View {prog.leads_added || 0} New Leads
                </button>
                <button style={S.btn('ghost')} onClick={startDiscovery}>
                  <IconRefresh /> Run Again
                </button>
              </div>
            )}

            {activeJob.error && (
              <div style={{ marginTop: 12, color: '#f87171', fontSize: 13, background: '#2e1010', padding: '8px 12px', borderRadius: 8 }}>
                Error: {activeJob.error}
              </div>
            )}
            {jobError && (
              <div style={{ marginTop: 12, color: '#f87171', fontSize: 13, background: '#2e1010', padding: '8px 12px', borderRadius: 8 }}>
                {jobError}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }


  // ══════════════════════════════════════════════════════════════
  // TAB: LEADS
  // ══════════════════════════════════════════════════════════════

  function renderLeads() {
    const totalPages = Math.ceil(leadsTotal / LIMIT)

    return (
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED }}>
              <IconSearch />
            </span>
            <input
              style={{ ...S.input, paddingLeft: 32 }}
              placeholder="Search business name…"
              value={leadsFilter.search}
              onChange={e => {
                const f = { ...leadsFilter, search: e.target.value }
                setLeadsFilter(f)
                setLeadsPage(0)
                loadLeads(0, f)
              }}
            />
          </div>
          <select
            style={{ ...S.select, width: 140 }}
            value={leadsFilter.source}
            onChange={e => {
              const f = { ...leadsFilter, source: e.target.value }
              setLeadsFilter(f); setLeadsPage(0); loadLeads(0, f)
            }}
          >
            <option value="">All Sources</option>
            {PLATFORMS.map(p => <option key={p.id} value={`${p.id}_scrape`}>{p.label}</option>)}
          </select>
          <select
            style={{ ...S.select, width: 130 }}
            value={leadsFilter.status}
            onChange={e => {
              const f = { ...leadsFilter, status: e.target.value }
              setLeadsFilter(f); setLeadsPage(0); loadLeads(0, f)
            }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
          </select>
          <button style={S.btn('ghost')} onClick={() => loadLeads(leadsPage)}>
            <IconRefresh /> Refresh
          </button>
        </div>

        {/* Bulk actions */}
        {selectedLeads.size > 0 && (
          <div style={{
            background: '#1a2540', border: `1px solid #2a3a5c`, borderRadius: 8,
            padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: 13 }}>
              {selectedLeads.size} selected
            </span>
            <button style={S.btn('ghost')} onClick={bulkEnrich}>
              <IconZap /> Enrich Emails
            </button>
            <button style={S.btn('danger')} onClick={bulkDelete}>
              <IconTrash /> Delete
            </button>
            <button
              style={{ ...S.btn('ghost'), marginLeft: 'auto' }}
              onClick={() => setSelectedLeads(new Set())}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {leadsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Loading leads…</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>
              <div style={{ marginBottom: 8 }}>No leads found</div>
              <button style={S.btn()} onClick={() => setTab('discover')}>
                <IconTarget /> Start Discovery
              </button>
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 36 }}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor: GOLD }}
                    />
                  </th>
                  <th style={S.th}>Business</th>
                  <th style={S.th}>City</th>
                  <th style={S.th}>Vertical</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Source</th>
                  <th style={S.th}>Rating</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead._id} style={{ ':hover': { background: '#1a1a1a' } }}>
                    <td style={S.td}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead._id)}
                        onChange={() => toggleLead(lead._id)}
                        style={{ accentColor: GOLD }}
                      />
                    </td>
                    <td style={S.td}>
                      <div
                        style={{ fontWeight: 600, cursor: 'pointer', color: TEXT }}
                        onClick={() => setSelectedLead(lead)}
                      >
                        {lead.name}
                      </div>
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noreferrer"
                           style={{ color: MUTED, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconGlobe /> website
                        </a>
                      )}
                    </td>
                    <td style={{ ...S.td, color: MUTED }}>{lead.city}</td>
                    <td style={{ ...S.td, color: MUTED }}>{lead.vertical}</td>
                    <td style={S.td}>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} style={{ color: GOLD, fontSize: 12 }}>{lead.email}</a>
                      ) : (
                        <span style={{ color: MUTED, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={S.td}>
                      {(() => {
                        const plat = PLATFORMS.find(p => lead.source?.startsWith(p.id))
                        return (
                          <span style={{ color: plat?.color || MUTED, fontWeight: 600, fontSize: 12 }}>
                            {lead.current_platform || '—'}
                          </span>
                        )
                      })()}
                    </td>
                    <td style={{ ...S.td, color: MUTED }}>
                      {lead.rating ? `${lead.rating.toFixed(1)} ★` : '—'}
                    </td>
                    <td style={S.td}>
                      <Badge status={lead.status} />
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {lead.website && !lead.email_enriched && (
                          <button
                            title="Find email"
                            style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 12 }}
                            onClick={() => enrichLead(lead._id)}
                          >
                            <IconZap />
                          </button>
                        )}
                        <button
                          title="Push to outreach"
                          style={{ ...S.btn('ghost'), padding: '4px 8px', fontSize: 12 }}
                          onClick={() => api.post(`/scraper/leads/${lead._id}/push-outreach`)}
                        >
                          <IconArrow />
                        </button>
                        <button
                          title="Delete"
                          style={{ ...S.btn('danger'), padding: '4px 8px', fontSize: 12 }}
                          onClick={() => deleteLead(lead._id)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {leadsTotal > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ color: MUTED, fontSize: 13 }}>
              Showing {leadsPage * LIMIT + 1}–{Math.min((leadsPage + 1) * LIMIT, leadsTotal)} of {leadsTotal.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...S.btn('ghost'), padding: '6px 14px' }}
                onClick={() => { const p = leadsPage - 1; setLeadsPage(p); loadLeads(p) }}
                disabled={leadsPage === 0}
              >
                Prev
              </button>
              <button
                style={{ ...S.btn('ghost'), padding: '6px 14px' }}
                onClick={() => { const p = leadsPage + 1; setLeadsPage(p); loadLeads(p) }}
                disabled={leadsPage >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }


  // ══════════════════════════════════════════════════════════════
  // TAB: JOBS
  // ══════════════════════════════════════════════════════════════

  function renderJobs() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ color: MUTED, fontSize: 13 }}>{jobsTotal} total jobs</span>
          <button style={S.btn('ghost')} onClick={loadJobs}>
            <IconRefresh /> Refresh
          </button>
        </div>
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {jobs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>No jobs yet — run a discovery first.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Platform</th>
                  <th style={S.th}>City</th>
                  <th style={S.th}>Vertical</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Found</th>
                  <th style={S.th}>Added</th>
                  <th style={S.th}>Pages</th>
                  <th style={S.th}>Started</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const plat = PLATFORMS.find(p => p.id === job.platform)
                  const prog = job.progress || {}
                  const isLive = ['queued', 'running'].includes(job.status)
                  return (
                    <tr key={job.job_id}>
                      <td style={S.td}>
                        <span style={{ color: plat?.color || GOLD, fontWeight: 700 }}>
                          {job.platform?.charAt(0).toUpperCase() + job.platform?.slice(1)}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: MUTED }}>{job.city}</td>
                      <td style={{ ...S.td, color: MUTED }}>{job.vertical}</td>
                      <td style={S.td}><Badge status={job.status} type="job" /></td>
                      <td style={{ ...S.td, color: TEXT }}>{prog.leads_found || 0}</td>
                      <td style={{ ...S.td, color: '#4ade80', fontWeight: 700 }}>{prog.leads_added || 0}</td>
                      <td style={{ ...S.td, color: MUTED }}>{prog.pages_scraped || 0}</td>
                      <td style={{ ...S.td, color: MUTED, fontSize: 12 }}>{fmtDate(job.started_at)}</td>
                      <td style={S.td}>
                        {isLive && (
                          <button
                            style={{ ...S.btn('danger'), padding: '4px 10px', fontSize: 12 }}
                            onClick={() => cancelJob(job.job_id)}
                          >
                            <IconStop /> Cancel
                          </button>
                        )}
                        {job.error && (
                          <span title={job.error} style={{ color: '#f87171', fontSize: 12 }}>Error ⚠</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }


  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div style={S.wrap}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(233%); }
          100% { transform: translateX(233%); }
        }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        input[type=number]::-webkit-inner-spin-button { opacity:0.4 }
        select option { background: #1e1e1e; color: #e8e8e8; }
        select option:checked { background: #C9A84C22; color: #C9A84C; }
      `}</style>

      <div style={S.header}>
        <div style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: 10 }}>
          <IconTarget />
        </div>
        <div>
          <div style={S.title}>Growth Hub</div>
          <div style={S.subtitle}>Discover leads from Fresha, Treatwell, Booksy &amp; Vagaro — straight into your outreach pipeline</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {stats?.running_jobs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1s infinite' }} />
              {stats.running_jobs} job{stats.running_jobs > 1 ? 's' : ''} running
            </div>
          )}
          <button style={S.btn('ghost')} onClick={() => { loadStats(); if (tab === 'leads') loadLeads(leadsPage); if (tab === 'jobs') loadJobs() }}>
            <IconRefresh />
          </button>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'leads' && leadsTotal > 0 && (
              <span style={{ background: GOLD, color: '#111', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 800, marginLeft: 6 }}>
                {leadsTotal > 999 ? '999+' : leadsTotal}
              </span>
            )}
            {t.id === 'jobs' && stats?.running_jobs > 0 && (
              <span style={{ background: '#fbbf24', color: '#111', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 800, marginLeft: 6 }}>
                {stats.running_jobs}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>Loading…</div>
      ) : (
        <>
          {tab === 'overview' && renderOverview()}
          {tab === 'discover' && renderDiscover()}
          {tab === 'leads' && renderLeads()}
          {tab === 'jobs' && renderJobs()}
        </>
      )}
      {renderLeadPanel()}
    </div>
  )
}

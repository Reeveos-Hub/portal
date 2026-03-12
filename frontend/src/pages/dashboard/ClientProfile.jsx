/**
 * ClientProfile.jsx — Full Client Profile Page (Stitch design)
 * Route: /dashboard/crm/client/:clientId
 * Accessed via "View Full Profile →" button in CRM side panel
 * 
 * This page does NOT replace or modify the CRM table or side panel.
 * It is a separate deep-dive page for a single client.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import {
  ArrowLeft, Calendar, User, Phone, Mail, MessageSquare,
  CheckCircle, ChevronRight, Plus, FileText, Package,
  ShoppingBag, Activity, LogIn, LogOut
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS — Matched from Stitch Figma
// ═══════════════════════════════════════════════════════════════
const T = {
  bg: '#F5F5F0',
  card: '#FFFFFF',
  border: '#E8E8E3',
  borderLight: '#F0F0EB',
  black: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  gold: '#C9A84C',
  goldText: '#8B7333',
  green: '#4A7C59',
  greenBright: '#2E7D32',
  greenCheck: '#2E7D32',
  red: '#C62828',
  amber: '#D4930D',
  olive: '#5C6E30',
  dark: '#1A1A1A',
  maroon: '#8B3A3A',
  radius: 16,
  radiusSm: 12,
  radiusPill: 24,
  font: "'Figtree', system-ui, -apple-system, sans-serif",
}

const getInit = (n) => (n || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) } catch { return '—' } }
const fmtCurr = (v) => `£${(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

// ═══════════════════════════════════════════════════════════════
// ICONS — Monochrome SVGs only
// ═══════════════════════════════════════════════════════════════
const CheckIcon = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill={T.greenCheck} />
    <polyline points="7 12 10.5 15.5 17 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════
// NOTE COLORS
// ═══════════════════════════════════════════════════════════════
const NOTE_COLORS = { personal: T.gold, treatment: '#2563EB', alert: '#EF4444' }

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [tab, setTab] = useState('overview')
  const [noteType, setNoteType] = useState('personal')
  const [noteText, setNoteText] = useState('')
  const [localNotes, setLocalNotes] = useState([])

  const loadData = useCallback(async () => {
    if (!bid || !clientId) return
    setLoading(true)
    try {
      const [d, tl] = await Promise.all([
        api.get(`/crm/business/${bid}/client/${clientId}`),
        api.get(`/crm/business/${bid}/client/${clientId}/timeline?limit=50`),
      ])
      setDetail(d)
      setTimeline(tl.events || [])
    } catch (e) {
      console.error('Failed to load client profile:', e)
    }
    setLoading(false)
  }, [bid, clientId])

  useEffect(() => { loadData() }, [loadData])

  const goBack = () => navigate('/dashboard/crm?view=clients')

  const addNote = async () => {
    if (!noteText.trim() || !bid || !clientId) return
    try {
      await api.post(`/crm/business/${bid}/client/${clientId}/interaction`, {
        type: 'note',
        summary: noteText,
        outcome: noteType,
      })
      setLocalNotes([{ id: Date.now(), summary: noteText, type: noteType, timestamp: new Date().toISOString(), actor: { name: 'You' } }, ...localNotes])
      setNoteText('')
    } catch (e) {
      console.error('Failed to add note:', e)
    }
  }

  if (loading) return <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AppLoader message="Loading client profile..." /></div>
  if (!detail) return <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>Client not found</div>

  const { client, stats, health_score, pipeline_stage, consultation_form_status, bookings, shop_orders, ltv, referral_count } = detail
  const allNotes = [...localNotes, ...timeline]
  const formClear = consultation_form_status === 'valid'
  const topBooking = bookings?.[0]

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 48px' }}>

        {/* ═══ BREADCRUMB ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button onClick={goBack} style={{ width: 34, height: 34, borderRadius: '50%', background: T.card, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={16} color="#666" />
          </button>
          <span onClick={goBack} style={{ fontSize: 13, color: T.textMuted, cursor: 'pointer' }}>CRM › Clients</span>
          <span style={{ fontSize: 13, color: '#DDD' }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.black }}>{client.name}</span>
        </div>

        {/* ═══ CLIENT HEADER — Stitch design ═══ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {getInit(client.name)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: T.black }}>{client.name}</span>
                  {(client.tags || []).includes('VIP') && (
                    <span style={{ padding: '3px 12px', borderRadius: T.radiusPill, background: T.olive, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>VIP</span>
                  )}
                  {pipeline_stage === 'package_holder' && (
                    <span style={{ padding: '3px 12px', borderRadius: T.radiusPill, background: 'transparent', border: '1.5px solid #C5C5C0', color: T.textSecondary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Package Holder</span>
                  )}
                  {(client.tags || []).filter(t => t !== 'VIP').map(t => (
                    <span key={t} style={{ padding: '3px 12px', borderRadius: T.radiusPill, background: 'transparent', border: '1.5px solid #C5C5C0', color: T.textSecondary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: T.radiusPill, border: `1.5px solid ${T.border}`, background: 'transparent', fontSize: 12, fontWeight: 600, color: T.textMuted, cursor: 'pointer', fontFamily: T.font }}>
                  <Plus size={12} /> Tag
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: T.radiusPill, border: 'none', background: T.green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                <LogIn size={14} /> Check In
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: T.radiusPill, border: 'none', background: T.green, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                <LogOut size={14} /> Check Out
              </button>
              <button onClick={() => navigate('/dashboard/calendar')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: T.radiusPill, border: 'none', background: T.black, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                <Calendar size={14} /> Book Appointment
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Lifetime Value', value: fmtCurr(ltv?.total || stats?.total_spend), color: T.goldText },
              { label: 'Visit Frequency', value: stats?.total_visits > 1 ? Math.round(365 / stats.total_visits) + ' days' : '—', color: T.greenBright },
              { label: 'Total Visits', value: String(stats?.total_visits || 0), color: T.black },
              { label: 'Package Progress', value: '—', color: T.black },
              { label: 'Preferred Service', value: topBooking ? (typeof topBooking.service === 'object' ? topBooking.service?.name : topBooking.service)?.split(' ')[0] || '—' : '—', color: T.black, small: true },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 20px', background: T.card, borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: s.small ? 18 : 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ TAB BAR — Stitch: black underline ═══ */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'notes', label: 'Notes & History' },
            { key: 'treatments', label: 'Treatments' },
            { key: 'products', label: 'Products' },
            { key: 'personalisation', label: 'Personalisation' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '12px 20px', fontSize: 14, fontWeight: tab === t.key ? 600 : 500, cursor: 'pointer',
              border: 'none', background: 'transparent',
              color: tab === t.key ? T.black : T.textMuted,
              borderBottom: tab === t.key ? `2px solid ${T.black}` : '2px solid transparent',
              fontFamily: T.font,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════
            OVERVIEW TAB
            ═══════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Upcoming Appointment */}
              <div style={{ background: 'linear-gradient(135deg, #FFF9E6, #FFF5D6)', borderRadius: T.radius, padding: '28px 28px 24px', border: '1px solid #F0E8D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ padding: '4px 14px', borderRadius: T.radiusPill, background: T.olive, color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Upcoming Appointment</span>
                  <button style={{ padding: '6px 18px', borderRadius: T.radiusPill, border: 'none', background: T.black, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>Edit</button>
                </div>
                {topBooking ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.black, marginBottom: 8 }}>{typeof topBooking.service === 'object' ? topBooking.service?.name : topBooking.service}</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 14, color: T.textSecondary, marginBottom: 24 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} color="#888" /> {fmtDate(topBooking.date)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} color="#888" /> {topBooking.staff || 'Any'}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.textMuted, marginBottom: 24 }}>No upcoming appointments</div>
                )}

                <div style={{ fontSize: 11, fontWeight: 700, color: T.maroon, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Personalisation Notes</div>
                <p style={{ fontSize: 15, color: T.black, lineHeight: 1.65, margin: 0 }}>
                  &quot;{client.notes || 'No personalisation notes recorded yet. Add notes via the Notes & History tab.'}&quot;
                </p>
              </div>

              {/* Homecare Regimen */}
              {shop_orders && shop_orders.length > 0 && (
                <div style={{ background: T.card, borderRadius: T.radius, padding: '24px 28px', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: T.black }}>Recent Purchases</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Restock Prediction</span>
                  </div>
                  {shop_orders.slice(0, 5).map((o, i) => (
                    <div key={o.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.black }}>{o.item_names?.join(', ') || `Order #${o.order_number}`}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.textSecondary }}>{fmtCurr(o.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Consultation Status */}
              <div style={{ background: T.card, borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.black, marginBottom: 16 }}>Consultation Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <CheckIcon />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: formClear ? T.greenCheck : T.amber }}>{formClear ? 'Form Clear' : 'Needs Attention'}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>Last updated: {fmtDate(stats?.last_visit)}</div>
                  </div>
                </div>
                <button style={{ width: '100%', padding: '10px 0', borderRadius: T.radiusPill, border: `1.5px solid ${T.border}`, background: T.card, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.black, fontFamily: T.font }}>
                  Review Full History
                </button>
              </div>

              {/* Treatment Progress */}
              <div style={{ background: T.card, borderRadius: T.radius, padding: '24px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.black, marginBottom: 16 }}>Treatment Progress</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {['BEFORE', 'CURRENT'].map(l => (
                    <div key={l} style={{ flex: 1, background: '#EDEDED', borderRadius: T.radiusSm, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      <span style={{ fontSize: 11, color: '#AAA' }}>Photo</span>
                      <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: l === 'BEFORE' ? T.dark : T.gold, color: '#fff', textTransform: 'uppercase' }}>{l}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                  Progress tracked across {stats?.total_visits || 0} sessions.
                </p>
              </div>

              {/* Last Interaction */}
              <div style={{ background: T.dark, borderRadius: T.radius, padding: '24px', color: '#fff' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Last Interaction</div>
                {topBooking ? (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{typeof topBooking.service === 'object' ? topBooking.service?.name : topBooking.service}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>{fmtDate(topBooking.date)} • {fmtCurr(stats?.avg_spend || 0)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>No visits yet</div>
                )}
                <button style={{ width: '100%', padding: '11px 0', borderRadius: T.radiusPill, border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                  Repeat Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            NOTES & HISTORY TAB
            ═══════════════════════════════════════════════ */}
        {tab === 'notes' && (
          <div>
            <div style={{ background: T.card, borderRadius: T.radius, padding: '18px 24px', border: `1px solid ${T.border}`, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              {['personal', 'treatment', 'alert'].map(t => (
                <button key={t} onClick={() => setNoteType(t)} style={{
                  padding: '8px 16px', borderRadius: T.radiusSm,
                  border: noteType === t ? `2px solid ${NOTE_COLORS[t]}` : `1px solid ${T.border}`,
                  background: noteType === t ? `${NOTE_COLORS[t]}10` : T.card,
                  color: noteType === t ? NOTE_COLORS[t] : T.textMuted,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', fontFamily: T.font,
                }}>{t}</button>
              ))}
              <input
                value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Type your note here..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, outline: 'none' }}
              />
              <button onClick={addNote} style={{ padding: '10px 20px', borderRadius: T.radiusSm, border: 'none', background: T.black, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>Add</button>
            </div>

            <div style={{ background: T.card, borderRadius: T.radius, padding: '24px 28px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.black, marginBottom: 24 }}>Client History</div>
              {allNotes.length > 0 ? allNotes.map((ev, i) => {
                const noteColor = NOTE_COLORS[ev.type || ev.outcome || ev.category] || '#999'
                return (
                  <div key={ev.id || i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 6, background: noteColor, flexShrink: 0 }} />
                      {i < allNotes.length - 1 && <div style={{ flex: 1, width: 2, background: T.border, minHeight: 28 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.black }}>{fmtDate(ev.timestamp)}</span>
                        <span style={{ fontSize: 13, color: T.textMuted }}>by {ev.actor?.name || 'System'}</span>
                        {(ev.type || ev.outcome || ev.category) && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: T.radiusPill, background: `${noteColor}10`, color: noteColor, border: `1px solid ${noteColor}20`, textTransform: 'capitalize' }}>
                            {ev.type || ev.outcome || ev.category}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: T.black, lineHeight: 1.6, margin: 0 }}>{ev.summary}</p>
                    </div>
                  </div>
                )
              }) : (
                <p style={{ fontSize: 14, color: T.textMuted, textAlign: 'center', padding: 20 }}>No timeline events yet. Add a note above to start recording history.</p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TREATMENTS TAB
            ═══════════════════════════════════════════════ */}
        {tab === 'treatments' && (
          <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {bookings && bookings.length > 0 ? bookings.map((b, i) => (
              <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < bookings.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.black }}>{typeof b.service === 'object' ? b.service?.name : b.service}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{fmtDate(b.date)} · {b.staff || 'Any'}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: b.status === 'completed' ? '#10B981' : b.status === 'cancelled' ? '#EF4444' : '#F59E0B', textTransform: 'capitalize' }}>{b.status}</span>
              </div>
            )) : (
              <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>No treatments recorded yet</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PRODUCTS TAB
            ═══════════════════════════════════════════════ */}
        {tab === 'products' && (
          <div>
            {shop_orders && shop_orders.length > 0 ? shop_orders.map((o, i) => (
              <div key={o.id || i} style={{ background: T.card, borderRadius: T.radius, padding: '18px 24px', border: `1px solid ${T.border}`, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.black }}>{o.item_names?.join(', ') || `Order #${o.order_number}`}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{fmtDate(o.date)} · {o.items} item{o.items !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.black }}>{fmtCurr(o.total)}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: o.status === 'delivered' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>{o.status}</span>
                </div>
              </div>
            )) : (
              <div style={{ background: T.card, borderRadius: T.radius, padding: 40, border: `1px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
                No product purchases recorded yet
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PERSONALISATION TAB
            ═══════════════════════════════════════════════ */}
        {tab === 'personalisation' && (
          <div style={{ background: T.card, borderRadius: T.radius, padding: '24px 28px', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.black, marginBottom: 4 }}>Personalisation Engine — {client.name}</div>
            <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 20px' }}>Configure automated communications for this client.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'Auto-rebook prompt', d: "Remind when visit frequency suggests they're due", on: true },
                { l: 'Product restock alerts', d: 'Notify when purchased products likely running low', on: true },
                { l: 'Birthday campaign', d: 'Auto-send birthday discount email', on: false },
                { l: 'Package renewal', d: 'Prompt when 1 session remaining', on: true },
                { l: 'Seasonal campaigns', d: 'Include in tag-based seasonal sends', on: true },
                { l: 'Therapist notes in portal', d: 'Show treatment notes in client portal', on: true },
              ].map((item, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: T.radiusSm, padding: '16px 18px', border: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.black }}>{item.l}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{item.d}</div>
                  </div>
                  <div style={{ width: 40, height: 22, borderRadius: 11, background: item.on ? T.greenCheck : '#D5D5D0', padding: 2, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: item.on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action FAB — gold pill */}
      <button style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '12px 22px', borderRadius: T.radiusPill, border: 'none', background: T.gold, color: T.dark, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, boxShadow: '0 4px 16px rgba(201,168,76,0.35)', zIndex: 100 }}>
        <Plus size={14} /> Quick Action
      </button>
    </div>
  )
}

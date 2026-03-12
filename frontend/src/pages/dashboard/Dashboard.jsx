import AppLoader from "../../components/shared/AppLoader"
/**
 * Draggable Widget Dashboard — custom grid engine (no external library)
 * Uses mouse events for drag, absolute positioning for grid, snap-to-grid on drop.
 * Gold glow on drag, lock/unlock, show/hide, widget library, save per-user.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarCheck, Clock, PoundSterling, Armchair, ArrowRight,
  Search, TrendingUp, TrendingDown, RefreshCw,
  LayoutGrid, Plus, RotateCcw, Lock, Unlock, EyeOff, X, Move, Grip,
  FileText, ClipboardList
} from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

/* ── Helpers ── */
const AVATAR_COLORS = ['bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-pink-100 text-pink-600','bg-gray-100 text-gray-600']
const getAv = (n) => { let h=0; for(let i=0;i<(n||'').length;i++) h=n.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length] }
const getInit = (n) => (n||'??').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
const timeAgo = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

/* ═══ Grid Engine ═══ */
const COLS = 4
const ROW_H = 90
const GAP = 16

function calcPosition(item, containerWidth) {
  const colW = (containerWidth - GAP * (COLS - 1)) / COLS
  return {
    left: item.x * (colW + GAP),
    top: item.y * (ROW_H + GAP),
    width: item.w * colW + (item.w - 1) * GAP,
    height: item.h * ROW_H + (item.h - 1) * GAP,
  }
}

/* ═══ Widget Definitions ═══ */
const WIDGETS = {
  stats:         { name: 'Key Stats',              removable: false, minW: 2, minH: 2 },
  upcoming:      { name: 'Upcoming Appointments',  removable: false, minW: 2, minH: 3 },
  trends:        { name: 'Appointment Trends',     removable: true,  minW: 2, minH: 3 },
  quickActions:  { name: 'Quick Actions',          removable: true,  minW: 1, minH: 3 },
  activity:      { name: 'Live Activity',          removable: true,  minW: 1, minH: 3 },
  weekGlance:    { name: 'This Week at a Glance',  removable: true,  minW: 2, minH: 2 },
  services:      { name: 'Services Today',         removable: true,  minW: 2, minH: 3 },
  staffToday:    { name: 'Staff Today',            removable: true,  minW: 2, minH: 3 },
  consultations: { name: 'Consultation Forms',     removable: true,  minW: 1, minH: 2 },
}

const DEFAULT_LAYOUT = [
  { i: 'stats',         x: 0, y: 0,  w: 4, h: 2 },
  { i: 'trends',        x: 0, y: 2,  w: 2, h: 3 },
  { i: 'quickActions',  x: 2, y: 2,  w: 1, h: 3 },
  { i: 'activity',      x: 3, y: 2,  w: 1, h: 4 },
  { i: 'weekGlance',    x: 0, y: 5,  w: 2, h: 2 },
  { i: 'services',      x: 0, y: 7,  w: 2, h: 3 },
  { i: 'upcoming',      x: 2, y: 5,  w: 2, h: 5 },
  { i: 'staffToday',    x: 0, y: 10, w: 2, h: 3 },
  { i: 'consultations', x: 2, y: 10, w: 2, h: 2 },
]

/* ═══ MAIN DASHBOARD ═══ */
const Dashboard = () => {
  const { business, businessType, loading: bizLoading } = useBusiness()
  const bid = business?.id ?? business?._id
  const isRestaurant = businessType === 'restaurant'
  const navigate = useNavigate()

  /* ── Data state ── */
  const [summary, setSummary] = useState(null)
  const [todayBookings, setTodayBookings] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [consultationStats, setConsultationStats] = useState({ total: 0, pending_review: 0, expiring_soon: 0, blocked: 0, clear: 0 })

  /* ── Grid state ── */
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(900)
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [editMode, setEditMode] = useState(false)
  const [lockedWidgets, setLockedWidgets] = useState(new Set())
  const [hiddenWidgets, setHiddenWidgets] = useState(new Set())
  const [showLibrary, setShowLibrary] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(null)

  /* ── Measure container ── */
  useEffect(() => {
    const measure = () => { if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  /* ── Load dashboard data ── */
  const loadDashboard = useCallback(async () => {
    if (!bid) return
    try {
      const [sumRes, todayRes, actRes, bkRes] = await Promise.allSettled([
        api.get(`/dashboard/business/${bid}/summary`),
        api.get(`/dashboard/business/${bid}/today`),
        api.get(`/dashboard/business/${bid}/activity?limit=10`),
        api.get(`/bookings/business/${bid}?limit=20&status=all`),
      ])
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value)
      if (todayRes.status === 'fulfilled') setTodayBookings(todayRes.value?.bookings || [])
      if (actRes.status === 'fulfilled') setActivity(actRes.value?.events || [])
      const bks = bkRes.status === 'fulfilled' ? (bkRes.value?.bookings || []) : []
      if ((!sumRes.value || !sumRes.value?.today?.bookings) && bks.length) {
        const todayStr = new Date().toISOString().split('T')[0]
        const todayBks = bks.filter(b => b.date === todayStr && b.status !== 'cancelled')
        const upcoming = bks.filter(b => ['confirmed','pending'].includes(b.status))
        setSummary(prev => prev && prev.today?.bookings ? prev : {
          today: { bookings: todayBks.length, upcomingBookings: upcoming.length, revenue: todayBks.reduce((s, b) => s + (b.price || b.service?.price || 0), 0) },
          nextBooking: upcoming[0] ? { customerName: upcoming[0].customerName || upcoming[0].customer?.name, time: upcoming[0].time } : null,
        })
        if (!todayRes.value?.bookings?.length) setTodayBookings(upcoming.slice(0, 10).map(b => ({
          id: b.id || b._id, time: b.time, customerName: b.customerName || b.customer?.name || 'Client',
          service_name: b.service?.name || b.serviceName || '', staff_name: b.staff?.name || b.staffName || '',
          status: b.status, phone: b.customer?.phone || b.phone || '',
        })))
      }
      if (!actRes.value?.events?.length && bks.length) {
        setActivity(bks.slice(0, 8).map(b => ({
          id: b.id || b._id, type: 'booking',
          message: `Booking ${b.status}: ${b.customerName || b.customer?.name || 'Client'}`,
          sub: `${b.service?.name || b.serviceName || 'Service'}, ${b.date} at ${b.time}`,
          timestamp: b.createdAt || b.created_at,
        })))
      }

      // Waitlist count (silent fail — not all businesses have this)
      api.get(`/tables-epos/business/${bid}/waitlist`).then(r => setWaitlistCount(r?.count || 0)).catch(() => {})

      // Consultation form stats (silent fail)
      api.get(`/consultation/business/${bid}/submissions?limit=200`).then(r => {
        const subs = r?.submissions || []
        const blocked = subs.filter(s => s.status === 'blocked').length
        const flagged = subs.filter(s => s.status === 'flagged').length
        const clear = subs.filter(s => s.status === 'clear' || s.status === 'signed').length
        setConsultationStats({
          total: r?.total || subs.length,
          pending_review: r?.pending_review || flagged,
          expiring_soon: r?.expiring_soon || 0,
          blocked,
          clear,
        })
      }).catch(() => {})
    } catch (e) { console.error('Dashboard load error:', e) }
    setLoading(false)
  }, [bid])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { if (!bid) return; const iv = setInterval(() => loadDashboard(), 20000); return () => clearInterval(iv) }, [loadDashboard, bid])

  /* ── Load saved layout ── */
  useEffect(() => {
    api.get('/dashboard/layout').then(data => {
      if (data && data.layout && Array.isArray(data.layout) && data.layout.length > 0 && data.layout[0]?.i) {
        setLayout(data.layout)
        setHiddenWidgets(new Set(data.hidden_widgets || []))
        setLockedWidgets(new Set(data.locked_widgets || []))
      }
    }).catch(() => {})
  }, [])

  /* ── Save layout (debounced) ── */
  const saveRef = useRef(null)
  const saveLayout = (newLayout, hidden, locked) => {
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      api.put('/dashboard/layout', {
        layout: newLayout || layout,
        hidden_widgets: [...(hidden || hiddenWidgets)],
        locked_widgets: [...(locked || lockedWidgets)],
      }).catch(() => {})
    }, 1000)
  }

  /* ── Drag handlers ── */
  const handleMouseDown = useCallback((e, itemId) => {
    if (!editMode || lockedWidgets.has(itemId)) return
    const item = layout.find(l => l.i === itemId)
    if (!item || !containerRef.current) return
    const pos = calcPosition(item, containerWidth)
    const rect = containerRef.current.getBoundingClientRect()
    setDragging(itemId)
    setDragOffset({ x: e.clientX - rect.left - pos.left, y: e.clientY - rect.top - pos.top })
    setDragPos({ x: pos.left, y: pos.top })
    e.preventDefault()
  }, [editMode, layout, containerWidth, lockedWidgets])

  const handleResizeStart = useCallback((e, itemId) => {
    e.stopPropagation(); e.preventDefault()
    if (!editMode) return
    const item = layout.find(l => l.i === itemId)
    if (!item || lockedWidgets.has(itemId)) return
    setResizing({ id: itemId, startX: e.clientX, startY: e.clientY, startW: item.w, startH: item.h })
  }, [editMode, layout, lockedWidgets])

  useEffect(() => {
    if (!dragging && !resizing) return
    const handleMove = (e) => {
      if (dragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDragPos({ x: e.clientX - rect.left - dragOffset.x, y: e.clientY - rect.top - dragOffset.y })
      }
      if (resizing) {
        const colW = (containerWidth - GAP * (COLS - 1)) / COLS
        const dxCols = Math.round((e.clientX - resizing.startX) / (colW + GAP))
        const dyRows = Math.round((e.clientY - resizing.startY) / (ROW_H + GAP))
        const widget = WIDGETS[resizing.id]
        const newW = Math.max(widget?.minW || 1, Math.min(COLS, resizing.startW + dxCols))
        const newH = Math.max(widget?.minH || 1, resizing.startH + dyRows)
        setLayout(prev => prev.map(l => l.i === resizing.id ? { ...l, w: newW, h: newH } : l))
      }
    }
    const handleUp = () => {
      if (dragging) {
        const colW = (containerWidth - GAP * (COLS - 1)) / COLS
        const snapX = Math.round(dragPos.x / (colW + GAP))
        const snapY = Math.round(dragPos.y / (ROW_H + GAP))
        const newLayout = layout.map(l => l.i === dragging ? { ...l, x: Math.max(0, Math.min(COLS - l.w, snapX)), y: Math.max(0, snapY) } : l)
        setLayout(newLayout)
        saveLayout(newLayout)
        setDragging(null)
      }
      if (resizing) { saveLayout(layout); setResizing(null) }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [dragging, resizing, dragOffset, dragPos, containerWidth, layout])

  const toggleLock = (id) => {
    setLockedWidgets(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); saveLayout(layout, hiddenWidgets, n); return n })
  }
  const hideWidget = (id) => {
    if (!WIDGETS[id]?.removable) return
    const n = new Set([...hiddenWidgets, id]); setHiddenWidgets(n); saveLayout(layout, n, lockedWidgets)
  }
  const showWidget = (id) => {
    const n = new Set(hiddenWidgets); n.delete(id); setHiddenWidgets(n)
    if (!layout.find(l => l.i === id)) {
      const maxY = Math.max(...layout.map(l => l.y + l.h), 0)
      const w = WIDGETS[id]
      const nl = [...layout, { i: id, x: 0, y: maxY, w: w?.minW || 2, h: w?.minH || 2 }]
      setLayout(nl); saveLayout(nl, n, lockedWidgets)
    } else { saveLayout(layout, n, lockedWidgets) }
  }
  const resetLayout = () => {
    setLayout([...DEFAULT_LAYOUT]); setHiddenWidgets(new Set()); setLockedWidgets(new Set())
    api.delete('/dashboard/layout').catch(() => {})
  }

  /* ── Loading ── */
  if (loading || bizLoading) return <AppLoader message="Loading dashboard..." />

  /* ── Derived data ── */
  const t = summary?.today || {}
  const totalCovers = t.bookings || 0
  const apiRevenue = t.revenue || 0
  const revenue = apiRevenue > 0 ? apiRevenue : totalCovers * 30
  const nextBkg = summary?.nextBooking

  const statCards = [
    { label: isRestaurant ? 'Total Covers' : 'Appointments Today', value: totalCovers, icon: <Users className="w-4 h-4" />, trend: summary?.period?.bookingsChange ? `${Math.abs(summary.period.bookingsChange)}%` : null, trendUp: (summary?.period?.bookingsChange || 0) >= 0, sub: 'vs last week', link: '/dashboard/bookings' },
    { label: 'Upcoming', value: t.upcomingBookings || 0, icon: <CalendarCheck className="w-4 h-4" />, sub: nextBkg ? `Next: ${nextBkg.time || ''}` : 'No upcoming', link: '/dashboard/calendar' },
    { label: 'Waitlist', value: waitlistCount, icon: <Clock className="w-4 h-4" />, sub: waitlistCount > 0 ? `${waitlistCount} client${waitlistCount !== 1 ? 's' : ''} waiting` : 'No waitlist active' },
    { label: 'Revenue Today', value: `£${revenue.toLocaleString()}`, icon: <PoundSterling className="w-4 h-4" />, trend: summary?.period?.revenueChange ? `${Math.abs(summary.period.revenueChange)}%` : null, trendUp: (summary?.period?.revenueChange || 0) >= 0, sub: 'vs yesterday', link: '/dashboard/payments' },
  ]

  const activityList = activity.map(e => ({
    id: e.id, text: e.message || `${e.type}: event`, sub: e.sub || '', time: timeAgo(e.timestamp),
    color: e.type === 'booking' ? '#10B981' : e.type === 'cancellation' ? '#EF4444' : '#3B82F6',
  }))

  const arrivals = todayBookings
    .filter(b => ['confirmed','pending','checked_in'].includes(b.status))
    .filter(b => !searchFilter || (b.customerName || '').toLowerCase().includes(searchFilter.toLowerCase()))
    .map(b => ({
      id: b.id, time: b.time || '', name: b.customerName || 'Client',
      service: typeof b.service === 'object' ? b.service?.name : b.service,
      staffName: b.staffName || '', status: b.status,
      statusLabel: b.status === 'confirmed' ? 'Confirmed' : b.status === 'pending' ? 'Pending' : 'In Treatment',
      statusColor: b.status === 'confirmed' ? '#3B82F6' : b.status === 'pending' ? '#F59E0B' : '#22C55E',
      statusBg: b.status === 'confirmed' ? '#EFF6FF' : b.status === 'pending' ? '#FFFBEB' : '#F0FDF4',
      action: b.status === 'confirmed' ? 'Check In' : b.status === 'pending' ? 'Confirm' : 'View',
    }))

  const handleQuickAction = (action) => {
    switch (action) {
      case 'New Appointment': case 'Reserve': navigate('/dashboard/calendar'); break
      case 'Walk-in': navigate('/dashboard/calendar'); break
      case 'Schedule': navigate('/dashboard/bookings'); break
      case 'Forms': navigate('/dashboard/consultation-forms'); break
    }
  }

  /* ═══ Widget Content Renderers ═══ */
  const renderWidget = (id) => {
    switch (id) {
      case 'stats':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, height: '100%' }}>
            {statCards.map((c, i) => (
              <div key={i} onClick={() => c.link && navigate(c.link)} style={{
                background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E5E7EB',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: c.link ? 'pointer' : 'default',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{c.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>{c.value}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.trend && <span style={{ color: c.trendUp ? '#22C55E' : '#EF4444', fontWeight: 700 }}>{c.trendUp ? '↑' : '↓'} {c.trend}</span>}
                  {c.sub}
                </div>
              </div>
            ))}
          </div>
        )

      case 'trends': {
        const hours = Array.from({ length: 12 }, (_, i) => i + 8)
        const counts = hours.map(h => todayBookings.filter(b => parseInt((b.time || '').split(':')[0], 10) === h).length)
        const max = Math.max(...counts, 1)
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>Appointment Trends</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>By hour today</div></div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>{todayBookings.length} total</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {hours.map((h, i) => (
                <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, justifyContent: 'flex-end', height: '100%' }}>
                  {counts[i] > 0 && <span style={{ fontSize: 9, fontWeight: 700 }}>{counts[i]}</span>}
                  <div style={{ width: '100%', borderRadius: 4, height: counts[i] > 0 ? `${Math.max((counts[i] / max) * 100, 15)}%` : 4, background: counts[i] > 0 ? '#111' : '#F3F4F6', transition: 'height 0.4s', minHeight: counts[i] > 0 ? 14 : 4 }} />
                  <span style={{ fontSize: 8, color: '#9CA3AF' }}>{h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'quickActions':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
              {[
                { icon: CalendarCheck, label: isRestaurant ? 'Reserve' : 'New Appointment', action: isRestaurant ? 'Reserve' : 'New Appointment' },
                { icon: Users, label: 'Walk-in Client', action: 'Walk-in' },
                { icon: Clock, label: "Today's Schedule", action: 'Schedule' },
                { icon: FileText, label: 'Consultation Forms', action: 'Forms' },
              ].map((a, i) => {
                const Icon = a.icon
                return (
                  <div key={i} onClick={() => handleQuickAction(a.action)} style={{
                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                    borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  >
                    <Icon size={20} />{a.label}
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'activity':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Live Activity</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activityList.length > 0 ? activityList.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#111', lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2 }}>{a.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{a.time}</span>
                </div>
              )) : <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>No recent activity</div>}
            </div>
            <button onClick={() => navigate('/dashboard/notifications')} style={{ fontSize: 10, fontWeight: 700, color: '#111', letterSpacing: '0.05em', cursor: 'pointer', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6', background: 'none', border: 'none', fontFamily: 'inherit' }}>VIEW ALL ACTIVITY</button>
          </div>
        )

      case 'weekGlance': {
        const completed = todayBookings.filter(b => b.status === 'completed').length
        return (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>This Week at a Glance</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Key performance indicators</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'BOOKINGS', value: summary?.period?.totalBookings || totalCovers, color: '#111' },
                { label: 'REVENUE', value: `£${(summary?.period?.totalRevenue || revenue).toLocaleString()}`, color: '#22C55E' },
                { label: 'AVG VALUE', value: totalCovers > 0 ? `£${Math.round(revenue / totalCovers)}` : '—', color: '#C9A84C' },
                { label: 'COMPLETION', value: totalCovers > 0 ? `${Math.round((completed / totalCovers) * 100)}%` : '—', color: '#8B5CF6' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 10, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'services': {
        const svcs = {}
        todayBookings.forEach(b => { const n = b.service_name || (typeof b.service === 'object' ? b.service?.name : b.service) || 'Unknown'; svcs[n] = (svcs[n] || 0) + 1 })
        const sorted = Object.entries(svcs).sort((a, b) => b[1] - a[1])
        const mx = sorted[0]?.[1] || 1
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Services Today</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>What clients are booking</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map(([name, count], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 16, color: '#9CA3AF', fontWeight: 500, textAlign: 'right' }}>{i+1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: '#111' }}>{name}</span>
                      <span style={{ fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#111', width: `${(count / mx) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {sorted.length === 0 && <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>No services data yet</div>}
            </div>
          </div>
        )
      }

      case 'staffToday': {
        const staff = {}
        todayBookings.forEach(b => { const n = b.staff_name || b.staffName || b.therapist || 'Unassigned'; staff[n] = (staff[n] || 0) + 1 })
        const sorted = Object.entries(staff).sort((a, b) => b[1] - a[1])
        const mx = sorted[0]?.[1] || 1
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Staff Today</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Appointments per team member</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>{count} appt{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#111', width: `${(count / mx) * 100}%` }} />
                  </div>
                </div>
              ))}
              {sorted.length === 0 && <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>No staff data yet</div>}
            </div>
          </div>
        )
      }

      case 'upcoming':
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>Upcoming Appointments</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{arrivals.length} appointments</div></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {arrivals.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, minWidth: 38 }}>{a.time}</div>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, flexShrink: 0 }}>{getInit(a.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.service || '—'}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: a.statusBg, color: a.statusColor }}>{a.statusLabel}</span>
                </div>
              ))}
              {arrivals.length === 0 && <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>No upcoming appointments</div>}
            </div>
            <button onClick={() => navigate('/dashboard/bookings')} style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', cursor: 'pointer', marginTop: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6', background: 'none', border: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>View All <ArrowRight size={12} /></button>
          </div>
        )

      case 'consultations':
        return (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Consultation Forms</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>{consultationStats.total} total submissions</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Pending', value: consultationStats.pending_review, bg: '#FFFBEB', color: '#D97706' },
                { label: 'Blocked', value: consultationStats.blocked, bg: '#FEF2F2', color: '#DC2626' },
                { label: 'Clear', value: consultationStats.clear, bg: '#F0FDF4', color: '#059669' },
              ].map((c, i) => (
                <div key={i} onClick={() => navigate('/dashboard/consultation-forms')} style={{ flex: 1, padding: 10, borderRadius: 8, background: c.bg, cursor: 'pointer' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: c.color }}>{c.label}</div>
                </div>
              ))}
            </div>
            {consultationStats.expiring_soon > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#D97706', fontWeight: 600 }}>
                {consultationStats.expiring_soon} expiring within 30 days
              </div>
            )}
          </div>
        )

      default: return null
    }
  }

  /* ═══ RENDER ═══ */
  const visibleLayout = layout.filter(l => !hiddenWidgets.has(l.i))
  const totalH = Math.max(...visibleLayout.map(l => l.y + l.h), 0)

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-4rem)] overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>

      {/* ── Toolbar ── */}
      <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard/booking-link')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-[#1a1a1a] shadow-md transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Booking Link
          </button>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF' }} />
            <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search clients..." style={{ paddingLeft: 30, paddingRight: 12, padding: '8px 12px 8px 30px', width: 200, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <button onClick={() => { setLoading(true); loadDashboard() }} style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><RefreshCw size={16} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { setEditMode(!editMode); if (editMode) setShowLibrary(false) }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: editMode ? '#111' : '#F3F4F6', color: editMode ? '#fff' : '#374151',
            border: `1px solid ${editMode ? '#111' : '#E5E7EB'}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <LayoutGrid size={14} />{editMode ? 'Done Editing' : 'Edit Layout'}
          </button>
          {editMode && (
            <>
              <button onClick={() => setShowLibrary(!showLibrary)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />Add Widget
              </button>
              <button onClick={resetLayout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB', cursor: 'pointer', fontFamily: 'inherit' }}>
                <RotateCcw size={14} />Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* ── Widget Library ── */}
        {showLibrary && editMode && (
          <div style={{ width: 240, borderRight: '1px solid #E5E7EB', padding: 16, background: '#F9FAFB', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Widget Library</span>
              <X size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setShowLibrary(false)} />
            </div>
            {Object.entries(WIDGETS).map(([id, def]) => {
              const isHidden = hiddenWidgets.has(id)
              return (
                <div key={id} style={{ padding: '10px 12px', borderRadius: 8, background: '#fff', border: '1px solid #E5E7EB', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{def.name}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{!def.removable ? "Required" : isHidden ? 'Hidden' : 'Visible'}</div>
                  </div>
                  {def.removable ? (
                    <button onClick={() => isHidden ? showWidget(id) : hideWidget(id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: isHidden ? '#F0FDF4' : '#FEF2F2', color: isHidden ? '#059669' : '#EF4444', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {isHidden ? 'Show' : 'Hide'}
                    </button>
                  ) : <Lock size={12} color="#9CA3AF" />}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Grid Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {editMode && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#C9A84C15', border: '1px solid #C9A84C30', fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Move size={14} color="#C9A84C" />
              <strong>Edit mode</strong> — Drag widgets to rearrange. Drag bottom-right corner to resize. Click lock to pin.
            </div>
          )}

          <div ref={containerRef} style={{ position: 'relative', height: (totalH + 2) * (ROW_H + GAP), minHeight: 400 }}>
            {/* Grid guides */}
            {editMode && Array.from({ length: COLS }).map((_, i) => {
              const colW = (containerWidth - GAP * (COLS - 1)) / COLS
              return <div key={i} style={{ position: 'absolute', left: i * (colW + GAP), top: 0, width: colW, height: '100%', background: '#11111103', border: '1px dashed #E5E7EB', borderRadius: 8, pointerEvents: 'none' }} />
            })}

            {visibleLayout.map(item => {
              const isDragging = dragging === item.i
              const isLocked = lockedWidgets.has(item.i)
              const widget = WIDGETS[item.i]
              const pos = isDragging
                ? { left: dragPos.x, top: dragPos.y, width: calcPosition(item, containerWidth).width, height: calcPosition(item, containerWidth).height }
                : calcPosition(item, containerWidth)

              const isDark = item.i === 'quickActions'

              return (
                <div key={item.i} style={{
                  position: 'absolute', left: pos.left, top: pos.top, width: pos.width, height: pos.height,
                  background: isDark ? '#111111' : '#fff', color: isDark ? '#fff' : '#111', borderRadius: 14, padding: 16,
                  border: `1px solid ${isDragging ? '#C9A84C' : editMode ? '#C4C8CF' : isDark ? '#111' : '#E5E7EB'}`,
                  boxShadow: isDragging ? '0 16px 48px rgba(0,0,0,0.15), 0 0 0 2px #C9A84C' : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: isDragging ? 'none' : 'all 0.25s ease',
                  zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.95 : 1,
                  cursor: editMode && !isLocked ? 'grab' : 'default', overflow: 'hidden',
                }}
                  onMouseDown={(e) => { if (e.target.closest('[data-no-drag]')) return; handleMouseDown(e, item.i) }}
                >
                  {/* Edit controls */}
                  {editMode && (
                    <div data-no-drag style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, zIndex: 10 }}>
                      <button onClick={() => toggleLock(item.i)} style={{ width: 24, height: 24, borderRadius: 6, background: isLocked ? '#C9A84C' : isDark ? 'rgba(255,255,255,0.15)' : '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLocked ? <Lock size={11} color="#fff" /> : <Unlock size={11} color={isDark ? '#fff' : '#9CA3AF'} />}
                      </button>
                      {widget?.removable && (
                        <button onClick={() => hideWidget(item.i)} style={{ width: 24, height: 24, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.15)' : '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EyeOff size={11} color={isDark ? '#fff' : '#9CA3AF'} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Drag handle */}
                  {editMode && !isLocked && (
                    <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 32, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.3)' : '#C4C8CF' }} />
                  )}

                  {/* Content */}
                  <div style={{ height: '100%', overflow: 'hidden' }}>
                    {renderWidget(item.i)}
                  </div>

                  {/* Resize handle */}
                  {editMode && !isLocked && (
                    <div data-no-drag onMouseDown={(e) => handleResizeStart(e, item.i)} style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M9 1v8H1" fill="none" stroke="#C4C8CF" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 5v4H5" fill="none" stroke="#C4C8CF" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

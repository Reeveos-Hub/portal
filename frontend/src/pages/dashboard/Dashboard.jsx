/**
 * Draggable Widget Dashboard — react-grid-layout powered
 * Each section is a self-contained widget that can be dragged, resized, locked, hidden
 * Layout saves per-user to MongoDB via /dashboard/layout API
 * Collision prevention: widgets push each other out of the way (compactType="vertical")
 */
import AppLoader from "../../components/shared/AppLoader"
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactGridLayout from 'react-grid-layout'
const Responsive = ReactGridLayout.Responsive
const WidthProvider = ReactGridLayout.WidthProvider
import {
  Users, CalendarCheck, Clock, PoundSterling, TrendingUp, TrendingDown,
  Search, Download, Filter, MoreVertical, ArrowRight, RefreshCw,
  LayoutGrid, Plus, RotateCcw, Lock, Unlock, EyeOff, Eye, X,
  FileText, ClipboardList, Grip, Armchair, Ban
} from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import theme from '../../config/theme'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

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

/* ── Widget registry ── */
const WIDGET_DEFS = {
  stats:         { name: 'Key Stats',              icon: TrendingUp,    removable: false, minW: 2, minH: 2 },
  upcoming:      { name: 'Upcoming Appointments',  icon: CalendarCheck, removable: false, minW: 2, minH: 3 },
  trends:        { name: 'Appointment Trends',     icon: TrendingUp,    removable: true,  minW: 2, minH: 3 },
  quickActions:  { name: 'Quick Actions',          icon: LayoutGrid,    removable: true,  minW: 1, minH: 2 },
  activity:      { name: 'Live Activity',          icon: Clock,         removable: true,  minW: 1, minH: 3 },
  weekGlance:    { name: 'This Week at a Glance',  icon: TrendingUp,    removable: true,  minW: 2, minH: 2 },
  services:      { name: 'Services Today',         icon: ClipboardList, removable: true,  minW: 1, minH: 2 },
  staffToday:    { name: 'Staff Today',            icon: Users,         removable: true,  minW: 1, minH: 2 },
  consultations: { name: 'Consultation Forms',     icon: FileText,      removable: true,  minW: 1, minH: 2 },
  floorStatus:   { name: 'Floor Status',           icon: Armchair,      removable: true,  minW: 2, minH: 3 },
}

/* ── Default layouts ── */
const DEFAULT_SERVICES = [
  { i: 'stats',         x: 0, y: 0,  w: 4, h: 2 },
  { i: 'trends',        x: 0, y: 2,  w: 2, h: 3 },
  { i: 'quickActions',  x: 2, y: 2,  w: 1, h: 3 },
  { i: 'activity',      x: 3, y: 2,  w: 1, h: 4 },
  { i: 'weekGlance',    x: 0, y: 5,  w: 2, h: 3 },
  { i: 'upcoming',      x: 2, y: 5,  w: 2, h: 5 },
  { i: 'services',      x: 0, y: 8,  w: 2, h: 3 },
  { i: 'staffToday',    x: 0, y: 11, w: 2, h: 3 },
  { i: 'consultations', x: 2, y: 10, w: 2, h: 2 },
]

const DEFAULT_RESTAURANT = [
  { i: 'stats',        x: 0, y: 0,  w: 4, h: 2 },
  { i: 'trends',       x: 0, y: 2,  w: 2, h: 3 },
  { i: 'quickActions', x: 2, y: 2,  w: 1, h: 3 },
  { i: 'activity',     x: 3, y: 2,  w: 1, h: 4 },
  { i: 'floorStatus',  x: 0, y: 5,  w: 2, h: 3 },
  { i: 'upcoming',     x: 2, y: 5,  w: 2, h: 5 },
  { i: 'weekGlance',   x: 0, y: 8,  w: 2, h: 3 },
  { i: 'services',     x: 0, y: 11, w: 2, h: 3 },
  { i: 'staffToday',   x: 2, y: 10, w: 2, h: 3 },
]

/* ═══════════════════════════════════════════════════════════
   WIDGET COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const StatsWidget = ({ statCards }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 h-full">
    {statCards.map((c, i) => (
      <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-gray-500">{c.label}</p>
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">{c.icon}</div>
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900">{c.value}</h3>
        <div className="flex items-center gap-2 text-xs mt-1">
          {c.trend && <span className={`${c.trendUp ? 'text-green-600' : 'text-red-500'} font-bold`}>{c.trendUp ? '↑' : '↓'} {c.trend}</span>}
          <span className="text-gray-400">{c.sub}</span>
        </div>
      </div>
    ))}
  </div>
)

const TrendsWidget = ({ todayBookings, isRestaurant }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8)
  const counts = hours.map(h => todayBookings.filter(b => {
    const bTime = b.time || b.start_time || ''
    const bHour = typeof bTime === 'string' ? parseInt(bTime.split(':')[0], 10) : -1
    return bHour === h
  }).length)
  const max = Math.max(...counts, 1)
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">{isRestaurant ? 'Occupancy Trends' : 'Appointment Trends'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">By hour today</p>
        </div>
        <span className="text-xs font-bold text-gray-400">{todayBookings.length} total</span>
      </div>
      <div className="flex-1 flex items-end gap-1 min-h-0 px-1">
        {hours.map((h, i) => (
          <div key={h} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
            {counts[i] > 0 && <span className="text-[10px] font-bold text-gray-900">{counts[i]}</span>}
            <div style={{
              width: '100%', borderRadius: 4,
              height: counts[i] > 0 ? `${Math.max((counts[i] / max) * 100, 15)}%` : 4,
              background: counts[i] > 0 ? theme.brand.primary : theme.bg.muted,
              transition: 'height 0.4s ease', minHeight: counts[i] > 0 ? 14 : 4,
            }} />
            <span className="text-[9px] text-gray-400">{h > 12 ? `${h-12}pm` : h === 12 ? '12pm' : `${h}am`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const QuickActionsWidget = ({ isRestaurant, onAction }) => (
  <div className="h-full flex flex-col">
    <h2 className="text-base font-extrabold text-gray-900 mb-3">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-2 flex-1">
      {[
        { icon: CalendarCheck, label: isRestaurant ? 'Reserve' : 'New Appt', action: isRestaurant ? 'Reserve' : 'New Appointment', primary: true },
        { icon: Users, label: 'Walk-in', action: isRestaurant ? 'Walk-In' : 'Walk-in Client' },
        { icon: Clock, label: 'Schedule', action: isRestaurant ? 'Run Sheet' : "Today's Schedule" },
        { icon: FileText, label: 'Forms', action: 'Consultation Forms' },
      ].map((a, i) => {
        const Icon = a.icon
        return (
          <button key={i} onClick={() => onAction(a.action)}
            className={`rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all border ${
              a.primary ? 'bg-primary text-white border-primary hover:bg-[#1a1a1a]' : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
            }`}>
            <Icon size={18} />
            {a.label}
          </button>
        )
      })}
    </div>
  </div>
)

const ActivityWidget = ({ activityList, navigate }) => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-base font-bold text-gray-900">Live Activity</h2>
      <Filter className="w-4 h-4 text-gray-400" />
    </div>
    <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
      {activityList.length > 0 ? activityList.map((a, i) => (
        <div key={i} className="flex gap-2 py-2 border-b border-gray-50">
          <div className={`mt-1.5 w-2 h-2 rounded-full ${a.color} shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-800 leading-snug">{a.text}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{a.sub}</p>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">{a.time}</span>
        </div>
      )) : <div className="text-center text-xs text-gray-400 py-4">No recent activity</div>}
    </div>
    <button onClick={() => navigate('/dashboard/notifications')} className="text-[10px] font-bold text-primary uppercase tracking-wide mt-2 pt-2 border-t border-gray-100">
      View All Activity
    </button>
  </div>
)

const WeekGlanceWidget = ({ summary, revenue, totalCovers, todayBookings }) => {
  const completed = todayBookings.filter(b => b.status === 'completed').length
  return (
    <div>
      <h2 className="text-base font-extrabold text-gray-900 mb-1">This Week at a Glance</h2>
      <p className="text-xs text-gray-400 mb-3">Key performance indicators</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Bookings', value: summary?.period?.totalBookings || totalCovers, color: theme.brand.primary },
          { label: 'Revenue', value: `£${(summary?.period?.totalRevenue || revenue).toLocaleString()}`, color: theme.status.success },
          { label: 'Avg Value', value: totalCovers > 0 ? `£${Math.round(revenue / totalCovers)}` : '—', color: theme.brand.gold },
          { label: 'Completion', value: totalCovers > 0 ? `${Math.round((completed / totalCovers) * 100)}%` : '—', color: theme.status.purple },
        ].map((m, i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{m.label}</div>
            <div className="text-xl font-extrabold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ServicesWidget = ({ todayBookings, isRestaurant }) => {
  const services = {}
  todayBookings.forEach(b => {
    const name = b.service_name || (typeof b.service === 'object' ? b.service?.name : b.service) || b.serviceName || 'Unknown'
    services[name] = (services[name] || 0) + 1
  })
  const sorted = Object.entries(services).sort((a, b) => b[1] - a[1])
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-base font-extrabold text-gray-900 mb-1">{isRestaurant ? 'Popular Today' : 'Services Today'}</h2>
      <p className="text-xs text-gray-400 mb-3">What clients are booking</p>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {sorted.length > 0 ? sorted.map(([name, count], i) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-300 w-4 text-right">{i+1}.</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold text-gray-800 truncate">{name}</span>
                <span className="text-xs font-bold">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxCount) * 100}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        )) : <div className="text-xs text-gray-400 text-center py-4">No services data yet</div>}
      </div>
    </div>
  )
}

const StaffTodayWidget = ({ todayBookings }) => {
  const staff = {}
  todayBookings.forEach(b => {
    const name = b.staff_name || b.staffName || b.therapist || 'Unassigned'
    staff[name] = (staff[name] || 0) + 1
  })
  const sorted = Object.entries(staff).sort((a, b) => b[1] - a[1])
  const max = sorted.length > 0 ? sorted[0][1] : 1
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-base font-extrabold text-gray-900 mb-1">Staff Today</h2>
      <p className="text-xs text-gray-400 mb-3">Appointments per team member</p>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {sorted.length > 0 ? sorted.map(([name, count]) => (
          <div key={name}>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold">{name}</span>
              <span className="text-xs font-bold text-gray-500">£{(count * 65).toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        )) : <div className="text-xs text-gray-400 text-center py-4">No staff data yet</div>}
      </div>
    </div>
  )
}

const UpcomingWidget = ({ arrivals, isRestaurant, searchFilter, setSearchFilter, navigate }) => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-center mb-3">
      <div>
        <h2 className="text-base font-bold text-gray-900">{isRestaurant ? 'Upcoming Arrivals' : 'Upcoming Appointments'}</h2>
        <p className="text-xs text-gray-500">{arrivals.length} {isRestaurant ? 'reservations' : 'appointments'}</p>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
      {arrivals.length > 0 ? arrivals.map(a => (
        <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-xs">
          <div className="font-bold text-gray-900 w-10 shrink-0">{a.time}</div>
          <div className={`w-7 h-7 rounded-full ${getAv(a.name)} font-bold text-[10px] flex items-center justify-center shrink-0`}>{getInit(a.name)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{a.name}</div>
            <div className="text-[10px] text-gray-500 truncate">{isRestaurant ? `Party of ${a.guests}` : a.service || '—'}</div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.statusBg} shrink-0`}>{a.statusLabel}</span>
          <button className="text-primary font-bold text-[10px] bg-gray-50 hover:bg-white border border-transparent hover:border-primary/30 px-2 py-1 rounded transition-all shrink-0">{a.action}</button>
        </div>
      )) : <div className="text-xs text-gray-400 text-center py-8">No upcoming appointments</div>}
    </div>
    <button onClick={() => navigate('/dashboard/bookings')} className="text-xs font-medium text-gray-500 hover:text-primary flex items-center justify-center gap-1 mt-2 pt-2 border-t border-gray-100">
      View All <ArrowRight className="w-3 h-3" />
    </button>
  </div>
)

const ConsultationsWidget = ({ navigate }) => (
  <div>
    <h2 className="text-base font-extrabold text-gray-900 mb-1">Consultation Forms</h2>
    <p className="text-xs text-gray-400 mb-3">Requiring attention</p>
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Pending', value: '2', bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' },
        { label: 'Flagged', value: '1', bg: 'bg-red-50', color: 'text-red-600', border: 'border-red-100' },
        { label: 'Clear', value: '6', bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
      ].map((c, i) => (
        <div key={i} className={`p-3 rounded-lg ${c.bg} border ${c.border} cursor-pointer hover:shadow-sm transition-shadow`}
          onClick={() => navigate('/dashboard/consultation-forms')}>
          <div className={`text-xl font-extrabold ${c.color}`}>{c.value}</div>
          <div className={`text-[10px] font-semibold ${c.color}`}>{c.label}</div>
        </div>
      ))}
    </div>
  </div>
)

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { business, businessType, tier, loading: bizLoading } = useBusiness()
  const bid = business?.id ?? business?._id
  const isRestaurant = businessType === 'restaurant'
  const navigate = useNavigate()

  // ── Data state ──
  const [summary, setSummary] = useState(null)
  const [todayBookings, setTodayBookings] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')

  // ── Layout state ──
  const [layouts, setLayouts] = useState({ lg: isRestaurant ? DEFAULT_RESTAURANT : DEFAULT_SERVICES })
  const [editMode, setEditMode] = useState(false)
  const [lockedWidgets, setLockedWidgets] = useState(new Set())
  const [hiddenWidgets, setHiddenWidgets] = useState(new Set())
  const [showLibrary, setShowLibrary] = useState(false)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  const saveTimeout = useRef(null)

  // ── Load dashboard data ──
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
          today: {
            bookings: todayBks.length,
            upcomingBookings: upcoming.length,
            revenue: todayBks.reduce((s, b) => s + (b.price || b.service?.price || 0), 0),
            noShows: todayBks.filter(b => b.status === 'no_show').length,
          },
          nextBooking: upcoming[0] ? {
            customerName: upcoming[0].customerName || upcoming[0].customer?.name,
            time: upcoming[0].time,
            guests: upcoming[0].guests || upcoming[0].partySize,
          } : null,
        })
        if (!todayRes.value?.bookings?.length) {
          setTodayBookings(upcoming.slice(0, 10).map(b => ({
            id: b.id || b._id, time: b.time, start_time: b.time,
            customerName: b.customerName || b.customer?.name || 'Client',
            service_name: b.service?.name || b.serviceName || '',
            staff_name: b.staff?.name || b.staffName || '',
            status: b.status, notes: b.notes || '',
            phone: b.customer?.phone || b.phone || '',
          })))
        }
      }
      if ((!actRes.value?.events?.length) && bks.length) {
        setActivity(bks.slice(0, 8).map(b => ({
          id: b.id || b._id, type: 'booking',
          message: `Booking ${b.status}: ${b.customerName || b.customer?.name || 'Client'}`,
          sub: `${b.service?.name || b.serviceName || 'Service'}, ${b.date} at ${b.time}`,
          timestamp: b.createdAt || b.created_at,
        })))
      }
    } catch (e) { console.error('Dashboard load error:', e) }
    setLoading(false)
  }, [bid])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => {
    if (!bid) return
    const interval = setInterval(() => loadDashboard(), 20000)
    return () => clearInterval(interval)
  }, [loadDashboard, bid])

  // ── Load saved layout from API ──
  useEffect(() => {
    api.get('/dashboard/layout').then(data => {
      if (data && data.layout && data.layout.length > 0) {
        setLayouts({ lg: data.layout })
        setHiddenWidgets(new Set(data.hidden_widgets || []))
        setLockedWidgets(new Set(data.locked_widgets || []))
      }
      setLayoutLoaded(true)
    }).catch(() => setLayoutLoaded(true))
  }, [])

  // ── Save layout to API (debounced 1s) ──
  const saveLayout = useCallback((newLayout, hidden, locked) => {
    if (!layoutLoaded) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      api.put('/dashboard/layout', {
        layout: newLayout,
        hidden_widgets: [...(hidden || hiddenWidgets)],
        locked_widgets: [...(locked || lockedWidgets)],
      }).catch(e => console.error('Failed to save layout:', e))
    }, 1000)
  }, [layoutLoaded, hiddenWidgets, lockedWidgets])

  const handleLayoutChange = (layout) => {
    // react-grid-layout fires this on every change — only save meaningful ones
    const cleaned = layout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }))
    setLayouts({ lg: cleaned })
    saveLayout(cleaned)
  }

  const resetLayout = () => {
    const def = isRestaurant ? DEFAULT_RESTAURANT : DEFAULT_SERVICES
    setLayouts({ lg: def })
    setHiddenWidgets(new Set())
    setLockedWidgets(new Set())
    api.delete('/dashboard/layout').catch(() => {})
  }

  const toggleLock = (id) => {
    setLockedWidgets(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      setTimeout(() => saveLayout(layouts.lg, hiddenWidgets, next), 100)
      return next
    })
  }

  const hideWidget = (id) => {
    if (!WIDGET_DEFS[id]?.removable) return
    setHiddenWidgets(prev => {
      const next = new Set([...prev, id])
      setTimeout(() => saveLayout(layouts.lg, next, lockedWidgets), 100)
      return next
    })
  }

  const showWidget = (id) => {
    const newHidden = new Set(hiddenWidgets)
    newHidden.delete(id)
    setHiddenWidgets(newHidden)
    if (!layouts.lg.find(l => l.i === id)) {
      const def = WIDGET_DEFS[id]
      const maxY = Math.max(...layouts.lg.map(l => l.y + l.h), 0)
      const newLayout = [...layouts.lg, { i: id, x: 0, y: maxY, w: def.minW || 2, h: def.minH || 2 }]
      setLayouts({ lg: newLayout })
      saveLayout(newLayout, newHidden, lockedWidgets)
    } else {
      saveLayout(layouts.lg, newHidden, lockedWidgets)
    }
  }

  // ── Loading ──
  if (loading || bizLoading) return <AppLoader message="Loading dashboard..." />
  if (!layoutLoaded) return <AppLoader message="Loading layout..." />

  // ── Derived data ──
  const t = summary?.today || {}
  const totalCovers = t.bookings || 0
  const apiRevenue = t.revenue || 0
  const revenue = apiRevenue > 0 ? apiRevenue : totalCovers * 30
  const nextBkg = summary?.nextBooking

  const statCards = [
    { label: isRestaurant ? 'Total Covers' : 'Appointments Today', value: totalCovers, icon: <Users className="w-4 h-4" />,
      trend: summary?.period?.bookingsChange ? `${Math.abs(summary.period.bookingsChange)}%` : null,
      trendUp: (summary?.period?.bookingsChange || 0) >= 0, sub: 'vs last week' },
    { label: 'Upcoming', value: t.upcomingBookings || 0, icon: <CalendarCheck className="w-4 h-4" />,
      sub: nextBkg ? `Next: ${nextBkg.time || ''}` : 'No upcoming' },
    { label: 'Waitlist', value: 0, icon: <Clock className="w-4 h-4" />, sub: 'No waitlist active' },
    { label: 'Revenue Today', value: `£${revenue.toLocaleString()}`, icon: <PoundSterling className="w-4 h-4" />,
      trend: summary?.period?.revenueChange ? `${Math.abs(summary.period.revenueChange)}%` : null,
      trendUp: (summary?.period?.revenueChange || 0) >= 0, sub: 'vs yesterday' },
  ]

  const activityList = activity.map(e => ({
    id: e.id, text: e.message || `${e.type}: event`,
    sub: e.sub || '', time: timeAgo(e.timestamp),
    color: e.type === 'booking' ? 'bg-emerald-500' : e.type === 'cancellation' ? 'bg-red-400' : 'bg-blue-400',
  }))

  const arrivals = todayBookings
    .filter(b => ['confirmed','pending','checked_in'].includes(b.status))
    .filter(b => !searchFilter || (b.customerName || '').toLowerCase().includes(searchFilter.toLowerCase()))
    .map(b => ({
      id: b.id, time: b.time || '', name: b.customerName || 'Client',
      guests: b.guests || b.partySize || 1,
      service: typeof b.service === 'object' ? b.service?.name : b.service,
      staffName: b.staffName || '', status: b.status,
      statusLabel: b.status === 'confirmed' ? 'Confirmed' : b.status === 'pending' ? 'Pending' : 'In Treatment',
      statusBg: b.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100',
      action: b.status === 'confirmed' ? 'Check In' : b.status === 'pending' ? 'Confirm' : 'View',
    }))

  const handleQuickAction = (action) => {
    switch (action) {
      case 'Walk-In': case 'Walk-in Client': navigate('/dashboard/calendar'); break
      case 'Reserve': case 'New Appointment': navigate('/dashboard/calendar'); break
      case "Today's Schedule": case 'Run Sheet': navigate('/dashboard/bookings'); break
      case 'Consultation Forms': navigate('/dashboard/consultation-forms'); break
    }
  }

  // ── Widget renderer ──
  const renderWidget = (id) => {
    switch (id) {
      case 'stats': return <StatsWidget statCards={statCards} />
      case 'trends': return <TrendsWidget todayBookings={todayBookings} isRestaurant={isRestaurant} />
      case 'quickActions': return <QuickActionsWidget isRestaurant={isRestaurant} onAction={handleQuickAction} />
      case 'activity': return <ActivityWidget activityList={activityList} navigate={navigate} />
      case 'weekGlance': return <WeekGlanceWidget summary={summary} revenue={revenue} totalCovers={totalCovers} todayBookings={todayBookings} />
      case 'services': return <ServicesWidget todayBookings={todayBookings} isRestaurant={isRestaurant} />
      case 'staffToday': return <StaffTodayWidget todayBookings={todayBookings} />
      case 'upcoming': return <UpcomingWidget arrivals={arrivals} isRestaurant={isRestaurant} searchFilter={searchFilter} setSearchFilter={setSearchFilter} navigate={navigate} />
      case 'consultations': return <ConsultationsWidget navigate={navigate} />
      case 'floorStatus': return <div className="text-xs text-gray-400 text-center py-8">Floor status (restaurant only)</div>
      default: return null
    }
  }

  // ── Build layout with locks applied ──
  const visibleLayout = layouts.lg
    .filter(l => !hiddenWidgets.has(l.i))
    .map(l => ({
      ...l,
      static: lockedWidgets.has(l.i),
      minW: WIDGET_DEFS[l.i]?.minW || 1,
      minH: WIDGET_DEFS[l.i]?.minH || 2,
    }))

  return (
    <div className="-m-6 lg:-m-8 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto" style={{ fontFamily: theme.font.family }}>
      {/* Grid styles */}
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: ${theme.brand.gold} !important;
          opacity: 0.15 !important;
          border-radius: 14px !important;
          border: 2px dashed ${theme.brand.gold} !important;
        }
        .react-grid-item > .react-resizable-handle::after {
          border-right-color: ${theme.border.default} !important;
          border-bottom-color: ${theme.border.default} !important;
        }
        .react-grid-item.react-draggable-dragging {
          box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 0 0 2px ${theme.brand.gold} !important;
          z-index: 100 !important;
          opacity: 0.95;
        }
      `}</style>

      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between shrink-0" style={{ borderColor: theme.border.default }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/booking-link')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-[#1a1a1a] shadow-md transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Booking Link
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search clients, appointments..."
              className="pl-8 pr-4 py-2 w-56 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ fontFamily: theme.font.family }} />
          </div>
          <button onClick={() => { setLoading(true); loadDashboard() }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditMode(!editMode); if (!editMode) setShowLibrary(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              editMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <LayoutGrid size={13} />
            {editMode ? 'Done' : 'Edit Layout'}
          </button>
          {editMode && (
            <>
              <button onClick={() => setShowLibrary(!showLibrary)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Plus size={13} /> Widgets
              </button>
              <button onClick={resetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50">
                <RotateCcw size={13} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Widget Library */}
        {showLibrary && editMode && (
          <div className="w-52 border-r bg-gray-50 p-3 overflow-y-auto shrink-0" style={{ borderColor: theme.border.default }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold">Widgets</h3>
              <button onClick={() => setShowLibrary(false)}><X size={13} className="text-gray-400" /></button>
            </div>
            {Object.entries(WIDGET_DEFS).map(([id, def]) => {
              if (id === 'floorStatus' && !isRestaurant) return null
              const isHidden = hiddenWidgets.has(id)
              const Icon = def.icon
              return (
                <div key={id} className="bg-white rounded-lg border border-gray-200 p-2 mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[10px] font-semibold truncate">{def.name}</span>
                  </div>
                  {def.removable ? (
                    <button onClick={() => isHidden ? showWidget(id) : hideWidget(id)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isHidden ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {isHidden ? 'Show' : 'Hide'}
                    </button>
                  ) : <Lock size={9} className="text-gray-300" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {editMode && (
            <div className="mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 font-medium"
              style={{ background: `${theme.brand.gold}10`, color: theme.text.secondary, border: `1px solid ${theme.brand.gold}30` }}>
              <Grip size={12} style={{ color: theme.brand.gold }} />
              Drag the header bar to move widgets. Drag edges to resize. Click the lock to pin.
            </div>
          )}

          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: visibleLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 }}
            rowHeight={80}
            margin={[16, 16]}
            compactType="vertical"
            preventCollision={false}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={(layout) => handleLayoutChange(layout)}
            draggableHandle=".widget-drag-handle"
          >
            {visibleLayout.map(item => {
              const def = WIDGET_DEFS[item.i]
              const isLocked = lockedWidgets.has(item.i)
              return (
                <div key={item.i}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col ${
                    editMode ? 'shadow-sm hover:shadow-md' : 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                  }`}
                  style={{ borderColor: editMode ? theme.border.default : theme.border.light }}>

                  {/* Drag handle header — only in edit mode */}
                  {editMode && (
                    <div className={`widget-drag-handle flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${
                      isLocked ? 'bg-gray-50 cursor-default' : 'bg-gray-50/50 cursor-grab active:cursor-grabbing'
                    }`} style={{ borderColor: theme.border.light }}>
                      <div className="flex items-center gap-2">
                        <Grip size={11} className="text-gray-300" />
                        <span className="text-[10px] font-semibold text-gray-400">{def?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleLock(item.i)}
                          className={`p-0.5 rounded ${isLocked ? 'bg-amber-100' : 'hover:bg-gray-200'}`}>
                          {isLocked ? <Lock size={10} className="text-amber-600" /> : <Unlock size={10} className="text-gray-400" />}
                        </button>
                        {def?.removable && (
                          <button onClick={() => hideWidget(item.i)} className="p-0.5 rounded hover:bg-red-50">
                            <EyeOff size={10} className="text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Widget content */}
                  <div className="flex-1 p-4 overflow-hidden min-h-0">
                    {renderWidget(item.i)}
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

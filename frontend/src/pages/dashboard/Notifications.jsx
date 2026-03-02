import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import { Bell, Calendar, ShoppingBag, Star, User, XCircle, AlertTriangle, RefreshCw, Inbox, Check } from 'lucide-react'

const ICON_MAP = { calendar: Calendar, 'shopping-bag': ShoppingBag, star: Star, user: User, 'x-circle': XCircle, 'alert-triangle': AlertTriangle }
const TYPE_STYLES = {
  booking: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  order: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  review: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  staff: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-100' },
}

export default function Notifications() {
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id
  const [notifications, setNotifications] = useState([])
  const [grouped, setGrouped] = useState({ today: [], yesterday: [], earlier: [] })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dismissed, setDismissed] = useState(new Set())

  const load = useCallback(async () => {
    if (!bid) return
    try {
      setLoading(true)
      const res = await api.get(`/notifications/business/${bid}?days=14&limit=100`)
      setNotifications(res.notifications || [])
      setGrouped(res.grouped || { today: [], yesterday: [], earlier: [] })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [bid])

  useEffect(() => { load() }, [load])
  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]))
  const filterNotifs = (list) => { let f = list.filter(n => !dismissed.has(n.id)); if (filter !== 'all') f = f.filter(n => n.type === filter); return f }
  const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

  const NotifItem = ({ n }) => {
    const Icon = ICON_MAP[n.icon] || Bell
    const s = TYPE_STYLES[n.type] || TYPE_STYLES.staff
    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${s.border} ${s.bg} group transition-all hover:shadow-sm`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.text} shrink-0`}><Icon size={16} /></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{n.text}</p><p className="text-[10px] text-gray-400 mt-0.5">{fmtTime(n.time)}</p></div>
        <button onClick={() => dismiss(n.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-all"><Check size={14} /></button>
      </div>
    )
  }

  const Section = ({ title, items }) => { const f = filterNotifs(items); if (!f.length) return null; return (<div className="space-y-2"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{title}</h3><div className="space-y-2">{f.map(n => <NotifItem key={n.id} n={n} />)}</div></div>) }

  if (loading && !notifications.length) return (<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-[#111111] rounded-full" /></div>)

  return (
    <div className="space-y-6" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[{key:'all',label:'All'},{key:'booking',label:'Bookings'},{key:'order',label:'Orders'},{key:'review',label:'Reviews'},{key:'staff',label:'Staff'}].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${filter === f.key ? 'bg-[#111111] text-white shadow-lg shadow-[#111111]/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>{f.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {dismissed.size > 0 && <button onClick={() => setDismissed(new Set())} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Undo</button>}
          <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>
      {filterNotifs(notifications).length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-bold text-gray-400">No notifications</p>
          <p className="text-xs text-gray-300 mt-1">Activity from bookings, orders, and reviews will appear here</p>
        </div>
      )}
      <div className="space-y-6">
        <Section title="Today" items={grouped.today} />
        <Section title="Yesterday" items={grouped.yesterday} />
        <Section title="Earlier" items={grouped.earlier} />
      </div>
    </div>
  )
}

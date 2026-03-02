/**
 * EPOS Kitchen Display System — live ticket queue, station config
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import { Flame, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const KDS = () => {
  const { business } = useBusiness()
  const [tickets, setTickets] = useState([])
  const [stations, setStations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeStation, setActiveStation] = useState('all')

  const fetchData = useCallback(async () => {
    if (!business?.id) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [ticketRes, statsRes] = await Promise.all([
        fetch(`${API}/kds/business/${business.id}/tickets?status=pending,in_progress`, { headers }).then(r => r.json()).catch(() => ({ tickets: [] })),
        fetch(`${API}/kds/business/${business.id}/analytics`, { headers }).then(r => r.json()).catch(() => null),
      ])
      setTickets(ticketRes.tickets || [])
      setStats(statsRes)

      // Get KDS config from business
      const config = business?.kds_config || {}
      setStations(config.stations || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const iv = setInterval(fetchData, 15000) // refresh every 15s
    return () => clearInterval(iv)
  }, [fetchData])

  const filteredTickets = activeStation === 'all'
    ? tickets
    : tickets.filter(t => t.station_id === activeStation)

  const getUrgencyColor = (mins) => {
    if (mins > 20) return 'border-red-500 bg-red-50'
    if (mins > 15) return 'border-orange-400 bg-orange-50'
    if (mins > 10) return 'border-amber-400 bg-amber-50'
    return 'border-emerald-400 bg-emerald-50'
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-gray-200 border-t-[#111] rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-[1200px] mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Kitchen Display</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} active ticket{tickets.length !== 1 ? 's' : ''} · Auto-refreshes every 15s</p>
        </div>
      </div>

      {/* Station filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStation('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeStation === 'all' ? 'bg-[#111] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
        >All Stations ({tickets.length})</button>
        {stations.map(s => {
          const count = tickets.filter(t => t.station_id === s.id).length
          return (
            <button
              key={s.id}
              onClick={() => setActiveStation(s.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeStation === s.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={activeStation === s.id ? { backgroundColor: s.color } : {}}
            >
              {s.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Prep Time</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{stats.avg_prep_time_minutes?.toFixed(1) || '–'} min</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed Today</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{stats.completed_today || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Progress</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{stats.in_progress || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Throughput/hr</p>
            <p className="text-2xl font-bold text-[#111] mt-1">{stats.throughput_per_hour?.toFixed(1) || '–'}</p>
          </div>
        </div>
      )}

      {/* Tickets */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-300 mb-3" />
          <p className="text-lg font-bold text-gray-400">Kitchen Clear</p>
          <p className="text-sm text-gray-400 mt-1">No active tickets — all caught up</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => {
            const age = Math.round((Date.now() - new Date(ticket.created_at).getTime()) / 60000)
            return (
              <div key={ticket._id} className={`rounded-xl border-l-4 ${getUrgencyColor(age)} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-black text-[#111]">#{ticket.order_number || '–'}</span>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className={`text-xs font-bold ${age > 15 ? 'text-red-600' : 'text-gray-500'}`}>{age}m</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ticket.order_type === 'dine_in' ? 'bg-blue-100 text-blue-700' :
                    ticket.order_type === 'takeaway' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{ticket.order_type?.replace('_', ' ') || 'dine in'}</span>
                  {ticket.table_number && <span className="text-[10px] font-bold text-gray-500">Table {ticket.table_number}</span>}
                  {ticket.priority === 'rush' && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">RUSH</span>}
                </div>
                <div className="space-y-1.5">
                  {(ticket.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${item.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                        {item.status === 'done' ? '✓' : ''}
                      </span>
                      <span className={`text-sm ${item.status === 'done' ? 'line-through text-gray-400' : 'text-[#111] font-medium'}`}>
                        {item.qty > 1 ? `${item.qty}× ` : ''}{item.name}
                      </span>
                      {item.modifiers?.length > 0 && (
                        <span className="text-[10px] text-gray-400">{item.modifiers.join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Station config */}
      {stations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Station Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stations.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-bold text-sm text-[#111]">{s.name}</span>
                  <span className={`ml-auto text-[10px] font-bold uppercase ${s.active ? 'text-emerald-600' : 'text-gray-400'}`}>{s.active ? 'Active' : 'Off'}</span>
                </div>
                <p className="text-xs text-gray-500">{s.type} · Routes: {s.categories?.join(', ') || 'all'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default KDS

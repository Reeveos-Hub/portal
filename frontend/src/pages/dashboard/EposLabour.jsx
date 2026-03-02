/**
 * EPOS Labour & Rota — staff hours, labour cost %, clock in/out, tips
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import { Clock, Users, TrendingDown, DollarSign } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

const Labour = () => {
  const { business } = useBusiness()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!business?.id) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API}/labour/business/${business.id}/dashboard`, { headers })
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [business?.id])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-gray-200 border-t-[#111] rounded-full animate-spin" /></div>

  const clocked = dashboard?.staff_on_clock || []
  const labourPct = dashboard?.labour_cost_percentage || 0
  const totalHours = dashboard?.total_hours_today || 0
  const totalCost = dashboard?.total_labour_cost_today || 0

  return (
    <div className="p-6 max-w-[1200px] mx-auto" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Labour & Rota</h1>
          <p className="text-sm text-gray-500 mt-0.5">Staff hours, labour cost tracking, and tip distribution</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">On Clock Now</p>
          <p className="text-2xl font-bold text-[#111] mt-1">{clocked.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${labourPct > 30 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Labour Cost %</p>
          <p className={`text-2xl font-bold mt-1 ${labourPct > 30 ? 'text-red-600' : labourPct > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {labourPct.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hours Today</p>
          <p className="text-2xl font-bold text-[#111] mt-1">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost Today</p>
          <p className="text-2xl font-bold text-[#111] mt-1">£{totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Staff on clock */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#111]">Staff On Clock</h2>
        </div>
        {clocked.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No staff currently clocked in</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clocked.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {(s.name || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.role || 'Staff'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#111]">{s.hours_today?.toFixed(1) || '0'}h</p>
                  <p className="text-[10px] text-gray-400">Clocked in {s.clock_in_time || '–'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EPOS staff from business config */}
      {business?.epos_settings?.staff_pins && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#111]">EPOS Staff PINs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {business.epos_settings.staff_pins.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                    {(s.name || '?')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">PIN: {s.pin}</span>
                  <div className="flex flex-wrap gap-1">
                    {(s.permissions || []).slice(0, 3).map(p => (
                      <span key={p} className="text-[9px] font-bold uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                    {(s.permissions || []).length > 3 && (
                      <span className="text-[9px] font-bold text-gray-400">+{s.permissions.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Labour

/**
 * Analytics — renders Payments component with analytics tab pre-selected
 */
import { useState, useEffect } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import {
  PoundSterling, Users, TrendingUp, TrendingDown,
  BarChart3, Calendar, Star, Clock
} from 'lucide-react'

export default function Analytics() {
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [chartRange, setChartRange] = useState('30')

  useEffect(() => {
    if (!bid) { setLoading(false); return }
    const load = async () => {
      try {
        const res = await api.get(`/dashboard/business/${bid}/summary`)
        setStats(res)
      } catch (e) { console.error('Analytics load error:', e) }
      setLoading(false)
    }
    load()
  }, [bid])

  if (loading) return <AppLoader message="Loading analytics..." />

  const t = stats?.today || {}
  const p = stats?.period || {}

  const kpis = [
    { label: 'Total Revenue', value: `£${(t.revenue || 0).toLocaleString()}`, icon: PoundSterling, trend: p.revenueChange, color: '#10B981' },
    { label: 'Occupancy', value: `${t.occupancy || 0}%`, icon: Users, trend: null, color: '#6366F1' },
    { label: 'Bookings', value: t.bookings || 0, icon: Calendar, trend: p.bookingsChange, color: '#111' },
    { label: 'No-Show Rate', value: `${t.noShowRate || 0}%`, icon: Clock, trend: null, color: '#EF4444' },
  ]

  return (
    <div style={{ fontFamily: "'Figtree', sans-serif", padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>Analytics</h1>
        <p style={{ fontSize: 13, color: '#888' }}>Business performance overview</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB', padding: 20, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={18} color={k.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>{k.value}</div>
            {k.trend != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, fontWeight: 600, color: k.trend >= 0 ? '#10B981' : '#EF4444' }}>
                {k.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(k.trend)}% vs last 30 days
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>Revenue & Occupancy</h2>
            <p style={{ fontSize: 12, color: '#999' }}>Performance over time</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['30', '90'].map(r => (
              <button key={r} onClick={() => setChartRange(r)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: chartRange === r ? '#111' : '#F5F5F5',
                color: chartRange === r ? '#fff' : '#888',
                fontFamily: "'Figtree', sans-serif",
              }}>{r} Days</button>
            ))}
          </div>
        </div>
        {(() => {
          const days = parseInt(chartRange)
          const bars = Array.from({ length: days }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
            return { day: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: Math.floor(Math.random() * 500 + 200) }
          })
          const max = Math.max(...bars.map(b => b.value))
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: days > 60 ? 2 : 4, height: 200 }}>
              {bars.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{
                    width: '100%', borderRadius: 4,
                    height: `${(b.value / max) * 100}%`,
                    background: i === bars.length - 1 ? '#C9A84C' : '#111',
                    opacity: i === bars.length - 1 ? 1 : 0.7 + (i / bars.length) * 0.3,
                    minHeight: 4,
                  }} />
                  {(days <= 30 && i % 5 === 0) && <span style={{ fontSize: 8, color: '#BBB', marginTop: 4, whiteSpace: 'nowrap' }}>{b.day}</span>}
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Staff & Top Services */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>Staff Performance</h2>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Revenue by team member</p>
          {(stats?.staffPerformance || [
            { name: 'Emily', revenue: 6930 },
            { name: 'Jen', revenue: 5360 },
            { name: 'Natalie', revenue: 4350 },
            { name: 'Grace', revenue: 3150 },
          ]).map((s, i) => {
            const maxRev = 7000
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>£{(s.revenue || 0).toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#F0F0F0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: '#111', width: `${((s.revenue || 0) / maxRev) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBEB', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>Booking Channels</h2>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Where bookings come from</p>
          {(stats?.channels || [
            { name: 'Seed Data', pct: 45 },
            { name: 'Online', pct: 30 },
            { name: 'Booking Link', pct: 15 },
            { name: 'Walk-in', pct: 10 },
          ]).map((c, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{c.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{c.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#F0F0F0', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : i === 2 ? '#C9A84C' : '#8B5CF6', width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

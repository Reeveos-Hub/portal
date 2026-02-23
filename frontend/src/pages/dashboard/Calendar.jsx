/**
 * Run 3: Calendar — polished day view with time axis, staff columns, booking blocks
 * Handles empty data gracefully. Matches UXPilot design.
 */

import { useState, useEffect, useRef } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)

const STATUS_COLORS = {
  confirmed: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  pending: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
  checked_in: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
  completed: { bg: '#F3E5F5', border: '#9C27B0', text: '#6A1B9A' },
  cancelled: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  default: { bg: '#F0FDF4', border: '#22C55E', text: '#1B4332' },
}

const Calendar = () => {
  const { business, businessType } = useBusiness()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [view, setView] = useState('day')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  const isRestaurant = businessType === 'restaurant'
  const bid = business?.id ?? business?._id

  useEffect(() => {
    if (!bid) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const endpoint = isRestaurant
      ? `/calendar/business/${bid}/restaurant?date=${selectedDate}&view=${view}`
      : `/calendar/business/${bid}?date=${selectedDate}&view=${view}`
    api.get(endpoint)
      .then((d) => setData(d))
      .catch((err) => { console.error('Calendar:', err); setError('Could not load calendar'); setData(null) })
      .finally(() => setLoading(false))
  }, [bid, selectedDate, view, isRestaurant])

  useEffect(() => {
    if (scrollRef.current) {
      const hour = new Date().getHours()
      scrollRef.current.scrollTop = Math.max(0, (hour - 8) * 80 - 40)
    }
  }, [loading])

  const goPrev = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)) }
  const goNext = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().slice(0, 10)) }
  const goToday = () => setSelectedDate(new Date().toISOString().slice(0, 10))
  const isToday = selectedDate === new Date().toISOString().slice(0, 10)

  const dateLabel = new Date(selectedDate + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const staffColumns = data?.staff?.length > 0 ? data.staff : [{ id: 'all', name: 'All Bookings' }]
  const bookings = data?.bookings || []

  const now = new Date()
  const timeLineTop = ((now.getHours() * 60 + now.getMinutes()) - 480) / 60 * 80

  const getPos = (b) => {
    const [h, m] = (b.time || '9:00').split(':').map(Number)
    return { top: Math.max(0, ((h * 60 + (m || 0)) - 480) / 60 * 80), height: Math.max(30, ((b.duration || 60) / 60) * 80) }
  }

  const getColors = (s) => STATUS_COLORS[s] || STATUS_COLORS.default

  if (!bid) return <div className="text-center py-12"><p className="text-muted">No business selected</p></div>

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Calendar</h1>
          <p className="text-sm text-muted mt-1">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {['day', 'week'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${view === v ? 'bg-primary text-white' : 'bg-white text-muted hover:bg-gray-50'}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={goPrev} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-gray-50"><i className="fa-solid fa-chevron-left text-xs text-muted" /></button>
            <button onClick={goToday} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isToday ? 'bg-primary text-white' : 'border border-border bg-white text-primary hover:bg-gray-50'}`}>Today</button>
            <button onClick={goNext} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-gray-50"><i className="fa-solid fa-chevron-right text-xs text-muted" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-sm text-muted">Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-exclamation-triangle text-red-400" />
            </div>
            <p className="text-sm text-muted">{error}</p>
            <button onClick={() => { setError(null); setLoading(true) }} className="mt-3 text-sm text-primary font-medium hover:underline">Try again</button>
          </div>
        ) : (
          <>
            {/* Staff headers */}
            <div className="flex border-b border-border sticky top-0 bg-white z-10">
              <div className="w-16 shrink-0 border-r border-border" />
              {staffColumns.map((s) => (
                <div key={s.id} className="flex-1 min-w-[140px] px-3 py-3 border-r border-border last:border-r-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{s.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide truncate">{s.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div ref={scrollRef} className="relative overflow-y-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
              {HOURS.map((hour) => (
                <div key={hour} className="flex" style={{ height: '80px' }}>
                  <div className="w-16 shrink-0 border-r border-border pr-2 text-right">
                    <span className="text-[11px] text-muted font-medium -mt-2 block">
                      {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                  </div>
                  {staffColumns.map((s) => (
                    <div key={s.id} className="flex-1 min-w-[140px] border-r border-border last:border-r-0 border-b border-border/50 relative" />
                  ))}
                </div>
              ))}

              {/* Bookings */}
              {bookings.map((b) => {
                const pos = getPos(b)
                const colors = getColors(b.status)
                const idx = Math.max(0, staffColumns.findIndex((s) => s.id === b.staffId || s.id === 'all'))
                const pct = 100 / staffColumns.length
                return (
                  <div key={b.id} className="absolute rounded-md px-2 py-1.5 cursor-pointer transition-all hover:shadow-md overflow-hidden"
                    style={{ top: `${pos.top}px`, height: `${pos.height}px`, left: `calc(64px + ${idx * pct}% + 4px)`, width: `calc(${pct}% - 8px)`, backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}>
                    <p className="text-[11px] font-bold truncate" style={{ color: colors.text }}>{b.time} — {b.customerName || 'Walk-in'}</p>
                    <p className="text-[10px] truncate" style={{ color: colors.text, opacity: 0.7 }}>{b.service || 'Appointment'}{b.duration ? ` · ${b.duration}m` : ''}</p>
                  </div>
                )
              })}

              {/* Current time line */}
              {isToday && timeLineTop > 0 && timeLineTop < HOURS.length * 80 && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${timeLineTop}px` }}>
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 ml-[52px]" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}

              {/* Empty state */}
              {bookings.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <i className="fa-regular fa-calendar text-gray-300 text-xl" />
                    </div>
                    <p className="text-sm text-muted">No bookings for this date</p>
                    <p className="text-xs text-muted/60 mt-1">Bookings will appear here as they come in</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Calendar

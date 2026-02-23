/**
 * Rezvo Calendar — polished, Fresha-level service calendar
 * Staff columns, solid colour blocks, crosshair hover, FAB, animated badges
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8AM - 9PM

const STAFF_COLORS = [
  { bg: '#E8634A', light: '#FDE8E4' },
  { bg: '#3B82F6', light: '#DBEAFE' },
  { bg: '#8B5CF6', light: '#EDE9FE' },
  { bg: '#F59E0B', light: '#FEF3C7' },
  { bg: '#22C55E', light: '#DCFCE7' },
  { bg: '#EC4899', light: '#FCE7F3' },
  { bg: '#14B8A6', light: '#CCFBF1' },
  { bg: '#6366F1', light: '#E0E7FF' },
]

const STATUS_ICONS = {
  confirmed: '✓',
  checked_in: '→',
  completed: '✓✓',
  no_show: '✗',
  pending: '⏳',
}

const Calendar = () => {
  const { business, businessType, isDemo } = useBusiness()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [view, setView] = useState('day')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredSlot, setHoveredSlot] = useState(null) // { staffIdx, hour }
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [fabOpen, setFabOpen] = useState(false)
  const [colorMode, setColorMode] = useState('staff') // staff | service | status
  const scrollRef = useRef(null)

  const bid = business?.id ?? business?._id
  const isRestaurant = businessType === 'restaurant'

  // Fetch calendar data
  useEffect(() => {
    if (!bid || isDemo) {
      setLoading(false)
      setData({ staff: [], bookings: [] })
      return
    }
    setLoading(true)
    setError(null)
    const endpoint = isRestaurant
      ? `/calendar/business/${bid}/restaurant?date=${selectedDate}&view=${view}`
      : `/calendar/business/${bid}?date=${selectedDate}&view=${view}`
    api.get(endpoint)
      .then((d) => setData(d))
      .catch((err) => {
        console.error('Calendar fetch error:', err)
        setError('Could not load calendar')
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [bid, selectedDate, view, isRestaurant, isDemo])

  // Scroll to current time on load
  useEffect(() => {
    if (scrollRef.current && !loading) {
      const hour = new Date().getHours()
      scrollRef.current.scrollTop = Math.max(0, (hour - 8) * 80 - 100)
    }
  }, [loading])

  // Navigation
  const goPrev = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)) }
  const goNext = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().slice(0, 10)) }
  const goToday = () => setSelectedDate(new Date().toISOString().slice(0, 10))
  const isToday = selectedDate === new Date().toISOString().slice(0, 10)

  const dateLabel = new Date(selectedDate + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const staffColumns = data?.staff?.length > 0 ? data.staff : [{ id: 'all', name: 'All Bookings' }]
  const bookings = data?.bookings || []

  // Current time position
  const now = new Date()
  const timeLineTop = ((now.getHours() * 60 + now.getMinutes()) - 480) / 60 * 80

  // Position calculation
  const getPos = (b) => {
    const [h, m] = (b.time || '9:00').split(':').map(Number)
    return {
      top: Math.max(0, ((h * 60 + (m || 0)) - 480) / 60 * 80),
      height: Math.max(30, ((b.duration || 60) / 60) * 80)
    }
  }

  // Color for booking block
  const getBlockColor = useCallback((booking, staffIdx) => {
    if (colorMode === 'status') {
      const statusColors = {
        confirmed: { bg: '#22C55E', text: '#111' },
        pending: { bg: '#F59E0B', text: '#111' },
        checked_in: { bg: '#3B82F6', text: '#111' },
        completed: { bg: '#9CA3AF', text: '#111' },
        no_show: { bg: '#EF4444', text: '#fff' },
      }
      return statusColors[booking.status] || statusColors.confirmed
    }
    const c = STAFF_COLORS[staffIdx % STAFF_COLORS.length]
    return { bg: c.light, text: '#111' }
  }, [colorMode])

  if (!bid) return <div className="text-center py-12"><p className="text-muted">No business selected</p></div>

  return (
    <div className="h-full flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Calendar</h1>
          <p className="text-sm text-muted mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle pills */}
          <div className="flex bg-gray-100 rounded-full p-1">
            {['Day', 'Week'].map(v => (
              <button key={v} onClick={() => setView(v.toLowerCase())}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${view === v.toLowerCase() ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary'}`}>
                {v}
              </button>
            ))}
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button onClick={goPrev} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors">
              <i className="fa-solid fa-chevron-left text-xs text-muted" />
            </button>
            <button onClick={goToday} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${isToday ? 'bg-primary text-white' : 'hover:bg-white text-primary'}`}>
              Today
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors">
              <i className="fa-solid fa-chevron-right text-xs text-muted" />
            </button>
          </div>

          {/* Color mode */}
          <select value={colorMode} onChange={e => setColorMode(e.target.value)}
            className="bg-gray-100 rounded-full px-3 py-2 text-xs font-semibold text-primary border-0 cursor-pointer">
            <option value="staff">By Staff</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="text-center py-16 flex-1 flex items-center justify-center">
            <div>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-sm text-muted">Loading calendar...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => { setError(null); setLoading(true) }} className="mt-3 text-sm text-primary font-medium hover:underline">Try again</button>
          </div>
        ) : (
          <>
            {/* Staff headers */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
              <div className="w-16 shrink-0 border-r border-gray-200" />
              {staffColumns.map((s, idx) => {
                const c = STAFF_COLORS[idx % STAFF_COLORS.length]
                const isHovered = hoveredSlot?.staffIdx === idx
                return (
                  <div key={s.id} className="flex-1 min-w-[160px] px-3 py-3 border-r border-gray-200 last:border-r-0 transition-colors duration-150"
                    style={{ backgroundColor: isHovered ? `${c.bg}10` : 'transparent', borderBottom: isHovered ? `3px solid ${c.bg}` : '3px solid transparent' }}>
                    <div className="flex items-center gap-2">
                      {/* Double-ring avatar (Fresha style) */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ border: `2.5px solid ${c.bg}`, padding: '2px' }}>
                          <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: c.bg }}>
                            {s.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{s.name}</span>
                        <span className="text-[10px] text-gray-500">{bookings.filter(b => b.staffId === s.id || s.id === 'all').length} bookings</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div ref={scrollRef} className="relative overflow-y-auto flex-1" style={{ minHeight: '400px' }}>
              {HOURS.map((hour) => (
                <div key={hour} className="flex" style={{ height: '80px' }}>
                  <div className="w-16 shrink-0 border-r border-gray-200 pr-2 text-right">
                    <span className={`text-[11px] font-semibold -mt-2 block transition-colors ${hoveredSlot?.hour === hour ? 'text-primary font-bold' : 'text-gray-500'}`}>
                      {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                  </div>
                  {staffColumns.map((s, sIdx) => {
                    const isColHover = hoveredSlot?.staffIdx === sIdx
                    const isRowHover = hoveredSlot?.hour === hour
                    return (
                      <div key={s.id}
                        className="flex-1 min-w-[160px] border-r border-gray-200 last:border-r-0 border-b relative cursor-pointer"
                        style={{
                          borderBottomColor: '#f0f0f0',
                          backgroundColor: isColHover && isRowHover ? 'rgba(27,67,50,0.06)' : isColHover ? 'rgba(27,67,50,0.02)' : isRowHover ? 'rgba(27,67,50,0.02)' : 'transparent',
                        }}
                        onMouseEnter={() => setHoveredSlot({ staffIdx: sIdx, hour })}
                        onMouseLeave={() => setHoveredSlot(null)}
                      />
                    )
                  })}
                </div>
              ))}

              {/* ── Booking blocks ── */}
              {bookings.map((b) => {
                const pos = getPos(b)
                const sIdx = Math.max(0, staffColumns.findIndex(s => s.id === b.staffId || s.id === 'all'))
                const colors = getBlockColor(b, sIdx)
                const staffColor = STAFF_COLORS[sIdx % STAFF_COLORS.length]
                const pct = 100 / staffColumns.length
                const isSelected = selectedBooking?.id === b.id

                return (
                  <div key={b.id}
                    onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)}
                    className="absolute cursor-pointer transition-all duration-150 group"
                    style={{
                      top: `${pos.top}px`,
                      height: `${pos.height}px`,
                      left: `calc(64px + ${sIdx * pct}% + 3px)`,
                      width: `calc(${pct}% - 6px)`,
                      backgroundColor: colors.bg,
                      borderLeft: `4px solid ${staffColor.bg}`,
                      borderRadius: '4px',
                      zIndex: isSelected ? 15 : 10,
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? `0 4px 12px ${staffColor.bg}40` : '0 1px 3px rgba(0,0,0,0.08)',
                    }}>
                    <div className="px-2 py-1 h-full overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-900 truncate">{b.time} — {b.customerName || 'Walk-in'}</span>
                        {b.status === 'completed' && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-600 text-white shrink-0">✓ Done</span>
                        )}
                        {b.status === 'no_show' && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white shrink-0">✗ No-show</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-700 truncate mt-0.5">{b.service} · {b.duration}min</p>
                      {b.price > 0 && pos.height > 45 && (
                        <p className="text-[10px] font-semibold text-gray-800 mt-0.5">£{Number(b.price).toFixed(0)}</p>
                      )}
                      {b.isNewClient && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-white animate-pulse">★ New Client</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Current time line */}
              {isToday && timeLineTop > 0 && timeLineTop < HOURS.length * 80 && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${timeLineTop}px` }}>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 ml-[51px]" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}

              {/* Empty state */}
              {bookings.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <i className="fa-regular fa-calendar text-gray-300 text-xl" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No bookings for this date</p>
                    <p className="text-xs text-gray-400 mt-1">Bookings will appear here as they come in</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FAB Button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-52 animate-fade-in">
            {[
              { icon: 'fa-calendar-plus', label: 'New Appointment', color: '#22C55E' },
              { icon: 'fa-clock', label: 'Block Time', color: '#F59E0B' },
              { icon: 'fa-ban', label: 'Add Time Off', color: '#EF4444' },
            ].map(item => (
              <button key={item.label} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                  <i className={`fa-solid ${item.icon} text-sm`} style={{ color: item.color }} />
                </div>
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
          style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <i className="fa-solid fa-plus text-lg" />
        </button>
      </div>

      {/* ── Selected booking detail panel ── */}
      {selectedBooking && (
        <div className="fixed bottom-24 right-6 z-40 bg-white rounded-xl shadow-xl border border-gray-200 w-72 overflow-hidden">
          <div className="p-4" style={{ borderTop: `4px solid ${STAFF_COLORS[0].bg}` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{selectedBooking.customerName || 'Walk-in'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.service}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-clock w-4" />
                <span>{selectedBooking.time} · {selectedBooking.duration}min</span>
              </div>
              {selectedBooking.staffName && (
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-user w-4" />
                  <span>{selectedBooking.staffName}</span>
                </div>
              )}
              {selectedBooking.price > 0 && (
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-sterling-sign w-4" />
                  <span>£{Number(selectedBooking.price).toFixed(2)}</span>
                </div>
              )}
              {selectedBooking.notes && (
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-note-sticky w-4" />
                  <span>{selectedBooking.notes}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                Check In
              </button>
              <button className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar

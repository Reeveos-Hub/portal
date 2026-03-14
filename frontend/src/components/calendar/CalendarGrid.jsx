/**
 * CalendarGrid — CSS Grid replacement for the Calendar day view grid.
 * 
 * Uses CSS Grid with minmax(18px, auto) rows so cards auto-size to content.
 * Zero clipping. Every card shows full name, service, price, badges.
 * 
 * This is a RENDERING component only. All state management stays in Calendar.jsx.
 * It receives data and callbacks as props.
 */

import { useState, useEffect, useRef, useMemo } from 'react'

/* ── Constants ── */
const SH = 8, EH = 24
const SLOTS_PER_HR = 4 // 15-min slots
const TCW = 52

const timeToSlot = (t) => Math.max(0, Math.floor((t - SH) * SLOTS_PER_HR))
const durToSlots = (dur) => Math.max(1, Math.ceil(dur * SLOTS_PER_HR))
const fmtTime = (t) => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${h}:${String(m).padStart(2, '0')}` }
const fmtAP = (h) => { const hr = h > 12 ? h - 12 : h === 0 ? 12 : h; return `${hr}${h >= 12 ? 'pm' : 'am'}` }

/* ── Inline SVG icons (monochrome, no emoji) ── */
const GripIcon = () => <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/></svg>
const SICheck = ({ s = 10, c = '#111' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
const SIClock = ({ s = 10, c = '#111' }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const StarIcon = () => <svg width={10} height={10} viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5"/></svg>
const PlusIcon = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

/* ── LiveTimer for checked-in appointments ── */
const LiveTimer = ({ startedAt }) => {
  const [el, setEl] = useState(0)
  useEffect(() => {
    const t = () => setEl(Math.floor((Date.now() - startedAt) / 1000))
    t(); const iv = setInterval(t, 1000); return () => clearInterval(iv)
  }, [startedAt])
  const m = Math.floor(el / 60), s = el % 60
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{m}:{String(s).padStart(2, '0')}</span>
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const CalendarGrid = ({
  staffColumns = [],
  filteredBookings = [],
  blocks = [],
  allBookings = [],
  isToday = false,
  tp = 0,           // current time position (hours * HH)
  ts = '',          // current time string "11:30"
  isFullscreen = false,
  // State from parent
  selA = null,
  hovA = null,
  drag = null,
  checkedInTimes = {},
  newCalBookingIds = new Set(),
  // Colour function
  gc = () => '#6BA3C7',
  // Callbacks
  setHovA = () => {},
  setSelA = () => {},
  setHovS = () => {},
  setHovSlot = () => {},
  setHoverCol = () => {},
  setHoverRow = () => {},
  onClickSlot = () => {},
  startDragMove = () => {},
  startDragResize = () => {},
  // Refs from parent
  scrollRef,
  gridRef,
  staffColRefs = { current: {} },
  // Pop component passed from parent (so we don't duplicate it)
  PopComponent = null,
}) => {
  const totHrs = EH - SH
  const totalSlots = totHrs * SLOTS_PER_HR

  /* ── Booking Card ── */
  const Bl = ({ a }) => {
    const isDragging = drag?.id === a.id
    const isNewBooking = newCalBookingIds.has(a.id)
    const bg = gc(a)
    const hov = hovA === a.id
    const sel = selA === a.id
    const done = a.status === 'completed'
    const isActive = a.status === 'checked_in'
    const isNoShow = a.status === 'no_show'

    const startSlot = timeToSlot(a.start)
    const endSlot = isDragging && drag.type === 'resize'
      ? startSlot + Math.max(1, Math.ceil((drag.ghostH || 20) / 20))
      : startSlot + durToSlots(a.dur)
    const staffIdx = staffColumns.findIndex(s => s.id === a.staffId)
    if (staffIdx < 0) return null

    if (isDragging && drag.type === 'move' && drag.ghostStaffId !== a.staffId) return null

    return (
      <>
        <div data-ap="1" data-booking-id={a.id}
          onMouseEnter={() => !drag && setHovA(a.id)}
          onMouseLeave={() => !drag && setHovA(null)}
          onMouseDown={e => {
            if (e.target.closest('[data-resize]')) return
            startDragMove(e, a)
          }}
          onClick={e => {
            if (drag) return
            e.stopPropagation()
            if (isFullscreen || window.innerWidth < 1024) {
              if (!sel) setSelA(a.id)
            } else {
              setSelA(sel ? null : a.id)
            }
          }}
          style={{
            gridRow: `${startSlot + 1} / ${endSlot + 1}`,
            gridColumn: staffIdx + 2,
            margin: '1px 3px',
            borderRadius: isActive ? 8 : 6,
            background: isActive ? 'linear-gradient(135deg, #111111, #222)' : done ? `${bg}60` : bg,
            opacity: isDragging ? 0.3 : done ? 0.7 : isNoShow ? 0.55 : 1,
            cursor: isDragging ? 'grabbing' : 'grab',
            color: isActive ? '#fff' : '#111',
            boxSizing: 'border-box',
            transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
            transform: isDragging ? 'scale(1.03)' : hov && !sel ? 'scale(1.012) translateY(-1px)' : 'none',
            animation: isActive ? 'activePulse 2s ease-in-out infinite' : isNewBooking ? 'calendarPulse 0.6s ease-out' : 'none',
            boxShadow: isActive ? '0 0 0 2px #C9A84C, 0 0 15px rgba(201,168,76,0.25), 0 0 30px rgba(201,168,76,0.1)'
              : isNewBooking ? `0 0 0 3px rgba(16,185,129,0.4), 0 8px 24px ${bg}25`
              : isDragging ? `0 12px 36px ${bg}40, 0 0 0 2px #fff, 0 0 0 4px ${bg}`
              : sel ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${bg}, 0 8px 24px ${bg}25`
              : hov ? `0 8px 24px ${bg}30` : `0 2px 6px ${bg}12`,
            zIndex: isDragging ? 40 : sel ? 30 : isActive ? 25 : hov ? 20 : 2,
            padding: '6px 10px',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Figtree', sans-serif",
            overflow: 'visible',
            position: 'relative',
          }}>
          {/* Grip handle (hover only) */}
          {!isDragging && (
            <div style={{ position: 'absolute', top: 4, left: 6, opacity: hov ? 0.6 : 0, transition: 'opacity 0.15s' }}>
              <GripIcon />
            </div>
          )}
          {/* Status icon */}
          <div style={{ position: 'absolute', top: 6, right: 7, opacity: 0.7 }}>
            {(a.status === 'confirmed' || a.status === 'completed') ? <SICheck /> : a.status === 'pending' ? <SIClock /> : null}
          </div>

          {/* Card content — always full, never truncated by height */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ fontSize: 9, opacity: 0.85, fontWeight: 700, letterSpacing: 0.3 }}>
              {fmtTime(a.start)} - {fmtTime(a.start + a.dur)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isActive && checkedInTimes[a.id] && (
                <span style={{ fontSize: 10, fontWeight: 800, color: '#C9A84C', background: 'rgba(201,168,76,0.15)', padding: '1px 8px', borderRadius: 6 }}>
                  <LiveTimer startedAt={checkedInTimes[a.id]} />
                </span>
              )}
              {(a.price || 0) > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', borderRadius: 6, padding: '2px 8px' }}>
                  £{a.price}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, marginBottom: 2, wordBreak: 'break-word' }}>
            {a.customerName}
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500, lineHeight: 1.2 }}>
            {typeof a.service === 'object' ? a.service?.name : a.service}
            {a.roomName ? ` · ${a.roomName}` : ''}
          </div>

          {/* Badges */}
          {isActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 8, fontWeight: 800, letterSpacing: 0.5, background: '#C9A84C', color: '#111', borderRadius: 20, padding: '4px 10px', textTransform: 'uppercase', width: 'fit-content' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#111' }} /> In Treatment
            </span>
          )}
          {a.isNewClient && !isActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(110deg, #111111 30%, #1a1a1a 50%, #111111 70%)', backgroundSize: '200% 100%', borderRadius: 20, padding: '4px 12px 4px 9px', textTransform: 'uppercase', width: 'fit-content', color: '#fff', animation: 'newPulse 2s ease-in-out infinite, shimmer 3s linear infinite', boxShadow: '0 2px 12px rgba(17,17,17,0.4)' }}>
              <StarIcon /> New Client
            </span>
          )}
          {a.status === 'completed' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1, background: '#22C55E', borderRadius: 20, padding: '4px 12px 4px 9px', textTransform: 'uppercase', width: 'fit-content', color: '#fff', boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}>
              ✓ Completed
            </span>
          )}

          {/* Resize handle */}
          <div data-resize="1" onMouseDown={e => startDragResize(e, a)} style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
            cursor: 'ns-resize', zIndex: 5,
            background: (hov || isDragging) ? `linear-gradient(transparent, ${bg}40)` : 'transparent',
            borderRadius: '0 0 6px 6px',
          }}>
            {(hov || isDragging) && (
              <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 20, height: 3, borderRadius: 2, background: '#00000030' }} />
            )}
          </div>
        </div>

        {/* Detail panel — rendered by parent's Pop component */}
        {sel && !isDragging && PopComponent && <PopComponent a={a} />}
      </>
    )
  }

  return (
    <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <div ref={gridRef} style={{
        display: 'grid',
        gridTemplateColumns: `${TCW}px repeat(${staffColumns.length}, 1fr)`,
        gridTemplateRows: `repeat(${totalSlots}, minmax(18px, auto))`,
        position: 'relative',
      }}>
        {/* ── Grid cells: time labels + borders ── */}
        {Array.from({ length: totalSlots }, (_, sl) => {
          const isHour = sl % SLOTS_PER_HR === 0
          const h = SH + Math.floor(sl / SLOTS_PER_HR)
          return [
            <div key={`t${sl}`} style={{
              gridRow: sl + 1, gridColumn: 1,
              borderTop: isHour ? '1px solid #E5E5E5' : 'none',
              display: 'flex', alignItems: 'start', justifyContent: 'flex-end',
              paddingRight: 6, paddingTop: isHour ? 1 : 0,
              background: '#fff', position: 'sticky', left: 0, zIndex: 5,
            }}>
              {isHour && <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>{fmtAP(h)}</span>}
            </div>,
            ...staffColumns.map((staff, ci) => (
              <div key={`c${sl}-${ci}`} style={{
                gridRow: sl + 1, gridColumn: ci + 2,
                borderTop: isHour ? '1px solid #E5E5E5' : '1px dashed #F0F0F0',
                borderLeft: '1px solid #EBEBEB',
                minHeight: 18,
              }} />
            ))
          ]
        }).flat()}

        {/* ── Staff column overlays (hover, click-to-book) ── */}
        {staffColumns.map((staff, ci) => (
          <div key={`ov-${staff.id}`}
            ref={el => { staffColRefs.current[staff.id] = el }}
            onMouseEnter={() => { if (!drag) { setHovS(staff.id); setHoverCol(staff.id) } }}
            onMouseLeave={() => { if (!drag) { setHovS(null); setHovSlot(null); setHoverCol(null); setHoverRow(null) } }}
            onClick={e => {
              if (drag || hovA || selA) return
              const r = e.currentTarget.getBoundingClientRect()
              const y = e.clientY - r.top
              const slotIdx = Math.floor(y / r.height * totalSlots)
              const slotHour = SH + slotIdx / SLOTS_PER_HR
              const h = Math.floor(slotHour)
              const m = Math.round((slotHour - h) * 60 / 15) * 15
              const timeStr = `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
              onClickSlot(staff.id, timeStr)
            }}
            style={{
              gridRow: '1 / -1', gridColumn: ci + 2,
              position: 'relative', zIndex: 1,
              background: drag?.ghostStaffId === staff.id ? 'rgba(17,17,17,0.03)' : 'transparent',
              cursor: drag ? (drag.type === 'resize' ? 'ns-resize' : 'grabbing') : hovA ? 'pointer' : 'cell',
              transition: 'background 0.15s ease',
            }}
          />
        ))}

        {/* ── Block time cards ── */}
        {staffColumns.map((staff, ci) =>
          (blocks || []).filter(b => b.allStaff || b.staffId === staff.id).map((b, i) => (
            <div key={`blk-${staff.id}-${i}`} style={{
              gridRow: `${timeToSlot(b.start) + 1} / ${timeToSlot(b.start) + durToSlots(b.dur) + 1}`,
              gridColumn: ci + 2, margin: '1px 4px', borderRadius: 4, zIndex: 2,
              background: b.type === 'meeting' ? 'repeating-linear-gradient(135deg,#D5D5D5,#D5D5D5 3px,#E8E8E8 3px,#E8E8E8 7px)' : '#ECECEC',
              border: '1px solid #D0D0D0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: 2 }}>{b.label}</span>
            </div>
          ))
        )}

        {/* ── Booking cards (CSS Grid placed, auto-sizing) ── */}
        {filteredBookings.map(a => <Bl key={a.id} a={a} />)}

        {/* ── Drag ghost in destination column ── */}
        {drag?.type === 'move' && (() => {
          const a = allBookings.find(b => b.id === drag.id)
          if (!a || a.staffId === drag.ghostStaffId) return null
          const ghostCI = staffColumns.findIndex(s => s.id === drag.ghostStaffId)
          if (ghostCI < 0) return null
          const bg = gc(a)
          return (
            <div key="drag-ghost" style={{ gridRow: '1 / -1', gridColumn: ghostCI + 2, position: 'relative', pointerEvents: 'none', zIndex: 40 }}>
              <div style={{
                position: 'absolute', top: drag.ghostTop + 1, left: 4, right: 4,
                height: (drag.ghostH || 60) - 2, borderRadius: 999,
                background: bg, opacity: 0.85,
                boxShadow: `0 12px 36px ${bg}40, 0 0 0 2px #fff, 0 0 0 4px ${bg}`,
                transform: 'scale(1.03)',
              }} />
            </div>
          )
        })()}

        {/* ── Current time red line ── */}
        {isToday && tp > 0 && (
          <div key="now-line" style={{ gridRow: '1 / -1', gridColumn: '1 / -1', position: 'relative', pointerEvents: 'none', zIndex: 15 }}>
            <div style={{ position: 'absolute', top: tp, left: TCW - 3, right: 0, height: 2, background: '#EF4444' }}>
              <div style={{ position: 'absolute', left: 0, top: -3.5, width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
            </div>
            <div style={{ position: 'absolute', top: tp - 8, left: 0, zIndex: 12, background: '#EF4444', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 5, boxShadow: '0 2px 6px rgba(239,68,68,0.25)' }}>{ts}</div>
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {filteredBookings.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p style={{ fontSize: 14, color: '#888', fontWeight: 600 }}>No bookings for this date</p>
            <p style={{ fontSize: 12, color: '#BBB', marginTop: 4 }}>Bookings will appear here as they come in</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarGrid

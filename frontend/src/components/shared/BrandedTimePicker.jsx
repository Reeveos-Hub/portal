/**
 * BrandedTimePicker — ReeveOS global time picker
 * Replaces ALL native <input type="time"> across the platform.
 * Gold clock icon, formatted display, scrollable time slot grid.
 *
 * Usage:
 *   <BrandedTimePicker label="Time" value={val} onChange={setVal} step={15} />
 */
import { useState, useRef, useEffect } from 'react'

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const generateSlots = (step = 15, startH = 0, endH = 24) => {
  const slots = []
  for (let h = startH; h < endH; h++) {
    for (let m = 0; m < 60; m += step) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
      const ampm = h >= 12 ? 'pm' : 'am'
      const label = `${hr}:${String(m).padStart(2, '0')} ${ampm}`
      slots.push({ value: val, label })
    }
  }
  return slots
}

const formatTime = (val) => {
  if (!val) return ''
  const [h, m] = val.split(':').map(Number)
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

const BrandedTimePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select time...',
  error,
  disabled = false,
  step = 15,
  startHour = 8,
  endHour = 21,
  style = {},
  compact = false,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const listRef = useRef(null)

  const slots = generateSlots(step, startHour, endHour)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  useEffect(() => {
    if (open && value && listRef.current) {
      const idx = slots.findIndex(s => s.value === value)
      if (idx > -1) {
        const el = listRef.current.children[idx]
        if (el) el.scrollIntoView({ block: 'center' })
      }
    }
  }, [open])

  const py = compact ? '7px 10px' : '10px 12px'
  const fs = compact ? 12 : 13

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Figtree', sans-serif" }}>{label}</label>}
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: py, border: `1.5px solid ${open ? '#C9A84C' : error ? '#EF4444' : '#EBEBEB'}`,
          borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#F3F4F6' : '#FAFAF8',
          fontFamily: "'Figtree', sans-serif", opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s', minHeight: 44, touchAction: 'manipulation',
        }}
      >
        <ClockIcon />
        <span style={{ fontSize: fs, fontWeight: 500, color: value ? '#111' : '#999', flex: 1 }}>{value ? formatTime(value) : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? '#C9A84C' : '#999'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && (
        <div ref={listRef} style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10,
          padding: 4, zIndex: 50, maxHeight: 200, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
        }}>
          {slots.map(s => (
            <div
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false) }}
              style={{
                padding: compact ? '5px 4px' : '6px 6px', borderRadius: 6,
                fontSize: compact ? 10 : 11, fontWeight: s.value === value ? 700 : 500,
                color: s.value === value ? '#C9A84C' : '#111',
                background: s.value === value ? '#F5F0E4' : 'transparent',
                cursor: 'pointer', textAlign: 'center',
                fontFamily: "'Figtree', sans-serif",
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (s.value !== value) e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { if (s.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3, fontWeight: 500 }}>{error}</div>}
    </div>
  )
}

export default BrandedTimePicker

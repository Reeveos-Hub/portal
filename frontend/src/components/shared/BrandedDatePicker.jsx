/**
 * BrandedDatePicker — ReeveOS global date picker
 * Replaces ALL native <input type="date"> across the platform.
 * Gold calendar icon, formatted display, native picker underneath.
 *
 * Usage:
 *   <BrandedDatePicker label="Date" value={val} onChange={setVal} />
 */
import { useRef } from 'react'

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const formatDate = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return val }
}

const BrandedDatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  error,
  disabled = false,
  min,
  max,
  style = {},
  compact = false,
}) => {
  const inputRef = useRef(null)

  const handleClick = () => {
    if (disabled) return
    if (inputRef.current) {
      inputRef.current.showPicker?.()
      inputRef.current.focus()
    }
  }

  const py = compact ? '7px 10px' : '10px 12px'
  const fs = compact ? 12 : 13

  return (
    <div style={{ position: 'relative', ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Figtree', sans-serif" }}>{label}</label>}
      <div
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: py, border: `1.5px solid ${error ? '#EF4444' : '#EBEBEB'}`,
          borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#F3F4F6' : '#FAFAF8',
          fontFamily: "'Figtree', sans-serif", opacity: disabled ? 0.6 : 1,
          position: 'relative', transition: 'border-color 0.15s',
          minHeight: 44, touchAction: 'manipulation',
        }}
      >
        <CalIcon />
        <span style={{ fontSize: fs, fontWeight: 500, color: value ? '#111' : '#999', flex: 1 }}>{value ? formatDate(value) : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
        <input
          ref={inputRef}
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          tabIndex={-1}
          style={{
            position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
            width: '100%', height: '100%', fontSize: 16,
          }}
        />
      </div>
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3, fontWeight: 500 }}>{error}</div>}
    </div>
  )
}

export default BrandedDatePicker

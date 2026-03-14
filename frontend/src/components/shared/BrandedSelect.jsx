/**
 * BrandedSelect — ReeveOS global dropdown
 * Replaces ALL native <select> elements across the platform.
 * Gold accent, Figtree font, custom dropdown panel, keyboard nav.
 *
 * Usage:
 *   <BrandedSelect label="Duration" value={val} onChange={setVal}
 *     options={[{ value: '30', label: '30 minutes' }, ...]} />
 */
import { useState, useRef, useEffect } from 'react'

const BrandedSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  error,
  disabled = false,
  style = {},
  compact = false,
}) => {
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const ref = useRef(null)

  const selected = options.find(o => (typeof o === 'string' ? o : o.value) === value)
  const displayLabel = selected ? (typeof selected === 'string' ? selected : selected.label) : placeholder

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  const handleKey = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open) }
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'ArrowDown' && open) { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, options.length - 1)) }
    if (e.key === 'ArrowUp' && open) { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && open && focusIdx >= 0) {
      const opt = options[focusIdx]
      onChange(typeof opt === 'string' ? opt : opt.value)
      setOpen(false)
    }
  }

  const pick = (opt) => {
    onChange(typeof opt === 'string' ? opt : opt.value)
    setOpen(false)
  }

  const py = compact ? '7px 10px' : '10px 12px'
  const fs = compact ? 12 : 13

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Figtree', sans-serif" }}>{label}</label>}
      <div
        tabIndex={disabled ? -1 : 0}
        role="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKey}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: py, border: `1.5px solid ${open ? '#C9A84C' : error ? '#EF4444' : '#EBEBEB'}`,
          borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#F3F4F6' : '#FAFAF8', transition: 'border-color 0.15s',
          fontFamily: "'Figtree', sans-serif", outline: 'none',
          opacity: disabled ? 0.6 : 1, minHeight: 44, touchAction: 'manipulation',
        }}
      >
        <span style={{ fontSize: fs, fontWeight: 500, color: selected ? '#111' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{displayLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? '#C9A84C' : '#999'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: 6, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#fff', border: '1px solid #EBEBEB', borderRadius: 10,
          padding: 4, zIndex: 50, maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {options.map((opt, i) => {
            const optVal = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : opt.label
            const isActive = optVal === value
            const isFocused = i === focusIdx
            return (
              <div
                key={optVal}
                onClick={() => pick(opt)}
                onMouseEnter={() => setFocusIdx(i)}
                style={{
                  padding: compact ? '6px 8px' : '8px 10px', borderRadius: 6,
                  fontSize: compact ? 11 : 12, fontWeight: isActive ? 600 : 500,
                  color: '#111', cursor: 'pointer', fontFamily: "'Figtree', sans-serif",
                  background: isActive ? '#F5F0E4' : isFocused ? '#F9FAFB' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                {optLabel}
              </div>
            )
          })}
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3, fontWeight: 500 }}>{error}</div>}
    </div>
  )
}

export default BrandedSelect

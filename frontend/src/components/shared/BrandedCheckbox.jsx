/**
 * BrandedCheckbox + BrandedToggle — ReeveOS global form controls
 * Replaces ALL native <input type="checkbox"> across the platform.
 * Gold accent for checkbox, black/grey toggle.
 *
 * Usage:
 *   <BrandedCheckbox label="Send reminders" checked={val} onChange={setVal} />
 *   <BrandedToggle label="Online booking" checked={val} onChange={setVal} />
 */

const BrandedCheckbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  style = {},
}) => {
  return (
    <label
      style={{
        display: 'flex', alignItems: checked && description ? 'flex-start' : 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, fontFamily: "'Figtree', sans-serif",
        minHeight: 44, touchAction: 'manipulation',
        ...style,
      }}
      onClick={e => { e.preventDefault(); if (!disabled) onChange(!checked) }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? '#C9A84C' : '#D1D5DB'}`,
        background: checked ? '#C9A84C' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M3 8l4 4 6-7" /></svg>
        )}
      </div>
      <div>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{label}</span>
        {description && <div style={{ fontSize: 11, color: '#999', marginTop: 2, lineHeight: 1.3 }}>{description}</div>}
      </div>
    </label>
  )
}

const BrandedToggle = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  style = {},
}) => {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, fontFamily: "'Figtree', sans-serif",
        minHeight: 44, touchAction: 'manipulation',
        ...style,
      }}
      onClick={e => { e.preventDefault(); if (!disabled) onChange(!checked) }}
    >
      <div style={{
        width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: checked ? '#C9A84C' : '#E5E7EB',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          left: checked ? 20 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
      <div>
        <span style={{ fontSize: 13, fontWeight: 500, color: checked ? '#111' : '#999', transition: 'color 0.15s' }}>{label}</span>
        {description && <div style={{ fontSize: 11, color: '#999', marginTop: 2, lineHeight: 1.3 }}>{description}</div>}
      </div>
    </label>
  )
}

export { BrandedCheckbox, BrandedToggle }
export default BrandedCheckbox

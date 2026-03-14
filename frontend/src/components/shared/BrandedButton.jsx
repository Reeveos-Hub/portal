/**
 * BrandedButton — ReeveOS global pill button
 * Replaces ALL default browser buttons across the platform.
 * All buttons are pill-shaped (border-radius: 999px). No exceptions.
 *
 * Usage:
 *   <BrandedButton>Save</BrandedButton>
 *   <BrandedButton variant="secondary" onClick={close}>Cancel</BrandedButton>
 *   <BrandedButton variant="gold">Book Now</BrandedButton>
 *   <BrandedButton variant="danger">Delete</BrandedButton>
 *   <BrandedButton variant="compact" icon={<Plus size={11}/>}>New</BrandedButton>
 *   <BrandedButton variant="icon"><X size={14}/></BrandedButton>
 *   <BrandedButton variant="danger-outline">Remove</BrandedButton>
 *   <BrandedButton variant="ghost">Reset</BrandedButton>
 */

const VARIANTS = {
  primary: {
    background: '#111', color: '#fff', border: 'none', fontWeight: 700,
    hoverBg: '#222',
  },
  secondary: {
    background: '#fff', color: '#666', border: '1.5px solid #EBEBEB', fontWeight: 600,
    hoverBg: '#F9FAFB',
  },
  gold: {
    background: '#C9A84C', color: '#fff', border: 'none', fontWeight: 700,
    hoverBg: '#B8953F',
  },
  danger: {
    background: '#EF4444', color: '#fff', border: 'none', fontWeight: 700,
    hoverBg: '#DC2626',
  },
  'danger-outline': {
    background: '#FEF2F2', color: '#B91C1C', border: '1.5px solid #FCA5A5', fontWeight: 600,
    hoverBg: '#FEE2E2',
  },
  compact: {
    background: '#F5F5F5', color: '#777', border: 'none', fontWeight: 600,
    hoverBg: '#EBEBEB',
  },
  'compact-primary': {
    background: '#111', color: '#fff', border: 'none', fontWeight: 700,
    hoverBg: '#222',
  },
  'compact-outline': {
    background: '#fff', color: '#777', border: '1px solid #EBEBEB', fontWeight: 600,
    hoverBg: '#F9FAFB',
  },
  ghost: {
    background: 'transparent', color: '#999', border: 'none', fontWeight: 600,
    hoverBg: '#F5F5F5',
  },
  icon: {
    background: '#F5F5F5', color: '#777', border: 'none', fontWeight: 600,
    hoverBg: '#EBEBEB',
  },
}

const BrandedButton = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  icon,
  size = 'default',
  fullWidth = false,
  type = 'button',
  style: customStyle = {},
  ...props
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary
  const isIcon = variant === 'icon'
  const isCompact = variant.startsWith('compact')

  const basePadding = isIcon ? 0 : isCompact ? '5px 12px' : '10px 24px'
  const fontSize = isIcon ? 0 : isCompact ? 10 : 13
  const minH = isIcon ? 32 : isCompact ? 28 : 44
  const w = isIcon ? 32 : undefined

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isCompact ? 4 : 6,
        padding: basePadding,
        borderRadius: isIcon ? '50%' : 999,
        border: v.border,
        background: disabled ? '#E5E7EB' : v.background,
        color: disabled ? '#9CA3AF' : v.color,
        fontSize, fontWeight: v.fontWeight,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Figtree', sans-serif",
        transition: 'all 0.15s',
        opacity: disabled ? 0.6 : 1,
        minHeight: minH,
        width: isIcon ? w : fullWidth ? '100%' : undefined,
        height: isIcon ? w : undefined,
        flexShrink: 0,
        touchAction: 'manipulation',
        ...customStyle,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = v.hoverBg }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = disabled ? '#E5E7EB' : v.background }}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  )
}

export default BrandedButton

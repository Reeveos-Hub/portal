/**
 * ReeveOS Global Theme — Single Source of Truth
 * =============================================
 * EVERY colour in the portal must come from this file.
 * No hardcoded hex values anywhere else in the codebase.
 *
 * Usage:
 *   import { theme as T } from '../../config/theme'
 *   <div style={{ color: T.text.primary, border: `1px solid ${T.border.default}` }}>
 *
 * Tailwind config imports from here too so Tailwind classes stay in sync.
 *
 * BRAND RULES:
 * - ReeveOS (merchant): Rich Black #111111 + Gold #C9A84C + White
 * - Reeve Now (consumer): Deep Indigo #1A2744 + Vivid Amber #FFB627 + White
 * - Font: Figtree everywhere
 * - Monochrome branded icons only — never emojis
 */

export const theme = {

  // ─── Brand ──────────────────────────────────────────────
  brand: {
    primary:    '#111111',  // Rich Black — buttons, headings, sidebar
    gold:       '#C9A84C',  // Gold — accents, active states, highlights
    goldLight:  '#D4B76A',  // Light gold — hover on gold elements
    goldFaint:  '#F8F0DC',  // Faint gold — gold tinted backgrounds
    white:      '#FFFFFF',
  },

  // ─── Text ───────────────────────────────────────────────
  text: {
    primary:    '#111111',  // Main headings, body text
    secondary:  '#374151',  // Subheadings, secondary info (gray-700)
    muted:      '#6B7280',  // Labels, captions, timestamps (gray-500)
    light:      '#9CA3AF',  // Placeholder text, disabled (gray-400)
    inverse:    '#FFFFFF',  // Text on dark backgrounds
  },

  // ─── Backgrounds ────────────────────────────────────────
  bg: {
    page:       '#FFFFFF',  // Main page background
    card:       '#FFFFFF',  // Card/panel backgrounds
    subtle:     '#F9FAFB',  // Slightly off-white sections (gray-50)
    muted:      '#F3F4F6',  // Hover states, zebra rows (gray-100)
    dark:       '#111111',  // Dark panels (quick actions, sidebar rail)
    darkHover:  '#1A1A1A',  // Hover on dark backgrounds
    overlay:    'rgba(0, 0, 0, 0.5)',  // Modal overlays
  },

  // ─── Borders ────────────────────────────────────────────
  border: {
    default:    '#C4C8CF',  // Standard card/section borders
    light:      '#E5E7EB',  // Subtle dividers, inner separators (gray-200)
    dark:       '#9CA3AF',  // Emphasized borders (gray-400)
    input:      '#D1D5DB',  // Form input borders (gray-300)
    focus:      '#111111',  // Focused input borders
  },

  // ─── Status / Semantic ──────────────────────────────────
  status: {
    success:      '#22C55E',  // Green — confirmed, active, complete
    successDark:  '#059669',  // Darker green — text on light green bg
    successBg:    '#F0FDF4',  // Light green background
    successBorder:'#BBF7D0',  // Green border

    warning:      '#F59E0B',  // Amber — pending, attention needed
    warningDark:  '#D97706',  // Darker amber — text on light amber bg
    warningBg:    '#FFFBEB',  // Light amber background
    warningBorder:'#FEF3C7',  // Amber border

    error:        '#EF4444',  // Red — failed, blocked, cancelled
    errorDark:    '#DC2626',  // Darker red — text on light red bg
    errorDeep:    '#991B1B',  // Deep red — critical emphasis
    errorBg:      '#FEF2F2',  // Light red background
    errorBorder:  '#FEE2E2',  // Red border

    info:         '#3B82F6',  // Blue — informational, links
    infoDark:     '#2563EB',  // Darker blue
    infoBg:       '#EFF6FF',  // Light blue background
    infoBorder:   '#BFDBFE',  // Blue border

    purple:       '#8B5CF6',  // Purple — premium, special
    purpleDark:   '#7C3AED',  // Darker purple
    purpleBg:     '#FAF5FF',  // Light purple background

    orange:       '#EA580C',  // Orange — urgent, no-show
    orangeDark:   '#9A3412',  // Darker orange
    orangeBg:     '#FFF7ED',  // Light orange background
  },

  // ─── Sidebar (dark theme) ───────────────────────────────
  sidebar: {
    bg:         '#111111',  // Rail background
    bgHover:    '#1A1A1A',  // Hover on rail items
    panel:      '#FFFFFF',  // Secondary panel background
    text:       '#FAF7F2',  // Light text on dark rail
    textMuted:  'rgba(250, 247, 242, 0.4)',  // Dimmed icons on rail
    accent:     '#C9A84C',  // Active icon/indicator colour
    border:     '#E8E4DD',  // Panel inner borders (stays warm — intentional)
    borderLight:'#F0EDE7',  // Subtle panel dividers
  },

  // ─── Interactive ────────────────────────────────────────
  interactive: {
    hover:      '#F3F4F6',  // Row/item hover (gray-100)
    active:     '#E5E7EB',  // Active/pressed state (gray-200)
    selected:   '#F8F0DC',  // Selected item (gold tint)
    focus:      'rgba(17, 17, 17, 0.15)',  // Focus ring
    link:       '#111111',  // Link colour (brand primary, not blue)
  },

  // ─── Chart / Data Viz ───────────────────────────────────
  chart: {
    primary:    '#111111',  // Main bars/lines
    secondary:  '#C9A84C',  // Secondary data series
    tertiary:   '#6B7280',  // Third data series
    grid:       '#E5E7EB',  // Chart grid lines
    label:      '#9CA3AF',  // Axis labels
  },

  // ─── Shadows ────────────────────────────────────────────
  shadow: {
    sm:   '0 1px 2px rgba(0, 0, 0, 0.05)',
    card: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md:   '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg:   '0 8px 24px rgba(0, 0, 0, 0.1)',
    xl:   '0 16px 48px rgba(0, 0, 0, 0.12)',
  },

  // ─── Radius ─────────────────────────────────────────────
  radius: {
    sm:   '6px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    pill:  '100px',
    full:  '9999px',
  },

  // ─── Typography ─────────────────────────────────────────
  font: {
    family: "'Figtree', system-ui, -apple-system, sans-serif",
    size: {
      xs:   '11px',
      sm:   '13px',
      base: '14px',
      md:   '15px',
      lg:   '18px',
      xl:   '22px',
      xxl:  '28px',
    },
    weight: {
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
      black:    800,
    },
  },

  // ─── Spacing (consistent gaps/padding) ──────────────────
  space: {
    xs:  '4px',
    sm:  '8px',
    md:  '12px',
    lg:  '16px',
    xl:  '20px',
    xxl: '24px',
    xxxl:'32px',
  },
}

/**
 * Tailwind-compatible flat export
 * Used by tailwind.config.js to keep Tailwind classes in sync
 */
export const tailwindColors = {
  primary:        theme.brand.primary,
  'primary-hover': theme.bg.darkHover,
  background:     theme.bg.page,
  card:           theme.bg.card,
  border:         theme.border.default,
  success:        theme.status.success,
  warning:        theme.status.warning,
  error:          theme.status.error,
  info:           theme.status.info,
  text: {
    main:         theme.text.primary,
    muted:        theme.text.muted,
    light:        theme.text.light,
  },
  forest: {
    DEFAULT:      theme.brand.primary,
    dark:         '#0A0A0A',
    darker:       '#050505',
  },
  gold:           theme.brand.gold,
  cream:          theme.bg.subtle,
  'off-white':    theme.bg.subtle,
  'warm-border':  theme.border.default,
}

/**
 * Quick colour map for migration
 * Maps old hardcoded hex → new theme token path
 * Use this as reference when migrating each page
 *
 * OLD HEX          → NEW TOKEN
 * ────────────────────────────────────────
 * #111111           → theme.brand.primary / theme.text.primary
 * #1a1a1a           → theme.bg.darkHover
 * #141413           → theme.brand.primary (close enough)
 * #2C2C2A           → theme.text.primary
 * #333333           → theme.text.secondary (approximate)
 * #374151           → theme.text.secondary
 * #C9A84C           → theme.brand.gold
 * #D4B76A           → theme.brand.goldLight
 * #D4A373           → theme.brand.gold (restaurant amber — map to gold)
 * #F8F3E8 / #F8F0DC → theme.brand.goldFaint
 * #FAF7F2           → theme.sidebar.text (sidebar only) / theme.bg.subtle (elsewhere)
 * #FAFAF8 / #FAFAF9 → theme.bg.subtle
 * #FAFAFA           → theme.bg.subtle
 * #F5F5F5 / #F5F5F3 → theme.bg.muted
 * #F3F4F6           → theme.bg.muted
 * #F0F0F0           → theme.bg.muted
 * #F9FAFB           → theme.bg.subtle
 * #EBEBEB           → theme.border.light
 * #E5E7EB           → theme.border.light
 * #E5E5E5           → theme.border.light
 * #E0E0E0           → theme.border.light
 * #D1D5DB           → theme.border.input
 * #E8E4DD           → theme.sidebar.border (sidebar) / theme.border.default (elsewhere)
 * #F0EDE7           → theme.sidebar.borderLight (sidebar only)
 * #E8E0D4           → theme.border.default
 * #DDD5C5           → theme.border.default
 * #6B7280           → theme.text.muted
 * #9CA3AF           → theme.text.light
 * #7A776F           → theme.text.muted (warm version — map to neutral)
 * #FFFFFF           → theme.brand.white / theme.bg.card
 * #22C55E / #22c55e → theme.status.success
 * #10B981 / #10b981 → theme.status.success (alt shade)
 * #059669           → theme.status.successDark
 * #065F46           → theme.status.successDark
 * #F0FDF4 / #ECFDF5 → theme.status.successBg
 * #EF4444           → theme.status.error
 * #DC2626 / #dc2626 → theme.status.errorDark
 * #991B1B           → theme.status.errorDeep
 * #FEF2F2           → theme.status.errorBg
 * #FEE2E2           → theme.status.errorBorder
 * #F59E0B           → theme.status.warning
 * #D97706           → theme.status.warningDark
 * #92400E           → theme.status.warningDark (deep amber)
 * #FFFBEB           → theme.status.warningBg
 * #FEF3C7           → theme.status.warningBorder
 * #3B82F6           → theme.status.info
 * #EFF6FF           → theme.status.infoBg
 * #8B5CF6           → theme.status.purple
 * #7C3AED           → theme.status.purpleDark
 * #5B21B6           → theme.status.purpleDark
 * #FAF5FF           → theme.status.purpleBg
 * #EA580C / #ea580c → theme.status.orange
 * #9A3412           → theme.status.orangeDark
 * #FFF7ED / #FFF8F0 → theme.status.orangeBg
 * #0A66C2           → LINKEDIN BLUE (keep as-is in LinkedIn page only)
 */

export default theme

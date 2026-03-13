/**
 * ReeveOS Branded Alert
 * Replaces raw red error boxes with on-brand messaging.
 * Variants: error, warning, info, success
 * Uses monochrome SVG icons — never emojis.
 */
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

const VARIANTS = {
  error: {
    bg: 'bg-[#111111]',
    border: 'border-[#111111]',
    text: 'text-white',
    subtext: 'text-white/70',
    icon: AlertCircle,
    iconColor: 'text-[#C9A84C]',
    closeHover: 'hover:text-white/80',
  },
  warning: {
    bg: 'bg-[#FFF8E7]',
    border: 'border-[#C9A84C]',
    text: 'text-[#111111]',
    subtext: 'text-[#111111]/70',
    icon: AlertTriangle,
    iconColor: 'text-[#C9A84C]',
    closeHover: 'hover:text-[#111111]/80',
  },
  info: {
    bg: 'bg-[#F5F5F5]',
    border: 'border-[#111111]/20',
    text: 'text-[#111111]',
    subtext: 'text-[#111111]/60',
    icon: Info,
    iconColor: 'text-[#111111]',
    closeHover: 'hover:text-[#111111]/80',
  },
  success: {
    bg: 'bg-[#111111]',
    border: 'border-[#C9A84C]',
    text: 'text-white',
    subtext: 'text-white/70',
    icon: CheckCircle,
    iconColor: 'text-[#C9A84C]',
    closeHover: 'hover:text-white/80',
  },
}

export default function Alert({ variant = 'error', message, detail, onDismiss, className = '' }) {
  if (!message) return null

  const v = VARIANTS[variant] || VARIANTS.error
  const Icon = v.icon

  return (
    <div
      className={`${v.bg} border ${v.border} rounded-xl p-4 flex items-start gap-3 animate-in ${className}`}
      style={{ fontFamily: "'Figtree', sans-serif" }}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${v.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${v.text}`}>{message}</p>
        {detail && (
          <p className={`text-xs mt-1 ${v.subtext}`}>{detail}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`shrink-0 ${v.subtext} ${v.closeHover} transition-colors`}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

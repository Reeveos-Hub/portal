/**
 * WebsitePages — 8-screen website builder flow.
 * Screens: Upgrade Gate → Plan Selection → Checkout → Onboarding → Dashboard → Template Browser → Settings → (Editor is separate)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'

/* ───────────────────────────── CONSTANTS ───────────────────────────── */

const F = 'Figtree, sans-serif'
const GOLD = '#C9A84C'
const DARK = '#0F172A'
const ACCENT_LIGHT = '#FEF3C7'
const BORDER = '#E2E8F0'
const MUTED = '#64748B'
const BG = '#F8FAFC'

/* ───────────────────────────── SVG ICONS ───────────────────────────── */

const Icon = {
  lock: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="22" width="24" height="18" rx="3" /><path d="M18 22v-6a6 6 0 0112 0v6" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 6 11 3 8" />
    </svg>
  ),
  checkGold: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 6 11 3 8" />
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8H3M7 4l-4 4 4 4" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  template: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  duplicate: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
    </svg>
  ),
  globe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  rocket: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4c0 0-10 8-10 22a24 24 0 004 12h12a24 24 0 004-12c0-14-10-22-10-22z" /><circle cx="24" cy="22" r="3" /><path d="M18 38l-4 6M30 38l4 6" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="4,2 14,8 4,14" />
    </svg>
  ),
  qr: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" /><line x1="22" y1="14" x2="22" y2="22" /><line x1="14" y1="22" x2="22" y2="22" />
    </svg>
  ),
  grip: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
    </svg>
  ),
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77 5.82 21l1.18-6.86-5-4.87 6.91-1.01z" /></svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  page: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="12" x2="12" y2="18" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
}

/* ───────────────────────────── HELPERS ───────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/* ───────────────────────────── PLAN DATA ───────────────────────────── */

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '8.99',
    period: '/mo',
    description: 'Everything you need to get started',
    features: ['3 staff members', '500 bookings/mo', 'Website builder', '3 page limit', 'Email support'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '29',
    period: '/mo',
    description: 'For growing businesses',
    features: ['5 staff', 'Unlimited bookings', 'Website builder', 'Unlimited pages', 'Custom domain', 'Booking deposits', 'CRM', 'Analytics', 'Priority support'],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '59',
    period: '/mo',
    description: 'For established businesses',
    features: ['Everything in Growth +', 'Unlimited staff', 'Floor plan', 'White-label', 'Heatmap analytics', 'Custom scripts', '3 custom domains'],
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For multi-location businesses',
    features: ['Everything in Scale +', 'Dedicated support', 'Custom integrations', 'SLA', 'Multi-location'],
    popular: false,
  },
]

const CHECKOUT_INCLUDES = [
  'Website builder', 'Unlimited pages', 'Custom domain', 'CRM', 'Analytics',
  '5 staff', 'Priority support', '50 AI generations/mo',
]

const TEMPLATE_FILTERS = [
  'All', 'Restaurant', 'Cafe / Bar', 'Salon / Beauty', 'Aesthetics',
  'Barbershop', 'Gym / Fitness', 'Retail', 'Professional Services',
]

const FONT_OPTIONS = ['Inter', 'Figtree', 'DM Sans', 'Poppins', 'Playfair Display', 'Cormorant Garamond']

/* ───────────────────────────── SHARED STYLES ───────────────────────────── */

const btnPrimary = {
  background: GOLD, color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontFamily: F, fontWeight: 600, fontSize: 14,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'opacity 0.15s',
}
const btnSecondary = {
  background: DARK, color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontFamily: F, fontWeight: 600, fontSize: 14,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
}
const btnOutline = {
  background: '#fff', color: DARK, border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '10px 20px', fontFamily: F, fontWeight: 500, fontSize: 14,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
}
const btnGhost = {
  background: 'transparent', color: MUTED, border: 'none', borderRadius: 8,
  padding: '10px 20px', fontFamily: F, fontWeight: 500, fontSize: 14,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
}
const inputStyle = {
  width: '100%', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: 8,
  fontFamily: F, fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
const labelStyle = {
  display: 'block', fontFamily: F, fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 6,
}
const cardStyle = {
  background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`,
  padding: 24, fontFamily: F,
}
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
}

/* ═══════════════════════════════════════════════
   SCREEN 1: UPGRADE GATE
   ═══════════════════════════════════════════════ */
function UpgradeGate({ onUpgrade }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ margin: '0 auto 24px', width: 80, height: 80, borderRadius: 20, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon.lock}
        </div>
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>Website Builder</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: MUTED, margin: '0 0 32px', lineHeight: 1.6 }}>
          Build a stunning website for your business with our drag-and-drop editor. Upgrade your plan to unlock the website builder.
        </p>
        <button onClick={onUpgrade} style={{ ...btnPrimary, padding: '12px 32px', fontSize: 16 }}>
          Upgrade to Unlock {Icon.arrowRight}
        </button>
        <p style={{ fontFamily: F, fontSize: 12, color: '#94A3B8', margin: '16px 0 0' }}>
          Starting from £8.99/mo
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 2: PLAN SELECTION
   ═══════════════════════════════════════════════ */
function PlanSelection({ onSelect, onBack }) {
  const [aiAddon, setAiAddon] = useState(false)

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onBack} style={{ ...btnGhost, marginBottom: 16, padding: '6px 0' }}>
        {Icon.arrowLeft} Back
      </button>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>Choose Your Plan</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: MUTED, margin: 0 }}>Select the plan that works best for your business</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            ...cardStyle,
            position: 'relative',
            border: plan.popular ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
            display: 'flex', flexDirection: 'column',
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: F }}>Most Popular</div>
            )}
            <h3 style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>{plan.name}</h3>
            <p style={{ fontFamily: F, fontSize: 13, color: MUTED, margin: '0 0 16px' }}>{plan.description}</p>
            <div style={{ marginBottom: 20 }}>
              {plan.price === 'Custom' ? (
                <span style={{ fontFamily: F, fontSize: 32, fontWeight: 800, color: DARK }}>Custom</span>
              ) : (
                <>
                  <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: MUTED }}>£</span>
                  <span style={{ fontFamily: F, fontSize: 32, fontWeight: 800, color: DARK }}>{plan.price}</span>
                  <span style={{ fontFamily: F, fontSize: 14, color: MUTED }}>{plan.period}</span>
                </>
              )}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontFamily: F, fontSize: 13, color: '#334155' }}>
                  <span style={{ flexShrink: 0, marginTop: 1, color: GOLD }}>{Icon.check}</span>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => onSelect(plan)} style={{
              ...(plan.popular ? btnPrimary : btnOutline),
              width: '100%', justifyContent: 'center',
            }}>
              {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>

      {/* AI Add-on */}
      <div style={{
        ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        background: aiAddon ? ACCENT_LIGHT : '#fff',
        border: aiAddon ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>{Icon.ai}</div>
          <div>
            <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: DARK }}>AI Website Builder <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: GOLD }}>+£8.99/mo</span></div>
            <div style={{ fontFamily: F, fontSize: 13, color: MUTED }}>AI generates your entire website from a description. Includes 50 generations/month.</div>
          </div>
        </div>
        <button onClick={() => setAiAddon(!aiAddon)} style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
          background: aiAddon ? GOLD : '#CBD5E1', transition: 'background 0.2s',
        }}>
          <div style={{ position: 'absolute', top: 2, left: aiAddon ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 12, color: '#94A3B8', textAlign: 'center', margin: '24px 0 0' }}>
        &copy; 2026 ReeveOS
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 3: CHECKOUT
   ═══════════════════════════════════════════════ */
function Checkout({ plan, onBack, onComplete }) {
  const [processing, setProcessing] = useState(false)

  const handlePay = async () => {
    setProcessing(true)
    // Simulate payment
    await new Promise(r => setTimeout(r, 1500))
    setProcessing(false)
    onComplete()
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={onBack} style={{ ...btnGhost, marginBottom: 16, padding: '6px 0' }}>
        {Icon.arrowLeft} Back to Plans
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        {/* Left — Form */}
        <div>
          <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Checkout</h1>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Name on card</label>
            <input style={inputStyle} placeholder="Full name" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Card number</label>
            <input style={inputStyle} placeholder="1234 5678 9012 3456" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Expiry</label>
              <input style={inputStyle} placeholder="MM / YY" />
            </div>
            <div>
              <label style={labelStyle}>CVC</label>
              <input style={inputStyle} placeholder="123" />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Billing email</label>
            <input style={inputStyle} placeholder="you@business.com" type="email" />
          </div>

          <button onClick={handlePay} disabled={processing} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15, opacity: processing ? 0.7 : 1 }}>
            {processing ? 'Processing...' : `Pay £${plan?.price || '29'}/mo`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            {Icon.shield}
            <span style={{ fontFamily: F, fontSize: 12, color: MUTED }}>Secured by Stripe. Cancel anytime.</span>
          </div>
        </div>

        {/* Right — Summary */}
        <div style={{ ...cardStyle, background: BG, alignSelf: 'start' }}>
          <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>{plan?.name || 'Growth'} Plan</h3>
          <div style={{ fontFamily: F, fontSize: 28, fontWeight: 800, color: DARK, margin: '0 0 20px' }}>
            £{plan?.price || '29'}<span style={{ fontSize: 14, fontWeight: 500, color: MUTED }}>/mo</span>
          </div>

          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>What's included</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {CHECKOUT_INCLUDES.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontFamily: F, fontSize: 13, color: '#334155' }}>
                <span style={{ color: GOLD }}>{Icon.check}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p style={{ fontFamily: F, fontSize: 12, color: '#94A3B8', textAlign: 'center', margin: '32px 0 0' }}>
        &copy; 2026 ReeveOS
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 4: ONBOARDING
   ═══════════════════════════════════════════════ */
function Onboarding({ onGetStarted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ margin: '0 auto 24px' }}>{Icon.rocket}</div>
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>Welcome to the Website Builder</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: MUTED, margin: '0 0 12px', lineHeight: 1.6 }}>
          Create a stunning website for your business in minutes. Choose a template, customise it with our drag-and-drop editor, and publish instantly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '32px 0', textAlign: 'center' }}>
          {[
            { num: '1', title: 'Pick a template', desc: 'Start from a professionally designed template' },
            { num: '2', title: 'Customise', desc: 'Drag and drop to make it yours' },
            { num: '3', title: 'Publish', desc: 'Go live with one click' },
          ].map(step => (
            <div key={step.num} style={{ padding: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: ACCENT_LIGHT, color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontFamily: F, fontWeight: 700, fontSize: 14 }}>{step.num}</div>
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{step.desc}</div>
            </div>
          ))}
        </div>

        <button onClick={onGetStarted} style={{ ...btnPrimary, padding: '12px 32px', fontSize: 15 }}>
          Get Started {Icon.arrowRight}
        </button>
        <div style={{ marginTop: 16 }}>
          <button style={{ ...btnGhost, fontSize: 13, gap: 6, justifyContent: 'center' }}>
            {Icon.play} Watch a 2-minute tutorial
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 5: DASHBOARD (pages list)
   ═══════════════════════════════════════════════ */
function Dashboard({ bid, pages, settings, onRefresh, onOpenSettings, onOpenTemplates }) {
  const navigate = useNavigate()
  const [showNewPage, setShowNewPage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [qrSlug, setQrSlug] = useState(null)
  const [error, setError] = useState(null)

  const handleDelete = async (slug) => {
    try {
      await api.delete(`/website/business/${bid}/pages/${slug}`)
      setDeleteConfirm(null)
      onRefresh()
    } catch (err) { setError(err.message); setDeleteConfirm(null) }
  }

  const handleDuplicate = async (slug) => {
    setDuplicating(slug)
    try {
      await api.post(`/website/business/${bid}/pages/${slug}/duplicate`)
      onRefresh()
    } catch (err) { setError(err.message) }
    finally { setDuplicating(null) }
  }

  const handlePageCreated = (newPage) => {
    onRefresh()
    setShowNewPage(false)
    const pageSlug = newPage?.slug || newPage?.page?.slug
    if (pageSlug) navigate(`/dashboard/website/edit/${pageSlug}`)
  }

  return (
    <div style={{ padding: '32px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: F }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: DARK }}>Website</h1>
          <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Manage your pages, templates, and website settings</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onOpenSettings} style={btnOutline}>{Icon.settings} Settings</button>
          <button onClick={onOpenTemplates} style={btnSecondary}>{Icon.template} Templates</button>
          <button onClick={() => setShowNewPage(true)} style={btnPrimary}>{Icon.plus} New Page</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontFamily: F }}>{error}</div>
      )}

      {pages.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ margin: '0 auto 20px', width: 80, height: 80, borderRadius: 16, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.page}</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: DARK, margin: '0 0 6px' }}>No pages yet</p>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 20px' }}>Create your first page or start with a template.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={onOpenTemplates} style={btnOutline}>{Icon.template} Browse Templates</button>
            <button onClick={() => setShowNewPage(true)} style={btnPrimary}>{Icon.plus} Create Page</button>
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Page Name', 'Slug', 'Status', 'Last Updated', 'Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map(page => {
                const slug = page.slug
                const isPublished = page.status === 'published'
                return (
                  <tr key={slug} style={{ borderBottom: `1px solid #F1F5F9`, transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: DARK }}>{page.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: MUTED, background: BG, padding: '2px 8px', borderRadius: 4 }}>/{slug}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: isPublished ? '#DCFCE7' : '#F1F5F9', color: isPublished ? '#166534' : MUTED }}>{isPublished ? 'Published' : 'Draft'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>{timeAgo(page.updated_at || page.updatedAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { icon: Icon.edit, title: 'Edit', onClick: () => navigate(`/dashboard/website/edit/${slug}`), color: DARK },
                          { icon: Icon.duplicate, title: 'Duplicate', onClick: () => handleDuplicate(slug), color: DARK, disabled: duplicating === slug },
                          { icon: Icon.qr, title: 'QR Code', onClick: () => setQrSlug(slug), color: DARK },
                          { icon: Icon.trash, title: 'Delete', onClick: () => setDeleteConfirm(slug), color: '#DC2626' },
                        ].map((btn, i) => (
                          <button key={i} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} style={{ background: BG, border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: btn.color, display: 'inline-flex', alignItems: 'center', opacity: btn.disabled ? 0.5 : 1, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.background = BG}>{btn.icon}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showNewPage && <NewPageModal bid={bid} onClose={() => setShowNewPage(false)} onCreated={handlePageCreated} />}
      {deleteConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete "/${deleteConfirm}"? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
      {qrSlug && <QRCodeModal bid={bid} slug={qrSlug} subdomain={settings?.subdomain} onClose={() => setQrSlug(null)} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 6: TEMPLATE BROWSER
   ═══════════════════════════════════════════════ */
function TemplateBrowser({ bid, onClose, onApplied }) {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmTemplate, setConfirmTemplate] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const filterMap = { 'All': '', 'Restaurant': 'restaurant', 'Cafe / Bar': 'restaurant', 'Salon / Beauty': 'salon', 'Aesthetics': 'aesthetics', 'Barbershop': 'barber', 'Gym / Fitness': 'personal_trainer', 'Retail': 'generic', 'Professional Services': 'generic' }
        const industry = filterMap[activeFilter] || ''
        const url = industry ? `/website/templates?industry=${industry}` : '/website/templates'
        const res = await api.get(url)
        setTemplates(res.templates || res || [])
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    setLoading(true)
    load()
  }, [activeFilter])

  const filtered = useMemo(() => {
    if (!searchTerm) return templates
    const lower = searchTerm.toLowerCase()
    return templates.filter(t => (t.name || '').toLowerCase().includes(lower) || (t.industry || '').toLowerCase().includes(lower))
  }, [templates, searchTerm])

  const applyTemplate = async (templateId) => {
    setApplying(templateId)
    setError(null)
    setConfirmTemplate(null)
    try {
      await api.post(`/website/business/${bid}/apply-template`, { template_id: templateId })
      onApplied()
      onClose()
      navigate('/dashboard/website/edit/home')
    } catch (err) { setError(err.message); setApplying(null) }
  }

  const gradients = [
    'linear-gradient(135deg, #C9A84C 0%, #F0D78C 100%)',
    'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
    'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
    'linear-gradient(135deg, #C9A84C 0%, #0F172A 100%)',
    'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    'linear-gradient(135deg, #92764A 0%, #C9A84C 100%)',
  ]

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 960, width: '100%', maxHeight: '90vh', overflow: 'auto', fontFamily: F }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: DARK }}>Template Library</h2>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Choose a professionally designed starting point</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>{Icon.close}</button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: BG, borderRadius: 8, padding: '8px 14px', border: `1px solid ${BORDER}` }}>
            <span style={{ color: MUTED, display: 'flex' }}>{Icon.search}</span>
            <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: F, fontSize: 14, flex: 1, color: DARK }} />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '0 28px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TEMPLATE_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 500,
              background: activeFilter === f ? DARK : BG,
              color: activeFilter === f ? '#fff' : MUTED,
              transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>

        {error && <div style={{ margin: '0 28px 16px', background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}

        {/* Grid */}
        <div style={{ padding: '0 28px 28px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontSize: 14 }}>Loading templates...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontSize: 14 }}>No templates found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {filtered.map((tmpl, idx) => {
                const tid = tmpl.id || tmpl._id
                return (
                  <div key={tid || idx} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, background: '#fff', transition: 'box-shadow 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                    <div style={{ height: 140, background: tmpl.thumbnail_url ? `url(${tmpl.thumbnail_url}) center/cover` : gradients[idx % gradients.length] }} />
                    <div style={{ padding: 14 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: DARK }}>{tmpl.name}</h4>
                      {tmpl.description && <p style={{ margin: '0 0 8px', fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{tmpl.description}</p>}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                        {tmpl.industry && <span style={{ fontSize: 11, color: MUTED, background: BG, padding: '2px 8px', borderRadius: 100 }}>{tmpl.industry}</span>}
                        {tmpl.page_count && <span style={{ fontSize: 11, color: '#94A3B8' }}>{tmpl.page_count} pages</span>}
                      </div>
                      <button onClick={() => setConfirmTemplate(tmpl)} disabled={applying !== null} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', fontSize: 13, padding: '8px 12px', opacity: applying === tid ? 0.6 : 1 }}>
                        {applying === tid ? 'Applying...' : 'Use Template'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Confirm */}
        {confirmTemplate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setConfirmTemplate(null)}>
            <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, maxWidth: 420, width: '100%' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: DARK }}>Apply "{confirmTemplate.name}"?</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: MUTED, lineHeight: 1.5 }}>This will create {confirmTemplate.page_count || 5} draft pages. Existing drafts with the same slugs will be overwritten.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmTemplate(null)} style={btnOutline}>Cancel</button>
                <button onClick={() => applyTemplate(confirmTemplate.id || confirmTemplate._id)} disabled={applying !== null} style={{ ...btnPrimary, opacity: applying ? 0.6 : 1 }}>Apply Template</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SCREEN 7: WEBSITE SETTINGS
   ═══════════════════════════════════════════════ */
function SettingsPanel({ bid, settings: initialSettings, pages, onClose, onSaved }) {
  const [settings, setSettings] = useState(initialSettings || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('general')
  const [subdomainStatus, setSubdomainStatus] = useState(null)
  const [navItems, setNavItems] = useState([])
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  useEffect(() => {
    const navPages = (settings.navigation || []).map(n => ({
      slug: n.slug, name: (pages || []).find(p => p.slug === n.slug)?.title || n.slug, showInNav: n.show_in_nav !== false,
    }))
    const navSlugs = new Set(navPages.map(n => n.slug))
    const extra = (pages || []).filter(p => !navSlugs.has(p.slug)).map(p => ({ slug: p.slug, name: p.title, showInNav: false }))
    setNavItems([...navPages, ...extra])
  }, [settings.navigation, pages])

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))
  const updateBrand = (key, val) => setSettings(prev => ({ ...prev, brand: { ...(prev.brand || {}), [key]: val } }))
  const updateTypography = (key, val) => setSettings(prev => ({ ...prev, typography: { ...(prev.typography || {}), [key]: val } }))
  const updateFooter = (key, val) => setSettings(prev => ({ ...prev, footer: { ...(prev.footer || {}), [key]: val } }))
  const updateSocial = (key, val) => setSettings(prev => ({ ...prev, footer: { ...(prev.footer || {}), social: { ...((prev.footer || {}).social || {}), [key]: val } } }))
  const updateDomain = (key, val) => setSettings(prev => ({ ...prev, domain: { ...(prev.domain || {}), [key]: val } }))
  const updateIntegrations = (key, val) => setSettings(prev => ({ ...prev, integrations: { ...(prev.integrations || {}), [key]: val } }))

  const checkSubdomain = async (subdomain) => {
    if (!subdomain || subdomain.length < 3) { setSubdomainStatus(null); return }
    setSubdomainStatus('checking')
    try {
      const res = await api.post(`/website/business/${bid}/settings/check-subdomain`, { subdomain })
      setSubdomainStatus(res.available ? 'available' : 'taken')
    } catch { setSubdomainStatus(null) }
  }

  const handleDragEnd = () => {
    const items = [...navItems]
    const dragged = items.splice(dragItem.current, 1)[0]
    items.splice(dragOver.current, 0, dragged)
    setNavItems(items)
    dragItem.current = null
    dragOver.current = null
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const payload = { ...settings, navigation: navItems.map(n => ({ slug: n.slug, show_in_nav: n.showInNav })) }
      await api.put(`/website/business/${bid}/settings`, payload)
      onSaved(payload)
      onClose()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const sectionTitle = (text) => (
    <h3 style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: DARK, margin: '24px 0 12px', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}>{text}</h3>
  )

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 620, width: '100%', maxHeight: '90vh', overflow: 'auto', fontFamily: F }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: DARK }}>Website Settings</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>{Icon.close}</button>
          </div>

          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
            {[{ key: 'general', label: 'General' }, { key: 'integrations', label: 'Integrations' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: F, borderBottom: tab === t.key ? `2px solid ${GOLD}` : '2px solid transparent', color: tab === t.key ? DARK : MUTED, transition: 'all 0.15s' }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {tab === 'general' && <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Site Title</label>
              <input style={inputStyle} value={settings.site_title || ''} onChange={e => update('site_title', e.target.value)} placeholder="My Business" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Tagline</label>
              <input style={inputStyle} value={settings.tagline || ''} onChange={e => update('tagline', e.target.value)} placeholder="A short description" />
            </div>

            {sectionTitle('Brand')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Primary', key: 'primary_color', def: '#C9A84C' },
                { label: 'Secondary', key: 'secondary_color', def: '#0F172A' },
                { label: 'Accent', key: 'accent_color', def: '#FEF3C7' },
              ].map(c => (
                <div key={c.key}>
                  <label style={labelStyle}>{c.label}</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={(settings.brand || {})[c.key] || c.def} onChange={e => updateBrand(c.key, e.target.value)} style={{ width: 36, height: 36, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                    <input style={{ ...inputStyle, flex: 1, fontSize: 12 }} value={(settings.brand || {})[c.key] || c.def} onChange={e => updateBrand(c.key, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            {sectionTitle('Typography')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Body Font</label>
                <select style={inputStyle} value={(settings.typography || {}).body_font || 'Figtree'} onChange={e => updateTypography('body_font', e.target.value)}>
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Heading Font</label>
                <select style={inputStyle} value={(settings.typography || {}).heading_font || 'Figtree'} onChange={e => updateTypography('heading_font', e.target.value)}>
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {sectionTitle('Navigation')}
            <div style={{ marginBottom: 16 }}>
              {navItems.length === 0 && <p style={{ color: MUTED, fontSize: 13 }}>No pages yet.</p>}
              {navItems.map((item, idx) => (
                <div key={item.slug} draggable onDragStart={() => { dragItem.current = idx }} onDragEnter={() => { dragOver.current = idx }} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 4, background: '#fff', cursor: 'grab', userSelect: 'none' }}>
                  <span style={{ color: MUTED }}>{Icon.grip}</span>
                  <span style={{ flex: 1, fontSize: 14, color: DARK }}>{item.name}</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED, cursor: 'pointer' }}>
                    <input type="checkbox" checked={item.showInNav} onChange={() => setNavItems(prev => prev.map((it, i) => i === idx ? { ...it, showInNav: !it.showInNav } : it))} style={{ accentColor: GOLD }} />
                    Show
                  </label>
                </div>
              ))}
            </div>

            {sectionTitle('Footer')}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Footer Text</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={(settings.footer || {}).text || ''} onChange={e => updateFooter('text', e.target.value)} placeholder="Copyright notice" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[{ label: 'Instagram', key: 'instagram' }, { label: 'Facebook', key: 'facebook' }, { label: 'TikTok', key: 'tiktok' }, { label: 'X / Twitter', key: 'twitter' }].map(s => (
                <div key={s.key}>
                  <label style={labelStyle}>{s.label}</label>
                  <input style={inputStyle} value={((settings.footer || {}).social || {})[s.key] || ''} onChange={e => updateSocial(s.key, e.target.value)} placeholder={`https://${s.key}.com/...`} />
                </div>
              ))}
            </div>

            {sectionTitle('Domain')}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Subdomain</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }} value={(settings.domain || {}).subdomain || ''} onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); updateDomain('subdomain', v); checkSubdomain(v) }} placeholder="my-business" />
                <span style={{ padding: '10px 14px', background: BG, border: `1px solid ${BORDER}`, borderLeft: 'none', borderTopRightRadius: 8, borderBottomRightRadius: 8, fontSize: 14, color: MUTED, whiteSpace: 'nowrap' }}>.rezvo.site</span>
              </div>
              {subdomainStatus === 'checking' && <span style={{ fontSize: 12, color: MUTED, marginTop: 4, display: 'block' }}>Checking...</span>}
              {subdomainStatus === 'available' && <span style={{ fontSize: 12, color: '#16A34A', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Icon.checkGold} Available</span>}
              {subdomainStatus === 'taken' && <span style={{ fontSize: 12, color: '#DC2626', marginTop: 4, display: 'block' }}>Already taken</span>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Custom Domain</label>
              <input style={inputStyle} value={(settings.domain || {}).custom_domain || ''} onChange={e => updateDomain('custom_domain', e.target.value)} placeholder="www.mybusiness.com" />
            </div>
          </>}

          {tab === 'integrations' && <>
            {sectionTitle('Tracking & Analytics')}
            {[
              { label: 'Google Analytics 4 (Measurement ID)', key: 'ga4_id', placeholder: 'G-XXXXXXXXXX' },
              { label: 'Meta Pixel ID', key: 'meta_pixel_id', placeholder: '123456789012345' },
              { label: 'TikTok Pixel ID', key: 'tiktok_pixel_id', placeholder: 'Pixel ID' },
              { label: 'Google Tag Manager ID', key: 'gtm_id', placeholder: 'GTM-XXXXXXX' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{field.label}</label>
                <input style={inputStyle} value={(settings.integrations || {})[field.key] || ''} onChange={e => updateIntegrations(field.key, e.target.value)} placeholder={field.placeholder} />
              </div>
            ))}

            {sectionTitle('Communication')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'WhatsApp Number', key: 'whatsapp', placeholder: '+44 7700 900000' },
                { label: 'Contact Email', key: 'contact_email', placeholder: 'hello@business.com' },
                { label: 'Instagram Handle', key: 'instagram', placeholder: '@yourbusiness' },
                { label: 'TikTok Handle', key: 'tiktok_handle', placeholder: '@yourbusiness' },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input style={inputStyle} value={(settings.integrations || {})[field.key] || ''} onChange={e => updateIntegrations(field.key, e.target.value)} placeholder={field.placeholder} />
                </div>
              ))}
            </div>

            {sectionTitle('Business Links')}
            {[
              { label: 'Google Business Profile (Place ID)', key: 'google_place_id', placeholder: 'ChIJ...' },
              { label: 'Booking Link', key: 'booking_link', placeholder: 'https://book.rezvo.app/...' },
              { label: 'Google Review URL', key: 'google_review_url', placeholder: 'https://g.page/...' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{field.label}</label>
                <input style={inputStyle} value={(settings.integrations || {})[field.key] || ''} onChange={e => updateIntegrations(field.key, e.target.value)} placeholder={field.placeholder} />
              </div>
            ))}
          </>}

          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 16, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SUPPORTING MODALS
   ═══════════════════════════════════════════════ */

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={modalOverlay} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, maxWidth: 400, width: '100%' }}>
        <p style={{ fontSize: 15, color: DARK, margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnOutline}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnSecondary, background: '#DC2626' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function NewPageModal({ bid, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) return
    setCreating(true); setError(null)
    try {
      const res = await api.post(`/website/business/${bid}/pages`, { title: title.trim(), slug: slug.trim() })
      onCreated(res)
    } catch (err) { setError(err.message); setCreating(false) }
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, maxWidth: 448, width: '100%', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: DARK }}>Create New Page</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>{Icon.close}</button>
        </div>
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Page Title</label>
          <input style={inputStyle} value={title} onChange={e => { setTitle(e.target.value); if (!slugEdited) setSlug(slugify(e.target.value)) }} placeholder="e.g. About Us" autoFocus />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Slug</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ padding: '10px 12px', background: BG, border: `1px solid ${BORDER}`, borderRight: 'none', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, fontSize: 14, color: MUTED, fontFamily: 'monospace' }}>/</span>
            <input style={{ ...inputStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontFamily: 'monospace' }} value={slug} onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }} placeholder="about-us" />
          </div>
        </div>
        <button onClick={handleCreate} disabled={creating || !title.trim() || !slug.trim()} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: (creating || !title.trim() || !slug.trim()) ? 0.5 : 1 }}>
          {creating ? 'Creating...' : 'Create Page'}
        </button>
      </div>
    </div>
  )
}

function QRCodeModal({ bid, slug, subdomain, onClose }) {
  const [size, setSize] = useState(300)
  const [loading, setLoading] = useState(true)
  const qrUrl = `/api/website/business/${bid}/qr/${slug}?size=${size}`

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, maxWidth: 400, width: '100%', textAlign: 'center', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: DARK }}>QR Code</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>{Icon.close}</button>
        </div>
        <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>Scan to visit /{slug}</p>
        <div style={{ marginBottom: 16, minHeight: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && <span style={{ color: MUTED, fontSize: 13 }}>Generating...</span>}
          <img src={qrUrl} alt={`QR for /${slug}`} style={{ maxWidth: '100%', display: loading ? 'none' : 'block', borderRadius: 8 }} onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {[200, 300, 500].map(s => (
            <button key={s} onClick={() => { setSize(s); setLoading(true) }} style={{ ...btnOutline, fontSize: 12, padding: '4px 10px', ...(size === s ? { borderColor: GOLD, color: GOLD, background: ACCENT_LIGHT } : {}) }}>{s}px</button>
          ))}
        </div>
        <a href={qrUrl} download={`qr-${slug}.png`} style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}>Download PNG</a>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN EXPORT — STATE MACHINE
   ═══════════════════════════════════════════════ */
export default function WebsitePages() {
  const { business } = useBusiness()
  const bid = business?.id || business?._id

  const [pages, setPages] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  // Screen state
  const [screen, setScreen] = useState(null) // null = detecting, 'gate' | 'plans' | 'checkout' | 'onboarding' | 'dashboard'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const isPaid = business?.rezvo_tier === 'pro' || business?.rezvo_tier === 'premium' || business?.rezvo_tier === 'growth' || business?.rezvo_tier === 'scale' || business?.rezvo_tier === 'enterprise' || business?.rezvo_tier === 'starter'

  const fetchPages = useCallback(async () => {
    if (!bid) return []
    try {
      const res = await api.get(`/website/business/${bid}/pages`)
      const p = res.pages || res || []
      setPages(p)
      return p
    } catch { setPages([]); return [] }
  }, [bid])

  const fetchSettings = useCallback(async () => {
    if (!bid) return
    try {
      const res = await api.get(`/website/business/${bid}/settings`)
      setSettings(res)
    } catch { setSettings({}) }
  }, [bid])

  useEffect(() => {
    if (!bid) return
    const load = async () => {
      setLoading(true)
      const [p] = await Promise.all([fetchPages(), fetchSettings()])
      // Determine initial screen
      if (!isPaid) {
        setScreen('gate')
      } else if ((p || []).length === 0) {
        setScreen('onboarding')
      } else {
        setScreen('dashboard')
      }
      setLoading(false)
    }
    load()
  }, [bid, fetchPages, fetchSettings, isPaid])

  const handleRefresh = async () => {
    const p = await fetchPages()
    await fetchSettings()
    if ((p || []).length > 0 && screen !== 'dashboard') setScreen('dashboard')
  }

  if (!business || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: F }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${BORDER}`, borderTopColor: GOLD, borderRadius: '50%', animation: 'wpSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: MUTED, fontSize: 14 }}>Loading...</p>
          <style>{`@keyframes wpSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Screen 1: Upgrade Gate */}
      {screen === 'gate' && <UpgradeGate onUpgrade={() => setScreen('plans')} />}

      {/* Screen 2: Plan Selection */}
      {screen === 'plans' && <PlanSelection onSelect={(plan) => { setSelectedPlan(plan); setScreen('checkout') }} onBack={() => setScreen('gate')} />}

      {/* Screen 3: Checkout */}
      {screen === 'checkout' && <Checkout plan={selectedPlan} onBack={() => setScreen('plans')} onComplete={() => setScreen('onboarding')} />}

      {/* Screen 4: Onboarding */}
      {screen === 'onboarding' && <Onboarding onGetStarted={() => { setShowTemplates(true); setScreen('dashboard') }} />}

      {/* Screen 5: Dashboard */}
      {screen === 'dashboard' && (
        <Dashboard
          bid={bid}
          pages={pages}
          settings={settings}
          onRefresh={handleRefresh}
          onOpenSettings={() => setShowSettings(true)}
          onOpenTemplates={() => setShowTemplates(true)}
        />
      )}

      {/* Screen 6: Template Browser */}
      {showTemplates && (
        <TemplateBrowser
          bid={bid}
          onClose={() => setShowTemplates(false)}
          onApplied={handleRefresh}
        />
      )}

      {/* Screen 7: Website Settings */}
      {showSettings && (
        <SettingsPanel
          bid={bid}
          settings={settings}
          pages={pages}
          onClose={() => setShowSettings(false)}
          onSaved={(s) => setSettings(s)}
        />
      )}
    </>
  )
}

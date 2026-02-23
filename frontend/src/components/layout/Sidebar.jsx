/**
 * Fresha-style two-panel sidebar:
 * 1. Dark green icon rail (always visible, 64px)
 * 2. White secondary text panel (slides out smoothly, pushes content)
 * 3. Chevron toggle to expand/collapse
 * 4. Spring-like cubic-bezier transitions
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { isFeatureUnlocked, TIERS } from '../../config/tiers'
import UpgradeModal from './UpgradeModal'
import {
  LayoutDashboard,
  Calendar,
  UtensilsCrossed,
  Scissors,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react'

const RAIL_W = 64
const PANEL_W = 210

const getSections = (businessType) => {
  const isR = businessType === 'restaurant'
  return [
    {
      id: 'home', Icon: LayoutDashboard, label: 'Home',
      items: [{ id: 'home', label: 'Home Dashboard', path: '/dashboard', minTier: 'free' }],
    },
    {
      id: 'calendar', Icon: Calendar, label: 'Calendar',
      items: [
        { id: 'calendar', label: 'Calendar', path: '/dashboard/calendar', minTier: 'free' },
        { id: 'bookings', label: 'Bookings', path: '/dashboard/bookings', minTier: 'free' },
        { id: 'booking-link', label: 'Booking Link', path: '/dashboard/booking-link', minTier: 'free' },
      ],
    },
    {
      id: 'services', Icon: isR ? UtensilsCrossed : Scissors, label: isR ? 'Menu' : 'Services',
      items: [
        { id: 'services', label: isR ? 'Menu Items' : 'Services', path: '/dashboard/services', minTier: 'free' },
        { id: 'online-booking', label: 'Online Booking', path: '/dashboard/online-booking', minTier: 'starter' },
        ...(isR ? [{ id: 'orders', label: 'Orders', path: '/dashboard/orders', minTier: 'growth' }] : []),
      ],
    },
    {
      id: 'clients', Icon: Users, label: 'People',
      items: [
        { id: 'clients', label: 'Clients', path: '/dashboard/clients', minTier: 'growth' },
        { id: 'staff', label: 'Staff', path: '/dashboard/staff', minTier: 'starter' },
        { id: 'reviews', label: 'Reviews', path: '/dashboard/reviews', minTier: 'growth' },
      ],
    },
    {
      id: 'analytics', Icon: BarChart3, label: 'Business',
      items: [
        { id: 'payments', label: 'Payments', path: '/dashboard/payments', minTier: 'growth' },
        { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics', minTier: 'growth' },
        { id: 'marketing', label: 'Marketing', path: '/dashboard/marketing', minTier: 'scale' },
        ...(isR ? [{ id: 'floor-plan', label: 'Floor Plan', path: '/dashboard/floor-plan', minTier: 'scale' }] : []),
      ],
    },
    {
      id: 'settings', Icon: Settings, label: 'Settings',
      items: [
        { id: 'settings', label: 'Settings', path: '/dashboard/settings', minTier: 'free' },
        { id: 'help', label: 'Help Center', path: '/dashboard/help', minTier: 'free' },
      ],
    },
  ]
}

const Sidebar = ({ open, onNavigate }) => {
  const { business, businessType, tier } = useBusiness()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [panelOpen, setPanelOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
  const [upgradeModal, setUpgradeModal] = useState(null)

  const sections = getSections(businessType)

  useEffect(() => {
    for (const sec of sections) {
      if (sec.items.some((i) => i.path === location.pathname)) {
        setActiveSection(sec.id)
        return
      }
    }
  }, [location.pathname, businessType])

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0]

  const handleRailClick = (sec) => {
    if (activeSection === sec.id) {
      setPanelOpen((prev) => !prev)
    } else {
      setActiveSection(sec.id)
      setPanelOpen(true)
      const first = sec.items.find((i) => isFeatureUnlocked(tier, i.minTier))
      if (first) { navigate(first.path); onNavigate?.() }
    }
  }

  const handleItemClick = (item) => {
    if (!isFeatureUnlocked(tier, item.minTier)) {
      setUpgradeModal(TIERS[item.minTier]?.label || item.minTier)
      return
    }
    navigate(item.path)
    onNavigate?.()
  }

  const handleLogout = () => { logout?.(); navigate('/login'); onNavigate?.() }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      {/* ══════ DESKTOP ══════ */}
      <div
        className="hidden lg:flex shrink-0 h-screen relative"
        style={{
          width: panelOpen ? RAIL_W + PANEL_W : RAIL_W,
          transition: 'width 320ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        {/* Icon Rail */}
        <div className="absolute top-0 left-0 bottom-0 flex flex-col z-20" style={{ width: RAIL_W, background: '#1B4332' }}>
          <div className="h-16 flex items-center justify-center border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-sm">R</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center pt-4 gap-1 overflow-y-auto">
            {sections.map((sec) => {
              const SIcon = sec.Icon
              const hasActive = sec.items.some((i) => i.path === location.pathname)
              return (
                <button
                  key={sec.id}
                  onClick={() => handleRailClick(sec)}
                  className="group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/10"
                  style={{ background: hasActive ? 'rgba(255,255,255,0.14)' : undefined }}
                  title={sec.label}
                >
                  {hasActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-background" />}
                  <SIcon
                    size={20}
                    strokeWidth={hasActive ? 2.2 : 1.6}
                    color={hasActive ? '#FEFBF4' : 'rgba(254,251,244,0.45)'}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                  {!panelOpen && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl">
                      {sec.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="border-t border-white/10 py-3 flex flex-col items-center shrink-0">
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-background text-xs font-semibold hover:bg-white/20 transition-all duration-200"
              title="Log out"
            >{initials}</button>
          </div>
        </div>

        {/* Secondary Text Panel */}
        <div
          className="absolute top-0 bottom-0 flex flex-col bg-white border-r border-border"
          style={{
            left: RAIL_W,
            width: PANEL_W,
            transform: panelOpen ? 'translateX(0)' : `translateX(-${PANEL_W}px)`,
            opacity: panelOpen ? 1 : 0,
            transition: 'transform 320ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 250ms ease',
            pointerEvents: panelOpen ? 'auto' : 'none',
          }}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
            <span className="font-heading font-bold text-primary text-[15px] tracking-tight">
              {currentSection.label}
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-all duration-200"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2.5">
            {currentSection.items.map((item) => {
              const isActive = location.pathname === item.path
              const unlocked = isFeatureUnlocked(tier, item.minTier)
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] transition-all duration-200 flex items-center justify-between group mb-0.5
                    ${isActive
                      ? 'bg-primary/[0.07] text-primary font-bold'
                      : unlocked
                        ? 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium'
                        : 'text-gray-400 hover:bg-gray-50 font-medium'
                    }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="flex items-center gap-1.5">
                    {!unlocked && <Lock size={12} className="text-gray-300 group-hover:text-gray-400" />}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 inline-block" />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-border shrink-0">
            <div className="text-xs text-gray-500 font-medium truncate">{business?.name || 'Demo Business'}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {user?.role === 'owner' ? 'Owner' : 'Staff'} · {(tier || 'free').charAt(0).toUpperCase() + (tier || 'free').slice(1)} plan
            </div>
          </div>
        </div>

        {/* Expand arrow when collapsed */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-30"
          style={{
            left: RAIL_W - 1,
            opacity: panelOpen ? 0 : 1,
            pointerEvents: panelOpen ? 'none' : 'auto',
            transition: 'opacity 200ms ease',
          }}
        >
          <button
            onClick={() => setPanelOpen(true)}
            className="w-5 h-10 bg-white border border-border border-l-0 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-50 shadow-sm transition-all duration-200"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ══════ MOBILE ══════ */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onNavigate} />
      )}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 flex transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col shrink-0" style={{ width: RAIL_W, background: '#1B4332' }}>
          <div className="h-16 flex items-center justify-center border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-sm">R</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center pt-4 gap-1 overflow-y-auto">
            {sections.map((sec) => {
              const SIcon = sec.Icon
              const hasActive = sec.items.some((i) => i.path === location.pathname)
              return (
                <button key={sec.id}
                  onClick={() => { setActiveSection(sec.id); const f = sec.items.find((i) => isFeatureUnlocked(tier, i.minTier)); if (f) { navigate(f.path); onNavigate?.() } }}
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: hasActive ? 'rgba(255,255,255,0.14)' : 'transparent' }}
                >
                  {hasActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-background" />}
                  <SIcon size={20} strokeWidth={hasActive ? 2.2 : 1.6} color={hasActive ? '#FEFBF4' : 'rgba(254,251,244,0.45)'} />
                </button>
              )
            })}
          </div>
          <div className="border-t border-white/10 py-3 flex flex-col items-center shrink-0">
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-background text-xs font-semibold">{initials}</button>
          </div>
        </div>
        <div className="w-52 bg-white border-r border-border flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
            <span className="font-heading font-bold text-primary text-[15px]">{currentSection.label}</span>
            <button onClick={onNavigate} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-all"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2.5">
            {currentSection.items.map((item) => {
              const isActive = location.pathname === item.path
              const unlocked = isFeatureUnlocked(tier, item.minTier)
              return (
                <button key={item.id} onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] transition-all duration-200 flex items-center justify-between mb-0.5 ${isActive ? 'bg-primary/[0.07] text-primary font-bold' : unlocked ? 'text-gray-600 hover:bg-gray-50 hover:text-primary font-medium' : 'text-gray-400 font-medium'}`}
                >
                  <span>{item.label}</span>
                  {!unlocked && <Lock size={12} className="text-gray-300" />}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                </button>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-border shrink-0">
            <div className="text-xs text-gray-500 font-medium">{business?.name || 'Demo Business'}</div>
          </div>
        </div>
      </div>

      {upgradeModal && <UpgradeModal tierName={upgradeModal} onClose={() => setUpgradeModal(null)} onViewPlans={() => setUpgradeModal(null)} />}
    </>
  )
}

export default Sidebar

/**
 * Fresha-style: Dark green rail, icon-only, hover to reveal labels.
 * Main content does NOT shift when sidebar expands — sidebar overlays.
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Link2,
  Scissors,
  UtensilsCrossed,
  Users,
  Globe,
  UserCircle,
  Star,
  BarChart3,
  CreditCard,
  Megaphone,
  LayoutGrid,
  ShoppingBag,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { getNavItems } from '../../config/navigation'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { isFeatureUnlocked } from '../../config/tiers'
import UpgradeModal from './UpgradeModal'
import { TIERS } from '../../config/tiers'

const ICON_MAP = {
  'fa-house': LayoutDashboard,
  'fa-calendar-days': Calendar,
  'fa-clipboard-list': BookOpen,
  'fa-link': Link2,
  'fa-scissors': Scissors,
  'fa-utensils': UtensilsCrossed,
  'fa-users': Users,
  'fa-globe': Globe,
  'fa-address-book': UserCircle,
  'fa-star': Star,
  'fa-chart-line': BarChart3,
  'fa-credit-card': CreditCard,
  'fa-bullhorn': Megaphone,
  'fa-table-cells-large': LayoutGrid,
  'fa-bag-shopping': ShoppingBag,
  'fa-gear': Settings,
  'fa-circle-question': HelpCircle,
}

const Sidebar = ({ open, onNavigate }) => {
  const { business, businessType, tier } = useBusiness()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(null)

  const nav = getNavItems(businessType)

  const flattenNav = () => {
    const out = []
    const sections = [
      { key: 'main', items: nav.main },
      { key: 'management', items: nav.management },
      { key: 'business', items: nav.business },
      { key: 'advanced', items: nav.advanced },
      { key: 'system', items: nav.system },
    ]
    for (const { key, items } of sections) {
      if (key !== 'main' && out.length) {
        out.push({ id: `div-${key}`, type: 'divider' })
      }
      ;(items || []).forEach((item) => out.push(item))
    }
    return out
  }

  const handleClick = (item) => {
    if (item.type === 'divider') return
    const unlocked = isFeatureUnlocked(tier, item.minTier)
    if (!unlocked) {
      setUpgradeModal(TIERS[item.minTier]?.label || item.minTier)
      return
    }
    navigate(item.path)
    onNavigate?.()
  }

  const handleLogout = () => {
    logout?.()
    navigate('/login')
    onNavigate?.()
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isExpanded = expanded
  const sidebarWidth = isExpanded ? 220 : 64
  const translateClass = `transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`

  return (
    <>
      <nav
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${translateClass}`}
        style={{
          width: sidebarWidth,
          background: '#1B4332',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >

        {/* Logo */}
        <div
          className="flex items-center gap-3 px-[18px] shrink-0 h-16 border-b border-white/10"
        >
          <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0">
            <span className="text-primary font-heading font-bold text-sm">R</span>
          </div>
          <span
            className="text-background font-heading font-bold text-lg whitespace-nowrap transition-opacity duration-150"
            style={{ opacity: isExpanded ? 1 : 0 }}
          >
            Rezvo
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {flattenNav().map((item) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={item.id}
                  className="h-px bg-white/10 mx-3 my-2"
                />
              )
            }

            const isActive = location.pathname === item.path
            const Icon = ICON_MAP[item.icon] || LayoutDashboard
            const unlocked = isFeatureUnlocked(tier, item.minTier)

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full flex items-center gap-3 px-[18px] h-11 border-none cursor-pointer relative transition-colors duration-150 hover:bg-white/10"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-background"
                  />
                )}
                <Icon
                  size={20}
                  color={isActive ? '#FEFBF4' : 'rgba(254,251,244,0.55)'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className="shrink-0"
                />
                <span
                  className="text-[13.5px] font-body whitespace-nowrap transition-opacity duration-150"
                  style={{
                    color: isActive ? '#FEFBF4' : 'rgba(254,251,244,0.55)',
                    fontWeight: isActive ? 600 : 400,
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  {item.label}
                </span>
                {item.minTier && !unlocked && isExpanded && (
                  <span className="ml-auto text-[10px] text-white/30">🔒</span>
                )}
              </button>
            )
          })}
        </div>

        {/* User / Logout */}
        <div className="border-t border-white/10 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-3 px-[18px] py-3 border-t border-white/10 mt-1">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-background text-[13px] font-semibold">{initials}</span>
            </div>
            <div
              className="overflow-hidden whitespace-nowrap transition-opacity duration-150"
              style={{ opacity: isExpanded ? 1 : 0 }}
            >
              <div className="text-background text-[13px] font-medium">
                {business?.name || 'Demo Business'}
              </div>
              <div className="text-white/40 text-[11px]">
                {user?.role === 'owner' ? 'Owner' : 'Staff'}
              </div>
            </div>
            {isExpanded && (
              <button
                onClick={handleLogout}
                className="ml-auto p-1 text-white/40 hover:text-white/70 transition-colors shrink-0"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {upgradeModal && (
        <UpgradeModal
          tierName={upgradeModal}
          onClose={() => setUpgradeModal(null)}
          onViewPlans={() => setUpgradeModal(null)}
        />
      )}

      {/* Spacer — main content stays at 64px offset, sidebar overlays when expanded */}
      <div
        className="hidden lg:block shrink-0"
        style={{ width: 64 }}
      />
    </>
  )
}

export default Sidebar

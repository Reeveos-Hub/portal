/**
 * Run 1: Single nav item — active, hover, locked states
 */

import { Link, useLocation } from 'react-router-dom'
import { isFeatureUnlocked } from '../../config/tiers'

const SidebarItem = ({ item, currentTier, onLockedClick }) => {
  const location = useLocation()
  const isActive = location.pathname === item.path
  const isLocked = !isFeatureUnlocked(currentTier, item.minTier)

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault()
      onLockedClick?.(item)
    }
  }

  const baseClasses = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px]'
  const stateClasses = isLocked
    ? 'opacity-45 cursor-pointer hover:opacity-60 text-muted'
    : isActive
      ? 'bg-primary text-background'
      : 'text-muted hover:bg-border hover:text-primary'

  return (
    <Link
      to={isLocked ? '#' : item.path}
      onClick={handleClick}
      className={`${baseClasses} ${stateClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <i className={`fa-solid ${item.icon} w-5 text-center flex-shrink-0`} />
      <span className="font-body text-[13px] font-bold flex-1">{item.label}</span>
      {isLocked && (
        <i className="fa-solid fa-lock text-[10px] flex-shrink-0" aria-hidden="true" />
      )}
    </Link>
  )
}

export default SidebarItem

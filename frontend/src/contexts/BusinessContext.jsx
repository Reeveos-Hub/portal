/**
 * Run 1: Shell business context — type, tier, dev toggle
 * When TierContext has real business: use it and map tier.
 * Otherwise: mock for development.
 */

import { createContext, useContext, useState, useMemo } from 'react'
import { useTier } from './TierContext'
import { TIER_ORDER } from '../config/tiers'

const BusinessContext = createContext(null)

export const useBusiness = () => {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider')
  return ctx
}

// Map backend tier names to Run 1 tiers
const mapTier = (backendTier) => {
  const m = {
    solo: 'free',
    team: 'starter',
    venue: 'growth',
    free: 'free',
    starter: 'starter',
    growth: 'growth',
    scale: 'scale',
    enterprise: 'enterprise',
  }
  return m[backendTier] || 'free'
}

export const BusinessProvider = ({ children }) => {
  const tierCtx = useTier()
  const [devTypeOverride, setDevTypeOverride] = useState(null)
  const [devTierOverride, setDevTierOverride] = useState(null)

  const value = useMemo(() => {
    const business = tierCtx?.business
    const businessType = devTypeOverride ?? (business?.type === 'restaurant' ? 'restaurant' : 'services')
    const tier = devTierOverride ?? mapTier(business?.tier || business?.rezvo_tier) ?? 'growth'

    const setBusinessType = (type) => setDevTypeOverride(type)
    const cycleTier = () => {
      const idx = TIER_ORDER.indexOf(devTierOverride ?? tier)
      const next = TIER_ORDER[(idx + 1) % TIER_ORDER.length]
      setDevTierOverride(next)
    }

    const displayBusiness = business || {
      id: 'demo-001',
      name: businessType === 'restaurant' ? 'The Oak Kitchen' : 'Luxe Hair Studio',
      type: businessType,
      tier,
      logo: null,
      subtitle: businessType === 'restaurant' ? 'Restaurant & Bar' : 'Salon & Spa',
    }

    return {
      business: displayBusiness,
      businessType,
      tier,
      setBusinessType,
      cycleTier,
      loading: tierCtx?.loading ?? false,
    }
  }, [tierCtx?.business, tierCtx?.loading, devTypeOverride, devTierOverride])

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

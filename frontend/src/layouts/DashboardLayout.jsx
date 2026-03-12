/**
 * Dashboard shell — sidebar + top bar + content
 * Portal targets for SupportBot inpage/fullpage modes sit IN the flex tree
 */

import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBusiness } from '../contexts/BusinessContext'
import { isFeatureUnlocked } from '../config/tiers'
import { getNavItems } from '../config/navigation'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import UpgradeModal from '../components/layout/UpgradeModal'
import SupportBot from '../components/SupportBot'
import WalkthroughOverlay from '../components/WalkthroughOverlay'
import { WalkthroughProvider } from '../contexts/WalkthroughContext'
import { AssistantModeProvider, useAssistantMode } from '../contexts/AssistantModeContext'
import WelcomeBanner from '../components/shared/WelcomeBanner'
import AppLoader from '../components/shared/AppLoader'
import { TIERS } from '../config/tiers'
import { useEffect } from 'react'

const DashboardInner = () => {
  const { user } = useAuth()
  const { business, businessType, tier, loading } = useBusiness()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(null)
  const { mode: chatMode } = useAssistantMode()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [user, navigate])

  if (!user) return null
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AppLoader message="Loading dashboard..." size="lg" />
    </div>
  )

  const isFullpage = chatMode === 'fullpage'
  const isInpage = chatMode === 'inpage'
  const fullWidthPages = ['/dashboard', '/dashboard/calendar', '/dashboard/floor-plan', '/dashboard/client-messages', '/dashboard/pipeline', '/dashboard/crm', '/dashboard/shop']

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {/* Content area — hidden in fullpage mode */}
      {!isFullpage && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
          <TopBar
            onMenuClick={() => setSidebarOpen((o) => !o)}
            sidebarOpen={sidebarOpen}
          />
          <main className="flex-1 overflow-hidden">
            {fullWidthPages.includes(location.pathname) ? (
              <Outlet />
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                  <Outlet />
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Portal target: in-page panel (400px, right side, IN the flex row) */}
      {isInpage && (
        <div
          id="assistant-inpage-portal"
          style={{
            width: 400, flexShrink: 0,
            borderLeft: '1px solid #E5E7EB',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        />
      )}

      {/* Portal target: full page (takes all content space) */}
      {isFullpage && (
        <div
          id="assistant-fullpage-portal"
          style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        />
      )}

      {upgradeModal && (
        <UpgradeModal tierName={upgradeModal} onClose={() => setUpgradeModal(null)} onViewPlans={() => setUpgradeModal(null)} />
      )}
      <SupportBot />
      {!isFullpage && <WelcomeBanner />}
      <WalkthroughOverlay />
    </div>
  )
}

const DashboardLayout = () => (
  <AssistantModeProvider>
    <WalkthroughProvider>
      <DashboardInner />
    </WalkthroughProvider>
  </AssistantModeProvider>
)

export default DashboardLayout

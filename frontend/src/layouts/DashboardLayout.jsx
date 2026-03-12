/**
 * Dashboard shell — sidebar + top bar + content
 * Wraps with AssistantModeProvider so SupportBot can communicate mode changes
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

  const isInpage = chatMode === 'inpage'
  const isFullpage = chatMode === 'fullpage'

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300"
        style={{ marginRight: isInpage ? 400 : 0 }}
      >
        <TopBar
          onMenuClick={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-hidden">
          {isFullpage ? null : ['/dashboard', '/dashboard/calendar', '/dashboard/floor-plan', '/dashboard/client-messages', '/dashboard/pipeline', '/dashboard/crm', '/dashboard/shop'].includes(location.pathname) ? (
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

      {upgradeModal && (
        <UpgradeModal tierName={upgradeModal} onClose={() => setUpgradeModal(null)} onViewPlans={() => setUpgradeModal(null)} />
      )}
      <SupportBot />
      <WelcomeBanner />
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

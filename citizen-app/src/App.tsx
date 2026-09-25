/**
 * App.tsx — VARSHANET Citizen Mobile App
 *
 * Dedicated citizen-facing mobile application for the VARSHANET platform.
 * Fully isolated inside citizen-app/ — does NOT modify or interfere with the existing website.
 */

import { useState } from 'react'
import { useAppData } from './useAppData'
import { BottomNav } from './components/BottomNav'
import { LocationPicker } from './components/LocationPicker'
import { NotificationBanner } from './components/NotificationBanner'
import { AlertDetailModal } from './components/AlertDetailModal'
import { OfflineBanner } from './components/OfflineBanner'
import { OnboardingModal } from './components/OnboardingModal'
import { ServerConfigModal } from './components/ServerConfigModal'
import { HomeScreen } from './screens/HomeScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { AreaScreen } from './screens/AreaScreen'
import { SafetyScreen } from './screens/SafetyScreen'
import { HelpScreen } from './screens/HelpScreen'
import type { NavTab } from './types'

export default function App() {
  const data = useAppData()

  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false)
  const [showServerModal, setShowServerModal] = useState<boolean>(false)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  // Onboarding state: show on first launch if no location is set
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem('vn_onboarding_done')
  })

  const handleOnboardingComplete = (city: string) => {
    localStorage.setItem('vn_onboarding_done', 'true')
    setShowOnboarding(false)
    if (city) {
      data.setSelectedLocation(city)
    }
  }

  // Alert detail modal
  const openAlert = (id: string) => setSelectedAlertId(id)
  const closeAlert = () => setSelectedAlertId(null)

  // Notification click
  const handleViewNotif = (alertId: string) => {
    data.dismissNotif(alertId)
    setSelectedAlertId(alertId)
    setActiveTab('alerts')
  }

  return (
    <div
      className="flex flex-col bg-[#040711] text-slate-100 select-none overflow-hidden"
      style={{ height: '100dvh', maxWidth: 480, margin: '0 auto', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
    >
      {/* ── Onboarding / Welcome Splash ── */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* ── Alert Detail Modal Overlay ── */}
      {selectedAlertId && (
        <AlertDetailModal alertId={selectedAlertId} onClose={closeAlert} />
      )}

      {/* ── City Location Picker Overlay ── */}
      {showLocationPicker && (
        <LocationPicker
          current={data.selectedLocation}
          onSelect={data.setSelectedLocation}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* ── Server Endpoint Config Modal ── */}
      {showServerModal && (
        <ServerConfigModal
          onClose={() => setShowServerModal(false)}
          onSaved={data.refresh}
        />
      )}

      {/* ── In-App HIGH/CRITICAL Notification Banner ── */}
      {data.notifications.slice(0, 1).map(notif => (
        <NotificationBanner
          key={notif.id}
          alert={notif}
          onDismiss={() => data.dismissNotif(notif.id)}
          onView={() => handleViewNotif(notif.id)}
        />
      ))}

      {/* ── TOP APP BAR: Official VARSHANET Branding ── */}
      <header className="flex-shrink-0 bg-[#0b1329] border-b border-slate-800/80 px-4 py-2.5 z-10 shadow-md">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full p-0.5 bg-[#050b18] border border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.4)] overflow-hidden">
              <img
                src="/logo.png"
                alt="VARSHANET"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="font-mono font-black text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 leading-tight">
                VARSHANET
              </div>
              <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wide leading-tight">
                CITIZEN WARNING
              </div>
            </div>
          </div>

          {/* Right: Location & Server Connection Setting */}
          <div className="flex items-center gap-1.5">
            {/* Server Settings Button */}
            <button
              onClick={() => setShowServerModal(true)}
              className="p-1.5 rounded-xl bg-[#060a14] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-xs"
              title="Backend Server Settings"
              aria-label="Server settings"
            >
              📡
            </button>

            {/* Location Selector */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="bg-[#060a14] border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer max-w-[130px]"
              aria-label="Change location"
            >
              <span className="text-xs">📍</span>
              <span className="truncate">
                {data.selectedLocation || 'All Areas'}
              </span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Offline Banner ── */}
      <OfflineBanner
        isOffline={!data.isOnline}
        fromCache={data.fromCache}
        cachedAt={data.cachedAt}
      />

      {/* ── SCREEN VIEWPORTS ── */}
      {activeTab === 'home' && (
        <HomeScreen
          status={data.status}
          alerts={data.filteredAlerts}
          updates={data.updates}
          location={data.selectedLocation}
          isLoading={data.isLoading}
          lastRefreshed={data.lastRefreshed}
          onViewAlert={openAlert}
          onGoToAlerts={() => setActiveTab('alerts')}
          onGoToSafety={() => setActiveTab('safety')}
          onRefresh={data.refresh}
          onChangeCity={() => setShowLocationPicker(true)}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsScreen
          alerts={data.filteredAlerts}
          location={data.selectedLocation}
          isLoading={data.isLoading}
          onViewAlert={openAlert}
          onRefresh={data.refresh}
          onChangeCity={() => setShowLocationPicker(true)}
        />
      )}

      {activeTab === 'area' && (
        <AreaScreen
          allAlerts={data.allAlerts}
          status={data.status}
          selectedLocation={data.selectedLocation}
          onSelectLocation={loc => {
            data.setSelectedLocation(loc)
            setShowLocationPicker(false)
          }}
          onViewAlert={openAlert}
        />
      )}

      {activeTab === 'safety' && (
        <SafetyScreen
          alerts={data.filteredAlerts}
          status={data.status}
          onViewAlert={openAlert}
        />
      )}

      {activeTab === 'help' && (
        <HelpScreen updates={data.updates} />
      )}

      {/* ── BOTTOM NAVIGATION ── */}
      <BottomNav
        active={activeTab}
        alertCount={data.filteredAlerts.length}
        onChange={setActiveTab}
      />
    </div>
  )
}

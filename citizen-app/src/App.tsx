/**
 * App.tsx — VARSHANET Citizen Mobile App
 *
 * Dedicated citizen-facing mobile application for the VARSHANET platform.
 * Fully isolated inside citizen-app/ — does NOT modify or interfere with the existing website.
 */

import { useState, useEffect } from 'react'
import { useAppData } from './useAppData'
import { BottomNav } from './components/BottomNav'
import { LocationPicker } from './components/LocationPicker'
import { NotificationBanner } from './components/NotificationBanner'
import { AlertDetailModal } from './components/AlertDetailModal'
import { EmergencyAlertModal } from './components/EmergencyAlertModal'
import { OfflineBanner } from './components/OfflineBanner'
import { OnboardingModal } from './components/OnboardingModal'
import { ServerConfigModal } from './components/ServerConfigModal'
import { HomeScreen } from './screens/HomeScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { AreaScreen } from './screens/AreaScreen'
import { SafetyScreen } from './screens/SafetyScreen'
import { HelpScreen } from './screens/HelpScreen'
import { alertMatchesLocation } from './helpers'
import type { NavTab, CitizenAlert } from './types'

export default function App() {
  const data = useAppData()

  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false)
  const [showServerModal, setShowServerModal] = useState<boolean>(false)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [emergencyModalAlert, setEmergencyModalAlert] = useState<CitizenAlert | null>(null)

  // Dark / Light Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vn_theme') as 'dark' | 'light') || 'dark'
  })

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('vn_theme', nextTheme)
  }

  // Auto-pop emergency siren modal ONLY for user's chosen city!
  useEffect(() => {
    // If user has not selected a city, do NOT pop sirens for other cities
    if (!data.selectedLocation || !data.selectedLocation.trim() || data.selectedLocation === 'All Areas') {
      return
    }

    const candidate = data.filteredAlerts.find(a =>
      (a.severity === 'CRITICAL' || a.severity === 'HIGH') &&
      alertMatchesLocation(a.location, data.selectedLocation)
    )

    if (candidate) {
      const seenKey = `vn_emergency_seen_${candidate.id}_${data.selectedLocation}`
      if (!sessionStorage.getItem(seenKey)) {
        setEmergencyModalAlert(candidate)
        sessionStorage.setItem(seenKey, '1')
      }
    }
  }, [data.filteredAlerts, data.selectedLocation])

  // Real-time live alert pop: ONLY for user's selected city!
  useEffect(() => {
    if (!data.selectedLocation || !data.selectedLocation.trim() || data.selectedLocation === 'All Areas') {
      return
    }

    if (data.notifications.length > 0) {
      const latest = data.notifications.find(n =>
        alertMatchesLocation(n.location, data.selectedLocation)
      )
      if (latest) {
        const seenKey = `vn_emergency_seen_${latest.id}_${data.selectedLocation}`
        if (!sessionStorage.getItem(seenKey)) {
          setEmergencyModalAlert(latest)
          sessionStorage.setItem(seenKey, '1')
        }
      }
    }
  }, [data.notifications, data.selectedLocation])

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

  // Notification click — open the emergency modal directly
  const handleViewNotif = (alertId: string) => {
    data.dismissNotif(alertId)
    const target = data.allAlerts.find(a => a.id === alertId) || data.filteredAlerts.find(a => a.id === alertId)
    if (target) {
      setEmergencyModalAlert(target)
    } else {
      setSelectedAlertId(alertId)
    }
  }

  return (
    <div
      className={`flex flex-col select-none overflow-hidden ${
        theme === 'light' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#040711] text-slate-100'
      }`}
      style={{ height: '100dvh', maxWidth: 480, margin: '0 auto', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
    >
      {/* ── Emergency Alert Box with Red Siren ── */}
      {emergencyModalAlert && (
        <EmergencyAlertModal
          alert={emergencyModalAlert}
          onClose={() => setEmergencyModalAlert(null)}
        />
      )}
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

      {/* ── TOP APP BAR: Official VARSHANET Branding & Controls ── */}
      <header className={`flex-shrink-0 border-b px-3.5 py-2.5 z-10 shadow-md ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b1329] border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between">
          {/* Official Logo & Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-2xl p-0.5 bg-[#050b18] border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="VARSHANET"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
              <span className="text-xl">⛈️</span>
            </div>
            <div>
              <div className="font-mono font-black text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 leading-tight">
                VARSHANET
              </div>
              <div className="text-[10px] font-mono font-bold tracking-tight leading-tight text-cyan-400">
                नागरिक मौसम सुरक्षा
              </div>
            </div>
          </div>

          {/* Right Controls: Dark/Light Mode, Server, Location */}
          <div className="flex items-center gap-1.5">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer text-xs flex items-center justify-center w-8 h-8 ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200'
                  : 'bg-[#060a14] border-slate-700 text-amber-300 hover:border-cyan-400'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Server Settings Button */}
            <button
              onClick={() => setShowServerModal(true)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer text-xs w-8 h-8 flex items-center justify-center ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#060a14] border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300'
              }`}
              title="Backend Server Settings"
              aria-label="Server settings"
            >
              📡
            </button>

            {/* City Location Selector */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className={`border text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer max-w-[130px] ${
                theme === 'light'
                  ? 'bg-slate-100 border-cyan-600/40 text-cyan-800 hover:border-cyan-600'
                  : 'bg-[#060a14] border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
              }`}
              aria-label="Change location"
            >
              <span className="text-xs">📍</span>
              <span className="truncate">
                {data.selectedLocation || 'Select City'}
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
          onGoToArea={() => setActiveTab('area')}
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

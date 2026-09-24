import React, { useState } from 'react';
import { WeatherProvider } from './context/WeatherContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { MissionControl } from './pages/MissionControl';
import { LiveNowcast } from './pages/LiveNowcast';
import { WeatherMap } from './pages/WeatherMap';
import { HazardAnalysis } from './pages/HazardAnalysis';
import { ForecastTimeline } from './pages/ForecastTimeline';
import { DataFusion } from './pages/DataFusion';
import { Alerts } from './pages/Alerts';
import { HistoricalEvents } from './pages/HistoricalEvents';
import { AIInsights } from './pages/AIInsights';
import { SystemHealth } from './pages/SystemHealth';
import { Architecture } from './pages/Architecture';
import { SectorCommand } from './pages/SectorCommand';
import { AlertDissemination } from './pages/AlertDissemination';
import { RadarVision } from './pages/RadarVision';
import { VolumetricRadar } from './pages/VolumetricRadar';
import { IntroSplash } from './components/auth/IntroSplash';
import { LoginPage } from './components/auth/LoginPage';

const validTabs: NavTab[] = [
  'mission_control', 'live_nowcast', 'weather_map', 'hazard_analysis',
  'forecast_timeline', 'sector_command', 'data_fusion', 'alerts',
  'alert_dissemination', 'historical_events', 'ai_insights',
  'radar_vision', 'volumetric_3d', 'system_health', 'architecture'
];

const AppContent: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('varshanet_auth') === 'true';
  });
  const [operatorId, setOperatorId] = useState<string>(() => {
    return localStorage.getItem('varshanet_operator') || 'IMD-RADAR-OP-84';
  });

  const getInitialState = (): { showLanding: boolean; tab: NavTab } => {
    const hash = window.location.hash.replace('#', '');
    if (validTabs.includes(hash as NavTab)) {
      return { showLanding: false, tab: hash as NavTab };
    }
    return { showLanding: true, tab: 'mission_control' };
  };

  const initial = getInitialState();
  const [showLanding, setShowLanding] = useState<boolean>(initial.showLanding);
  const [currentTab, setCurrentTab] = useState<NavTab>(initial.tab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'landing' || !hash) {
        setShowLanding(true);
      } else if (validTabs.includes(hash as NavTab)) {
        setCurrentTab(hash as NavTab);
        setShowLanding(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleEnterDashboard = (tab: NavTab = 'mission_control') => {
    setCurrentTab(tab);
    setShowLanding(false);
    window.location.hash = tab;
  };

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setShowLanding(false);
    setMobileMenuOpen(false);
    window.location.hash = tab;
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'mission_control':
        return <MissionControl />;
      case 'live_nowcast':
        return <LiveNowcast />;
      case 'weather_map':
        return <WeatherMap />;
      case 'hazard_analysis':
        return <HazardAnalysis />;
      case 'forecast_timeline':
        return <ForecastTimeline />;
      case 'sector_command':
        return <SectorCommand />;
      case 'data_fusion':
        return <DataFusion />;
      case 'alerts':
        return <Alerts />;
      case 'alert_dissemination':
        return <AlertDissemination />;
      case 'historical_events':
        return <HistoricalEvents />;
      case 'ai_insights':
        return <AIInsights />;
      case 'radar_vision':
        return <RadarVision />;
      case 'volumetric_3d':
        return <VolumetricRadar />;
      case 'system_health':
        return <SystemHealth />;
      case 'architecture':
        return <Architecture />;
      default:
        return <MissionControl />;
    }
  };

  if (showIntro) {
    return <IntroSplash onComplete={() => setShowIntro(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(opId, sector) => {
          setIsAuthenticated(true);
          setOperatorId(opId);
          localStorage.setItem('varshanet_auth', 'true');
          localStorage.setItem('varshanet_operator', opId);
          localStorage.setItem('varshanet_sector', sector);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <Navbar
        operatorId={operatorId}
        onLogout={() => {
          setIsAuthenticated(false);
          localStorage.removeItem('varshanet_auth');
        }}
        onNavigateAlerts={() => {
          setShowLanding(false);
          setCurrentTab('alerts');
          window.location.hash = 'alerts';
        }}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Container */}
      {showLanding ? (
        <main className="flex-1 overflow-y-auto">
          <LandingPage onEnter={handleEnterDashboard} />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile Overlay Backdrop */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden cursor-pointer"
            />
          )}

          {/* Left Sidebar Drawer */}
          <div
            className={`fixed inset-y-16 left-0 z-40 lg:static lg:inset-y-auto lg:z-20 transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            } flex shadow-2xl lg:shadow-none`}
          >
            <Sidebar
              currentTab={currentTab}
              onSelectTab={handleSelectTab}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Operational Content Screen */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#070b14] w-full min-w-0">
            {/* Quick Breadcrumb Strip */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowLanding(true);
                    window.location.hash = 'landing';
                  }}
                  className="hover:text-cyan-400 transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <img src="/logo.png" alt="VARSHANET Logo" className="w-4 h-4 object-contain rounded-full border border-cyan-500/40" />
                  <span className="font-bold">VARSHANET</span>
                </button>
                <span>/</span>
                <span className="text-cyan-300 font-bold uppercase">{currentTab.replace('_', ' ')}</span>
              </div>

              <button
                onClick={() => {
                  setShowLanding(true);
                  window.location.hash = 'landing';
                }}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              >
                ← Return to Intro
              </button>
            </div>

            {renderActiveScreen()}
          </main>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WeatherProvider>
      <AppContent />
    </WeatherProvider>
  );
};

export default App;

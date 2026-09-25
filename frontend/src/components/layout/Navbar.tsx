import React from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  Activity,
  Radio,
  Bell,
  Play,
  Pause,
  RotateCw,
  ShieldAlert,
  Server,
  CloudLightning,
  UserCheck,
  Menu,
  HelpCircle,
  LogOut,
  Settings
} from 'lucide-react';
import { QuickGuideModal } from './QuickGuideModal';
import { SettingsModal } from './SettingsModal';

interface NavbarProps {
  onNavigateAlerts: () => void;
  onToggleMobileMenu?: () => void;
  operatorId?: string;
  onLogout?: () => void;
  onOpenCitizenPortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateAlerts,
  onToggleMobileMenu,
  operatorId,
  onLogout,
  onOpenCitizenPortal
}) => {
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const {
    selectedRegion,
    setSelectedRegion,
    regions,
    isLiveSimulation,
    setIsLiveSimulation,
    simulationTick,
    alerts,
    systemHealth,
    currentTimeStr,
    triggerManualTick,
    systemMode,
    setSystemMode
  } = useWeather();

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <header className="h-16 bg-[#090e1a]/95 backdrop-blur border-b border-slate-800/80 px-2 sm:px-4 flex items-center justify-between z-30 sticky top-0 w-full min-w-0">
      {/* Brand & System Status */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="VARSHANET Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full border border-cyan-400/40 shadow-md shadow-cyan-950/50 hover:scale-105 transition-transform shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base sm:text-lg tracking-wider text-slate-100 font-mono">VARSHANET</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold uppercase tracking-widest hidden sm:inline">
                v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Operational Mode Switcher: Compact buttons without huge verbose text */}
        <div className="hidden md:flex items-center pl-2 sm:pl-3 border-l border-slate-800">
          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setSystemMode('LIVE_DATA')}
              className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                systemMode === 'LIVE_DATA'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LIVE
            </button>
            <button
              onClick={() => setSystemMode('SIMULATION')}
              className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                systemMode === 'SIMULATION'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SIM
            </button>
          </div>
        </div>
      </div>

      {/* Center: Region Selector (compact) */}
      <div className="flex items-center space-x-2 shrink min-w-0 px-2">
        {/* Time display: only on very wide screens */}
        <div className="hidden 2xl:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 rounded border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>{currentTimeStr || '12:00:00 IST'}</span>
        </div>

        {/* Region Selector */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer truncate max-w-[150px] sm:max-w-[200px]"
          >
            {regions.map((reg) => (
              <option key={reg.name} value={reg.name} className="bg-slate-900 text-slate-200">
                {reg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Simulator, Settings, Alerts, Profile (ALL SHRINK-0 & NEVER HIDDEN) */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Simulation Controls: hidden on small laptops, visible on larger */}
        <div className="hidden xl:flex items-center space-x-1 bg-slate-900/90 p-0.5 rounded border border-slate-800 shrink-0">
          <button
            onClick={() => setIsLiveSimulation(!isLiveSimulation)}
            title={isLiveSimulation ? "Pause simulation auto-tick" : "Resume simulation auto-tick"}
            className={`p-1 rounded text-xs transition-colors ${
              isLiveSimulation
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLiveSimulation ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <button
            onClick={triggerManualTick}
            title="Step simulation +1 step forward"
            className="p-1 rounded text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          <div className="px-1.5 text-[10px] font-mono text-slate-400">
            T:<span className="text-cyan-400 font-bold">{simulationTick}</span>
          </div>
        </div>

        {/* Quick Guide Button */}
        <button
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-400/50 text-cyan-300 hover:text-white text-xs font-mono font-semibold transition-all shadow-sm cursor-pointer shrink-0"
          title="Open interactive quick guide for beginners & evaluators"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Settings Button (100% VISIBLE & HIGHLIGHTED) */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm shrink-0"
          title="Terminal Settings & Citizen Portal Access"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
          <span>Settings</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-1.5 sm:p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-colors text-slate-300 hover:text-red-400 cursor-pointer shrink-0"
          title={`${activeAlertsCount} Active Warning Alerts`}
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Operator Profile */}
        <div className="flex items-center space-x-1.5 pl-1.5 border-l border-slate-800 shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-[11px] font-mono font-bold text-slate-200 truncate max-w-[110px]">{operatorId || 'RADAR-OP-84'}</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Logout & Return to Portal Selection"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Guide Interactive Modal */}
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* System Settings Modal (Contains Citizen Portal launch button) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        operatorId={operatorId}
        onOpenCitizenPortal={onOpenCitizenPortal}
      />
    </header>
  );
};


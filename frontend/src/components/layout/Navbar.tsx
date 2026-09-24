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
  HelpCircle
} from 'lucide-react';
import { QuickGuideModal } from './QuickGuideModal';

interface NavbarProps {
  onNavigateAlerts: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateAlerts, onToggleMobileMenu }) => {
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
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
    triggerManualTick
  } = useWeather();

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <header className="h-16 bg-[#090e1a]/95 backdrop-blur border-b border-slate-800/80 px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & System Status */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="VARSHANET Logo"
            className="w-9 h-9 object-contain rounded-full border border-cyan-400/40 shadow-lg shadow-cyan-950/50 hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-wider text-slate-100 font-mono">VARSHANET</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold uppercase tracking-widest">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
              Convective Weather Intelligence & 0–6 Hour Nowcasting
            </p>
          </div>
        </div>

        {/* Live Simulation Indicator */}
        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span>LIVE SIMULATION</span>
          </div>

          <div className="px-2.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold tracking-wide">
            SIMULATION MODE / DEMO DATA
          </div>
        </div>
      </div>

      {/* Center: Real-time Clock & Region Selector */}
      <div className="flex items-center space-x-3">
        {/* Time display */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1 bg-slate-900/90 rounded border border-slate-800 text-xs font-mono text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTimeStr || '12:00:00 IST | 06:30:00 UTC'}</span>
        </div>

        {/* Region Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="region-select" className="text-xs text-slate-400 hidden md:inline">Region:</label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {regions.map((reg) => (
              <option key={reg.name} value={reg.name} className="bg-slate-900 text-slate-200">
                {reg.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Simulator Controls, Alerts, Profile */}
      <div className="flex items-center space-x-3">
        {/* Simulation Controls */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded border border-slate-800">
          <button
            onClick={() => setIsLiveSimulation(!isLiveSimulation)}
            title={isLiveSimulation ? "Pause simulation auto-tick" : "Resume simulation auto-tick"}
            className={`p-1.5 rounded text-xs transition-colors ${
              isLiveSimulation
                ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/40 border border-blue-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isLiveSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={triggerManualTick}
            title="Step simulation +1 step forward"
            className="p-1.5 rounded text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="px-2 text-[11px] font-mono text-slate-400">
            TICK: <span className="text-cyan-400 font-semibold">{simulationTick}</span>
          </div>
        </div>

        {/* Telemetry Indicator (Simulated Telemetry) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 rounded border border-slate-800 text-xs font-mono">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">SIM RADAR:</span>
          <span className="text-cyan-400 font-medium">{systemHealth?.radar_latency_sec || 18}s (sim)</span>
        </div>

        {/* Quick Guide Button */}
        <button
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-400/50 text-cyan-300 hover:text-white text-xs font-mono font-semibold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
          title="Open interactive quick guide for beginners & evaluators"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Quick Guide</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-colors text-slate-300 hover:text-red-400 cursor-pointer"
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
        <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-mono font-medium text-slate-200">DEMO CONSOLE #4</div>
            <div className="text-[10px] text-slate-500">SIMULATION DESK</div>
          </div>
        </div>
      </div>

      {/* Quick Guide Interactive Modal */}
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </header>
  );
};


import React from 'react';
import {
  Compass,
  Radio,
  MapPin,
  AlertTriangle,
  Clock,
  Layers,
  BellRing,
  History,
  BrainCircuit,
  Activity,
  Cpu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

export type NavTab =
  | 'mission_control'
  | 'live_nowcast'
  | 'weather_map'
  | 'hazard_analysis'
  | 'forecast_timeline'
  | 'data_fusion'
  | 'alerts'
  | 'historical_events'
  | 'ai_insights'
  | 'system_health'
  | 'architecture';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse
}) => {
  const { alerts } = useWeather();
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }[] = [
    { id: 'mission_control', label: 'Mission Control', icon: <Compass className="w-4 h-4" /> },
    { id: 'live_nowcast', label: 'Live Nowcast', icon: <Radio className="w-4 h-4" />, badge: 'LIVE', badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-700/60' },
    { id: 'weather_map', label: 'Weather Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'hazard_analysis', label: 'Hazard Analysis', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    { id: 'forecast_timeline', label: 'Forecast Timeline', icon: <Clock className="w-4 h-4" />, badge: '0-6H' },
    { id: 'data_fusion', label: 'Data Fusion', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <BellRing className="w-4 h-4 text-red-400" />,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-red-600 text-white animate-pulse'
    },
    { id: 'historical_events', label: 'Historical Events', icon: <History className="w-4 h-4" /> },
    { id: 'ai_insights', label: 'AI Insights', icon: <BrainCircuit className="w-4 h-4 text-cyan-400" />, badge: 'XAI' },
    { id: 'system_health', label: 'System Health', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { id: 'architecture', label: 'Architecture & Docs', icon: <Cpu className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`bg-[#080d19] border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="py-3">
        {/* Brand header with logo */}
        <div className={`px-3 pb-3 mb-2 border-b border-slate-800/80 flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'}`}>
          <img
            src="/logo.png"
            alt="VARSHANET Logo"
            className="w-7 h-7 object-contain rounded-full border border-cyan-500/40 shadow-sm shrink-0"
            title="VARSHANET"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-mono font-bold text-xs text-white tracking-wider truncate">
                VARSHANET
              </div>
              <div className="text-[9px] font-mono text-cyan-400/90 tracking-tight truncate">
                NOWCAST SUITE
              </div>
            </div>
          )}
        </div>

        {/* Section title */}
        {!collapsed && (
          <div className="px-5 mb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Operational Modules
          </div>
        )}

        {/* Nav list */}
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-950/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div
                  className={`flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                </div>

                {!collapsed && (
                  <span className="ml-3 tracking-wide flex-1 text-left whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom collapse button and system tag */}
      <div className="p-3 border-t border-slate-800/60">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs font-mono text-slate-400">Collapse Nav</span>}
        </button>

        {!collapsed && (
          <div className="mt-3 px-2 flex items-center justify-center space-x-1.5 text-[10px] font-mono text-slate-500 text-center">
            <img src="/logo.png" alt="VARSHANET" className="w-3.5 h-3.5 object-contain rounded-full" />
            <span>VARSHANET • Grid v2.4</span>
          </div>
        )}
      </div>
    </aside>
  );
};

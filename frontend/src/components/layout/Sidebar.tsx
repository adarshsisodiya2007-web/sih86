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
  ChevronRight,
  Send,
  Shield,
  Video,
  Box
} from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

export type NavTab =
  | 'mission_control'
  | 'live_nowcast'
  | 'weather_map'
  | 'hazard_analysis'
  | 'forecast_timeline'
  | 'sector_command'
  | 'data_fusion'
  | 'alerts'
  | 'alert_dissemination'
  | 'historical_events'
  | 'ai_insights'
  | 'radar_vision'
  | 'volumetric_3d'
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

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }

  interface NavSection {
    sectionTitle: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      sectionTitle: 'OPERATIONS & GOVT',
      items: [
        { id: 'mission_control', label: 'Mission Control', icon: <Compass className="w-4 h-4" /> },
        { id: 'sector_command', label: 'Sector Command Portals', icon: <Shield className="w-4 h-4 text-cyan-400" />, badge: '3 PORTALS', badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800/60' },
        { id: 'weather_map', label: 'Weather Map', icon: <MapPin className="w-4 h-4" /> },
        { id: 'forecast_timeline', label: '0–6H Timeline', icon: <Clock className="w-4 h-4" />, badge: 'NOWCAST' },
        { id: 'live_nowcast', label: 'Sensor Feed Flow', icon: <Radio className="w-4 h-4" />, badge: 'LIVE', badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-700/60' }
      ]
    },
    {
      sectionTitle: 'HAZARDS & DISSEMINATION',
      items: [
        { id: 'hazard_analysis', label: 'Hazard Diagnostics', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
        {
          id: 'alerts',
          label: 'Emergency Alerts',
          icon: <BellRing className="w-4 h-4 text-red-400" />,
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
          badgeColor: 'bg-red-600 text-white animate-pulse'
        },
        {
          id: 'alert_dissemination',
          label: 'Dissemination & CAP',
          icon: <Send className="w-4 h-4 text-orange-400" />,
          badge: 'NDMA XML',
          badgeColor: 'bg-red-950 text-red-300 border border-red-800/60'
        }
      ]
    },
    {
      sectionTitle: 'AI & INTELLIGENCE',
      items: [
        { id: 'ai_insights', label: 'AI & ML Suite', icon: <BrainCircuit className="w-4 h-4 text-cyan-400" />, badge: '5 MODELS', badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' },
        { id: 'radar_vision', label: 'Radar Vision (ConvLSTM)', icon: <Video className="w-4 h-4 text-cyan-400" />, badge: 'NOWCAST AI', badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' },
        { id: 'volumetric_3d', label: '3D Storm Cell Radar', icon: <Box className="w-4 h-4 text-purple-400" />, badge: '3D CAPPI', badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800/60' },
        { id: 'historical_events', label: 'Historical Benchmarks', icon: <History className="w-4 h-4" /> },
        { id: 'data_fusion', label: 'Data Fusion Pipeline', icon: <Layers className="w-4 h-4" /> }
      ]
    },
    {
      sectionTitle: 'SYSTEM',
      items: [
        { id: 'system_health', label: 'System Telemetry', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
        { id: 'architecture', label: 'System Architecture', icon: <Cpu className="w-4 h-4" /> }
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#080d19] border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between z-20 select-none overflow-y-auto ${
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

        {/* Categorized Nav Sections */}
        <div className="space-y-4 px-2">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pt-1 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  {sec.sectionTitle}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
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
                      <span className="ml-2.5 tracking-wide flex-1 text-left whitespace-nowrap text-xs">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`ml-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
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

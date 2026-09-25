import React from 'react';
import { ExecutiveSummaryCard } from '../components/dashboard/ExecutiveSummaryCard';
import { KpiCards } from '../components/dashboard/KpiCards';
import { GisWeatherMap } from '../components/maps/GisWeatherMap';
import { ActiveCellsPanel } from '../components/dashboard/ActiveCellsPanel';
import { NowcastTimeline } from '../components/nowcast/NowcastTimeline';
import { useWeather } from '../context/WeatherContext';
import { AlertTriangle } from 'lucide-react';

export const MissionControl: React.FC = () => {
  const { alerts, citizenReports } = useWeather();
  const activeSevereAlert = alerts.find(a => a.severity === 'severe' && a.status === 'active');

  return (
    <div className="space-y-4">
      {/* Top Executive Plain-English Threat Summary & View Mode Switcher */}
      <ExecutiveSummaryCard />

      {/* Critical Operational Banner if Severe Alert active */}
      {activeSevereAlert && (
        <div className="bg-red-950/70 border border-red-500/60 rounded-xl p-3 text-red-200 flex items-center justify-between shadow-lg shadow-red-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-600/30 border border-red-500/50 text-red-400 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-wide uppercase text-red-300">
                CRITICAL CONVECTIVE WARNING: {activeSevereAlert.title}
              </div>
              <div className="text-xs text-slate-300">
                {activeSevereAlert.region} • Onset ETA: <strong className="text-white">{activeSevereAlert.onset_minutes} mins</strong> • {activeSevereAlert.recommended_action}
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded bg-red-900/60 text-red-300 border border-red-600/50 text-xs font-mono font-bold">
            PROB: {activeSevereAlert.probability}%
          </span>
        </div>
      )}

      {/* Citizen Safety & Population Exposure Intelligence Strip */}
      <div className="bg-gradient-to-r from-slate-900/90 via-[#0a1224] to-slate-900/90 border border-slate-800 rounded-xl p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-slate-400 uppercase text-[11px]">CITIZEN DELIVERY:</span>
            <span className="text-emerald-300 font-bold">SACHET CELL-BROADCAST ACTIVE</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-slate-400">POPULATION AT RISK:</span>
            <strong className="text-amber-400 font-bold">~42,500 Citizens</strong>
            <span className="text-[10px] text-slate-400">(62% Rural Farmers)</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-slate-400">GROUND TRUTH FEED:</span>
            <strong className="text-cyan-400 font-bold">{citizenReports.length} Reports</strong>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
              RADAR CORRELATED
            </span>
          </div>
        </div>

        <a
          href="#alert_dissemination"
          className="shrink-0 flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all shadow cursor-pointer"
        >
          <span>VIEW DISSEMINATION DESK</span>
          <span>→</span>
        </a>
      </div>

      {/* Top 7 Operational KPI Cards */}
      <KpiCards />

      {/* Central Interactive Grid: Map + Active Weather Cells */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Large Interactive Weather Map (2 Columns on Desktop) */}
        <div className="lg:col-span-2">
          <GisWeatherMap height="530px" showControls={true} />
        </div>

        {/* Right Active Weather Cells Tracker (1 Column) */}
        <div className="lg:col-span-1">
          <ActiveCellsPanel />
        </div>
      </div>

      {/* Bottom 0-6 Hour Nowcast Timeline */}
      <NowcastTimeline />
    </div>
  );
};

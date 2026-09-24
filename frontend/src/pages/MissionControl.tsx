import React from 'react';
import { ExecutiveSummaryCard } from '../components/dashboard/ExecutiveSummaryCard';
import { KpiCards } from '../components/dashboard/KpiCards';
import { GisWeatherMap } from '../components/maps/GisWeatherMap';
import { ActiveCellsPanel } from '../components/dashboard/ActiveCellsPanel';
import { NowcastTimeline } from '../components/nowcast/NowcastTimeline';
import { useWeather } from '../context/WeatherContext';
import { AlertTriangle } from 'lucide-react';

export const MissionControl: React.FC = () => {
  const { alerts } = useWeather();
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

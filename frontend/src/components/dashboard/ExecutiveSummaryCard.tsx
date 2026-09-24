import React, { useState } from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Flame,
  CloudRain,
  Wind,
  Zap,
  Info,
  ChevronRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

export const ExecutiveSummaryCard: React.FC = () => {
  const { stormCells, alerts, selectedRegion, forecast } = useWeather();
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');

  // Find nearest storm cell with smallest ETA
  const activeCells = Object.values(stormCells);
  const nearestCell = activeCells.length > 0
    ? [...activeCells].sort((a, b) => a.eta_minutes - b.eta_minutes)[0]
    : null;

  const activeAlert = alerts.find(a => a.status === 'active');
  const primaryScore = forecast[0]?.composite_risk || (nearestCell ? 82 : 45);

  const isSevere = primaryScore >= 75 || nearestCell?.intensity === 'severe';
  const isHigh = primaryScore >= 55 || nearestCell?.intensity === 'high';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl transition-all ${
      isSevere
        ? 'bg-gradient-to-r from-red-950/60 via-slate-900 to-[#0b1120] border-red-500/50 shadow-red-950/30'
        : isHigh
        ? 'bg-gradient-to-r from-orange-950/60 via-slate-900 to-[#0b1120] border-orange-500/50 shadow-orange-950/30'
        : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0b1120] border-emerald-500/40'
    }`}>
      {/* Top Bar: Sector Status & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${
            isSevere
              ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
              : isHigh
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
          }`}>
            {isSevere || isHigh ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                isSevere ? 'bg-red-950 text-red-300 border border-red-700' :
                isHigh ? 'bg-orange-950 text-orange-300 border border-orange-700' :
                'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {isSevere ? 'SEVERE THREAT' : isHigh ? 'HIGH ALERT' : 'STABLE / NORMAL'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Sector: <strong className="text-white">{selectedRegion}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide mt-0.5">
              {isSevere
                ? `Severe Convective Storm Approaching (${nearestCell ? `ETA: ${nearestCell.eta_minutes} mins` : 'Immediate Threat'})`
                : isHigh
                ? `Elevated Storm & Heavy Rainfall Risk (${nearestCell ? `ETA: ${nearestCell.eta_minutes} mins` : 'Next 30 mins'})`
                : 'Atmospheric Boundary Layer Stable — No Imminent Hazard Detected'}
            </h2>
          </div>
        </div>

        {/* Mode Toggle Button (Simple vs Detailed) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'simple'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Simple English</span>
          </button>
          <button
            onClick={() => setViewMode('technical')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'technical'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Forecaster Deep-Dive</span>
          </button>
        </div>
      </div>

      {/* Body: Simple View vs Technical View */}
      {viewMode === 'simple' ? (
        <div className="pt-3.5 space-y-3 font-sans">
          {/* Plain English Explanation */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 font-mono">WHAT THIS MEANS FOR YOU: </strong>
              {isSevere ? (
                <span>
                  A powerful convective cloud is moving toward <strong className="text-white">{selectedRegion}</strong> at approximately{' '}
                  <strong className="text-white">{nearestCell?.speed_kmh || 38} km/h</strong>. It carries intense precipitation, lightning, 
                  and high probability of damaging hail. Arrival is expected in approximately{' '}
                  <strong className="text-amber-400">{nearestCell?.eta_minutes || 14} minutes</strong>.
                </span>
              ) : isHigh ? (
                <span>
                  Thunderstorm clusters are developing over the sector. Heavy rain showers and localized waterlogging are anticipated within the next hour.
                </span>
              ) : (
                <span>
                  Weather sensors indicate calm conditions. No sudden cloudbursts, severe hail, or destructive downburst winds are forecast in the next 0–6 hours.
                </span>
              )}
            </div>
          </div>

          {/* 4 Quick Human-Friendly Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">STORM IMPACT ETA</span>
              <span className="text-sm font-bold text-amber-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{nearestCell ? `${nearestCell.eta_minutes} mins` : 'Clear'}</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">PRIMARY HAZARD</span>
              <span className="text-sm font-bold text-white flex items-center space-x-1">
                {isSevere ? <Flame className="w-3.5 h-3.5 text-orange-400" /> : <CloudRain className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{nearestCell?.hazards?.[0] ? nearestCell.hazards[0].toUpperCase() : 'THUNDERSTORM'}</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">AI RISK SCORE</span>
              <span className={`text-sm font-bold ${primaryScore >= 75 ? 'text-red-400' : 'text-emerald-400'}`}>
                {primaryScore} / 100
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">EMERGENCY ALERT</span>
              <span className={`text-sm font-bold ${activeAlert ? 'text-red-400' : 'text-slate-400'}`}>
                {activeAlert ? 'ACTIVE (CAP-CP 1.2)' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Action Callout */}
          <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs font-mono text-red-300 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Recommended Action: Seek indoor shelter immediately. Avoid waterlogged roads & isolated trees.</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="pt-3.5 space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 text-[10px] block">RADAR CORE (dBZ)</span>
              <span className="text-cyan-300 font-bold text-sm">{nearestCell?.dbz_max || 62.3} dBZ</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">VIL DENSITY</span>
              <span className="text-cyan-300 font-bold text-sm">{nearestCell?.vil_kgm2 ? `${(nearestCell.vil_kgm2 / (nearestCell.echo_top_km || 15)).toFixed(1)} g/m³` : '3.8 g/m³'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">ECHO TOP (KM)</span>
              <span className="text-cyan-300 font-bold text-sm">{nearestCell?.echo_top_km || 15.2} km</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">CAPE INSTABILITY</span>
              <span className="text-cyan-300 font-bold text-sm">{nearestCell?.cape_jkg || 2850} J/kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useWeather } from '../../context/WeatherContext';
import { StormCell, HazardType, SeverityLevel } from '../../types';
import {
  Flame,
  CloudRain,
  Zap,
  Wind,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const ActiveCellsPanel: React.FC = () => {
  const { stormCells, selectedCell, setSelectedCell, systemMode, setSystemMode } = useWeather();

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'severe':
        return 'bg-red-950/90 text-red-400 border-red-700/80';
      case 'high':
        return 'bg-orange-950/90 text-orange-400 border-orange-700/80';
      case 'elevated':
        return 'bg-yellow-950/90 text-yellow-400 border-yellow-700/80';
      case 'moderate':
        return 'bg-blue-950/90 text-blue-400 border-blue-700/80';
      default:
        return 'bg-emerald-950/90 text-emerald-400 border-emerald-700/80';
    }
  };

  const renderHazardTag = (hazard: HazardType) => {
    switch (hazard) {
      case 'thunderstorm':
        return (
          <span key={hazard} className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-mono">
            TS
          </span>
        );
      case 'hail':
        return (
          <span key={hazard} className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-mono">
            HAIL
          </span>
        );
      case 'cloudburst':
        return (
          <span key={hazard} className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-mono">
            CLOUDBURST
          </span>
        );
      case 'downburst':
        return (
          <span key={hazard} className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-mono">
            DOWNBURST
          </span>
        );
      case 'lightning':
        return (
          <span key={hazard} className="px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 text-[9px] font-mono">
            LTG
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800/90 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            ACTIVE CELLS ({systemMode === 'LIVE_DATA' ? `LIVE RADAR: ${stormCells.length}` : `SIMULATED: ${stormCells.length}`})
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          systemMode === 'LIVE_DATA'
            ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50'
            : 'text-cyan-400 bg-cyan-950 border-cyan-800/50'
        }`}>
          {systemMode === 'LIVE_DATA' ? 'LIVE DATA MODE' : 'KINEMATIC SIMULATOR'}
        </span>
      </div>

      {/* Cells List or Empty State */}
      {stormCells.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/40 my-2">
          <ShieldAlert className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
          <h4 className="text-xs font-mono font-bold text-slate-200 uppercase mb-1">
            {systemMode === 'LIVE_DATA' ? 'Operational DWR Feed: Auth Required' : 'No Convective Storm Cells Detected'}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed mb-3">
            {systemMode === 'LIVE_DATA'
              ? 'IMD MoES Doppler Weather Radar volume scans require authorized VPN gateway credentials. In LIVE DATA mode, simulated storm cells are strictly suppressed to guarantee zero fabricated data.'
              : 'The sector currently exhibits stable atmospheric conditions with no active cell reflectivity cores.'}
          </p>
          {systemMode === 'LIVE_DATA' && (
            <button
              onClick={() => setSystemMode('SIMULATION')}
              className="text-[10px] font-mono font-bold px-3 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 hover:bg-cyan-900 transition-colors"
            >
              Switch to Simulation Mode for Demo
            </button>
          )}
        </div>
      ) : (
      <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
        {stormCells.map((cell) => {
          const isSelected = selectedCell?.cell_id === cell.cell_id;

          return (
            <div
              key={cell.cell_id}
              onClick={() => setSelectedCell(cell)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Header row: ID, Name, Intensity */}
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{cell.cell_id}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase ${getSeverityBadge(
                        cell.intensity
                      )}`}
                    >
                      {cell.intensity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium truncate max-w-[190px]">
                    {cell.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-end space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{cell.eta_minutes}m ETA</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Conf: {cell.confidence}%
                  </div>
                </div>
              </div>

              {/* Physical Parameters Grid */}
              <div className="grid grid-cols-3 gap-1.5 py-2 my-1 border-y border-slate-800/80 text-[10px] font-mono text-slate-300">
                <div className="bg-slate-950/60 p-1 rounded border border-slate-800/50">
                  <div className="text-slate-500 text-[9px]">MAX REFLECTIVITY</div>
                  <div className="font-bold text-white text-xs">{cell.dbz_max} dBZ</div>
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-800/50">
                  <div className="text-slate-500 text-[9px]">VIL DENSITY</div>
                  <div className="font-bold text-white text-xs">{cell.vil_kgm2} kg/m²</div>
                </div>
                <div className="bg-slate-950/60 p-1 rounded border border-slate-800/50">
                  <div className="text-slate-500 text-[9px]">ECHO TOP</div>
                  <div className="font-bold text-white text-xs">{cell.echo_top_km} km</div>
                </div>
              </div>

              {/* Kinematics & Hazards */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                <div className="flex items-center space-x-1">
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  <span>
                    {cell.speed_kmh} km/h @ {cell.movement_deg}°
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {cell.hazards.map(h => renderHazardTag(h))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Selected Cell Detailed Quick Bar */}
      {selectedCell && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="text-cyan-400 font-bold">Selected Cell Analysis: {selectedCell.cell_id}</span>
            <span>CAPE: {selectedCell.cape_jkg} J/kg</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">Hail Prob: </span>
              <strong className="text-amber-400 font-bold">{selectedCell.hail_prob}%</strong>
            </div>
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">Cloudburst: </span>
              <strong className="text-red-400 font-bold">{selectedCell.cloudburst_risk}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

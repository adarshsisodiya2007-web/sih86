import React, { useState, useEffect } from 'react';
import { fetchHistoricalEvents } from '../services/api';
import { HistoricalEvent } from '../types';
import { useWeather } from '../context/WeatherContext';
import {
  History,
  Calendar,
  MapPin,
  Clock,
  CloudRain,
  Zap,
  ShieldAlert,
  ArrowRightLeft,
  ChevronRight,
  Flame,
  Activity
} from 'lucide-react';

export const HistoricalEvents: React.FC = () => {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const { selectedCell } = useWeather();

  useEffect(() => {
    fetchHistoricalEvents().then((evs) => {
      setEvents(evs);
      if (evs.length > 0) setSelectedEvent(evs[0]);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              HISTORICAL REFERENCE BENCHMARKS (DEMONSTRATION CASE STUDIES)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              REFERENCE ARCHIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Archived meteorological case studies compiled from published meteorological records for comparative analog demonstration.
          </p>
        </div>

        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-2 transition-colors ${
            showComparison
              ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{showComparison ? 'HIDE COMPARISON' : 'COMPARE WITH SIMULATED CELL'}</span>
        </button>
      </div>

      {/* Scientific Honesty Disclaimer Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-400 flex items-start space-x-2">
        <span className="text-amber-400 font-bold shrink-0">DEMO ARCHIVE NOTICE:</span>
        <span>
          These events represent reference meteorological benchmarks. They are included to illustrate synoptic analog patterns and do not imply that VARSHANET has generated validated operational retrospective hindcasts for these historical dates.
        </span>
      </div>

      {/* Main Grid: Left Event Selector, Right Detailed Synoptic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Events List */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
            ARCHIVED CASE STUDIES ({events.length})
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[640px] pr-1">
            {events.map((ev) => {
              const isSelected = selectedEvent?.event_id === ev.event_id;

              return (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">{ev.event_id}</span>
                    <span className="text-[10px] font-mono text-slate-400">{ev.date}</span>
                  </div>

                  <h4 className="text-xs font-mono font-bold text-white mb-1.5">{ev.name}</h4>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center space-x-1 truncate max-w-[170px]">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{ev.region}</span>
                    </span>
                    <span className="text-red-400 font-bold">{ev.max_rainfall_mm} mm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Synoptic & Comparison View */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEvent && (
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{selectedEvent.event_id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 uppercase">
                      {selectedEvent.damage_severity} EVENT
                    </span>
                  </div>
                  <h3 className="text-base font-mono font-bold text-white mt-1">{selectedEvent.name}</h3>
                </div>

                <div className="text-right font-mono text-xs text-slate-400">
                  <div className="text-white font-semibold flex items-center justify-end space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedEvent.date}</span>
                  </div>
                  <div className="text-[11px] mt-0.5">{selectedEvent.region}</div>
                </div>
              </div>

              {/* Observed Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">PEAK RAINFALL</div>
                  <div className="text-red-400 font-bold text-sm mt-0.5">{selectedEvent.max_rainfall_mm} mm</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">EVENT DURATION</div>
                  <div className="text-white font-bold text-sm mt-0.5">{selectedEvent.duration_hours} hours</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">PEAK LIGHTNING</div>
                  <div className="text-yellow-400 font-bold text-sm mt-0.5">{selectedEvent.peak_lightning_rate} strokes/min</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">OBSERVED HAZARDS</div>
                  <div className="text-cyan-300 font-bold text-[11px] mt-0.5 uppercase truncate">
                    {selectedEvent.observed_hazards.join(', ')}
                  </div>
                </div>
              </div>

              {/* Synoptic Summary */}
              <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 font-sans text-xs text-slate-300 space-y-1 leading-relaxed">
                <div className="font-mono text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  SYNOPTIC METEOROLOGICAL MECHANISM:
                </div>
                <p>{selectedEvent.synoptic_summary}</p>
              </div>

              {/* Key Meteorological Diagnostic Signatures */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                  KEY DIAGNOSTIC REMOTE-SENSING INDICATORS:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(selectedEvent.key_indicators).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">{k}</span>
                      <span className="text-white font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Cell Comparison Feature */}
              {showComparison && selectedCell && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-400 flex items-center space-x-1.5">
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>LIVE ANALOG COMPARISON: Current Cell ({selectedCell.cell_id}) vs. Historical Disaster</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/60 space-y-1">
                      <div className="text-cyan-400 font-bold uppercase">LIVE ACTIVE CELL: {selectedCell.cell_id}</div>
                      <div>Reflectivity: <strong className="text-white">{selectedCell.dbz_max} dBZ</strong></div>
                      <div>VIL Content: <strong className="text-white">{selectedCell.vil_kgm2} kg/m²</strong></div>
                      <div>Rain Rate: <strong className="text-emerald-400">{selectedCell.rain_rate_mmh} mm/h</strong></div>
                      <div>CAPE: <strong className="text-white">{selectedCell.cape_jkg} J/kg</strong></div>
                    </div>

                    <div className="bg-red-950/30 p-3 rounded-lg border border-red-800/60 space-y-1">
                      <div className="text-red-400 font-bold uppercase">HISTORIC BENCHMARK: {selectedEvent.event_id}</div>
                      <div>Max Rainfall: <strong className="text-white">{selectedEvent.max_rainfall_mm} mm</strong></div>
                      <div>Duration: <strong className="text-white">{selectedEvent.duration_hours}h</strong></div>
                      <div>Lightning Rate: <strong className="text-yellow-400">{selectedEvent.peak_lightning_rate} str/min</strong></div>
                      <div>Severity: <strong className="text-red-300 uppercase">{selectedEvent.damage_severity}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useWeather } from '../../context/WeatherContext';
import { TimelineHourForecast, SeverityLevel } from '../../types';
import {
  Clock,
  CloudRain,
  Zap,
  CloudLightning,
  AlertCircle,
  Wind,
  ShieldAlert,
  Flame
} from 'lucide-react';

export const NowcastTimeline: React.FC = () => {
  const { forecast, selectedForecastHour, setSelectedForecastHour } = useWeather();

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case 'severe':
        return 'bg-red-950/80 text-red-400 border-red-700/60';
      case 'high':
        return 'bg-orange-950/80 text-orange-400 border-orange-700/60';
      case 'elevated':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-700/60';
      case 'moderate':
        return 'bg-blue-950/80 text-blue-400 border-blue-700/60';
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
    }
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800/90 rounded-xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            0–6 HOUR CONVECTIVE NOWCAST TIMELINE (PROTOTYPE)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            KINEMATIC EXTRAPOLATION (SIMULATED)
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Selected Horizon: <strong className="text-cyan-300">
            {forecast[selectedForecastHour]?.label || 'NOW'} ({forecast[selectedForecastHour]?.timestamp || '--'})
          </strong>
        </div>
      </div>

      {/* Grid of Hourly Forecast Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-3">
        {forecast.map((item, idx) => {
          const isSelected = selectedForecastHour === idx;
          const isCurrent = idx === 0;

          return (
            <button
              key={item.label}
              onClick={() => setSelectedForecastHour(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Header: Label & Time */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <span
                  className={`text-xs font-mono font-bold ${
                    isCurrent ? 'text-cyan-400' : isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
              </div>

              {/* Composite Risk Score Badge */}
              <div className="mb-2">
                <div
                  className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold uppercase ${getSeverityBadge(
                    item.severity
                  )}`}
                >
                  {item.composite_risk}% • {item.severity}
                </div>
              </div>

              {/* Meteorological Indicators */}
              <div className="space-y-1 text-[11px] font-mono text-slate-300 w-full pt-1.5 border-t border-slate-800/70">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <CloudLightning className="w-3 h-3 text-cyan-400" />
                    <span>Thunder:</span>
                  </span>
                  <span className="font-semibold text-white">{item.thunderstorm_prob}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Hail (POSH):</span>
                  </span>
                  <span className="font-semibold text-amber-300">{item.hail_prob}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <CloudRain className="w-3 h-3 text-red-400" />
                    <span>Cloudburst:</span>
                  </span>
                  <span className="font-semibold text-red-300">{item.cloudburst_prob}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span>Lightning:</span>
                  </span>
                  <span className="font-semibold text-yellow-300">{item.lightning_density} /km²</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Wind className="w-3 h-3 text-blue-400" />
                    <span>Wind Gust:</span>
                  </span>
                  <span className="font-semibold text-cyan-200">{item.wind_risk_kmh} km/h</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <CloudRain className="w-3 h-3 text-emerald-400" />
                    <span>Rain Rate:</span>
                  </span>
                  <span className="font-semibold text-emerald-300">{item.rain_intensity_mmh} mm/h</span>
                </div>
              </div>

              {/* Active selection bar indicator */}
              {isSelected && (
                <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { GisWeatherMap } from '../components/maps/GisWeatherMap';
import {
  Radio,
  Sliders,
  Clock
} from 'lucide-react';
import { HazardType } from '../types';

export const LiveNowcast: React.FC = () => {
  const {
    selectedRegion,
    setSelectedRegion,
    regions,
    forecast,
    selectedForecastHour,
    setSelectedForecastHour,
    selectedCell
  } = useWeather();

  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [minDbzThreshold, setMinDbzThreshold] = useState<number>(40);

  const currentStep = forecast[selectedForecastHour] || forecast[0] || {
    label: 'NOW',
    timestamp: '12:00 UTC',
    composite_risk: 74,
    thunderstorm_prob: 82,
    hail_prob: 65,
    cloudburst_prob: 58,
    wind_risk_kmh: 78,
    rain_intensity_mmh: 68
  };

  const pipelineStages = [
    { title: 'CURRENT OBSERVATION', sub: 'Radar, Satellite, AWS', active: true },
    { title: 'DATA FUSION', sub: 'Spatial-Temporal Alignment', active: true },
    { title: 'CONVECTIVE DETECTION', sub: 'Cell Segmentation & VIL', active: true },
    { title: 'TEMPORAL ANALYSIS', sub: 'TITAN Kinematic Vectors', active: true },
    { title: '0–6 HOUR NOWCAST', sub: 'Hazard Probability Grid', active: true },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Pipeline Visualizer */}
      <div className="bg-[#0b1120] border border-slate-800/90 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h2 className="text-base font-mono font-bold uppercase tracking-wider text-white">
                CONVECTIVE NOWCAST ENGINE (PROTOTYPE)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                SIMULATION MODE • 0-6H
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-sensor kinematic extrapolation prototype modeling storm cell centroids and physics-based diagnostic indices.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Target Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Animated Pipeline Flow Indicators */}
        <div className="mt-4 pt-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
            CONVECTIVE INGESTION & FORECAST PIPELINE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
            {pipelineStages.map((stage, idx) => (
              <React.Fragment key={stage.title}>
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-800/40 flex flex-col justify-center text-center shadow-md relative overflow-hidden group">
                  <div className="text-[10px] font-mono font-bold text-cyan-300 truncate">
                    {stage.title}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                    {stage.sub}
                  </div>
                  <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nowcasting Interaction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Map with Interactive Horizon */}
        <div className="lg:col-span-2 space-y-4">
          <GisWeatherMap height="500px" showControls={true} />

          {/* Forecast Horizon Scrubber Slider */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white font-bold">FORECAST TIME HORIZON:</span>
                <span className="text-cyan-400 font-bold ml-1">{currentStep.label} ({currentStep.timestamp})</span>
              </span>
              <span className="text-slate-500 text-[11px]">Extrapolation: +{selectedForecastHour * 60} minutes</span>
            </div>

            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={selectedForecastHour}
              onChange={(e) => setSelectedForecastHour(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
              {['NOW', '+1H', '+2H', '+3H', '+4H', '+5H', '+6H'].map((lbl, i) => (
                <button
                  key={lbl}
                  onClick={() => setSelectedForecastHour(i)}
                  className={`cursor-pointer ${selectedForecastHour === i ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Operational Controls & Diagnostic Confidence */}
        <div className="space-y-4">
          {/* Controls Panel */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-xs font-mono font-bold text-slate-200">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>FORECAST PARAMETERS</span>
            </div>

            {/* Hazard Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Focus Hazard Filter:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {[
                  { id: 'all', label: 'All Hazards' },
                  { id: 'thunderstorm', label: 'Thunderstorm' },
                  { id: 'hail', label: 'Hail (POSH)' },
                  { id: 'cloudburst', label: 'Cloudburst' },
                  { id: 'downburst', label: 'Downburst' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHazard(item.id)}
                    className={`px-2.5 py-1.5 rounded border text-left truncate transition-colors ${
                      selectedHazard === item.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold Filter Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Min Reflectivity Filter:</span>
                <span className="text-cyan-400 font-bold">{minDbzThreshold} dBZ</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={5}
                value={minDbzThreshold}
                onChange={(e) => setMinDbzThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>20 dBZ (Light)</span>
                <span>40 dBZ (Heavy)</span>
                <span>60 dBZ (Severe)</span>
              </div>
            </div>
          </div>

          {/* Forecast Confidence Breakdown (Prototype Metrics) */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-200">PROTOTYPE CONFIDENCE</span>
              <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                88% DERIVED CONFIDENCE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Confidence score is a prototype heuristic derived from simulated sensor coherence (Doppler reflectivity &amp; 
              lightning rate), with simulated decay from ~92% in 0–2h window to 75% at +6h.
            </p>

            <div className="space-y-2 text-xs font-mono text-slate-300 pt-1">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Simulated Radar Latency:</span>
                <span className="text-white font-semibold">18s (demo stream)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target Spatial Resolution:</span>
                <span className="text-cyan-400 font-semibold">1–3 km grid</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Cell Tracking Method:</span>
                <span className="text-white font-semibold">TITAN-style Kinematic Solver</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Simulated Cooling Indicator:</span>
                <span className="text-emerald-400 font-semibold">-5.2 °C/15m (simulated)</span>
              </div>
            </div>
          </div>

          {/* Selected Hour Instantaneous Metrics */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-2.5">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
              {currentStep.label} RISK METRIC BREAKDOWN
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">HAIL (POSH)</div>
                <div className="text-amber-400 font-bold text-sm">{currentStep.hail_prob}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">CLOUDBURST (CPI)</div>
                <div className="text-red-400 font-bold text-sm">{currentStep.cloudburst_prob}%</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">DOWNBURST GUST</div>
                <div className="text-cyan-400 font-bold text-sm">{currentStep.wind_risk_kmh} km/h</div>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">RAIN INTENSITY</div>
                <div className="text-emerald-400 font-bold text-sm">{currentStep.rain_intensity_mmh} mm/h</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { GisWeatherMap } from '../components/maps/GisWeatherMap';
import { useWeather } from '../context/WeatherContext';
import {
  Compass,
  MapPin,
  Layers,
  Flame,
  CloudRain,
  Zap,
  Wind,
  Navigation,
  Crosshair,
  Maximize2
} from 'lucide-react';

export const WeatherMap: React.FC = () => {
  const { selectedCell, stormCells, setSelectedCell, selectedRegion } = useWeather();

  return (
    <div className="space-y-4">
      {/* Top GIS Toolbar */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              GIS CONVECTIVE WORKSTATION (SIMULATION PROTOTYPE)
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Projection: WGS84 / EPSG:4326 • Target Spatial Resolution: 1–3 km • Sector: {selectedRegion} • SIMULATION MODE
            </p>
          </div>
        </div>

        {/* Cell Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label htmlFor="cell-select" className="text-xs font-mono text-slate-400">Inspect Cell:</label>
          <select
            id="cell-select"
            value={selectedCell?.cell_id || ''}
            onChange={(e) => {
              const match = stormCells.find(c => c.cell_id === e.target.value);
              if (match) setSelectedCell(match);
            }}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            {stormCells.map(c => (
              <option key={c.cell_id} value={c.cell_id}>
                {c.cell_id} - {c.name} ({c.intensity.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Map + Detailed Inspector Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Full Interactive Map (3 Columns on Large Screens) */}
        <div className="xl:col-span-3">
          <GisWeatherMap height="620px" showControls={true} />
        </div>

        {/* Right Inspector Drawer (1 Column) */}
        <div className="space-y-4">
          {selectedCell ? (
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-sm font-bold text-cyan-400">{selectedCell.cell_id}</div>
                  <div className="text-[11px] text-slate-300 font-sans">{selectedCell.name}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedCell.intensity === 'severe'
                      ? 'bg-red-950 text-red-400 border border-red-700'
                      : 'bg-orange-950 text-orange-400 border border-orange-700'
                  }`}
                >
                  {selectedCell.intensity}
                </span>
              </div>

              {/* Geographic Position */}
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  CENTROID COORDINATES
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Latitude: <strong className="text-white">{selectedCell.latitude}° N</strong></span>
                  <span>Longitude: <strong className="text-white">{selectedCell.longitude}° E</strong></span>
                </div>
              </div>

              {/* Radar Reflectivity Core */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  DOPPLER RADAR DIAGNOSTICS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">MAX REFLECTIVITY</div>
                    <div className="text-white font-bold text-sm">{selectedCell.dbz_max} dBZ</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">VIL CONTENT</div>
                    <div className="text-cyan-300 font-bold text-sm">{selectedCell.vil_kgm2} kg/m²</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">ECHO TOP HEIGHT</div>
                    <div className="text-white font-bold text-sm">{selectedCell.echo_top_km} km</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">INSTANT RAIN RATE</div>
                    <div className="text-emerald-400 font-bold text-sm">{selectedCell.rain_rate_mmh} mm/h</div>
                  </div>
                </div>
              </div>

              {/* Kinematics */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  KINEMATICS & MOTION VECTORS
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Translation Speed:</span>
                    <span className="text-white font-bold">{selectedCell.speed_kmh} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Motion Bearing:</span>
                    <span className="text-cyan-400 font-bold">{selectedCell.movement_deg}° (ENE)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Impact Arrival (ETA):</span>
                    <span className="text-amber-400 font-bold">{selectedCell.eta_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Forecast Confidence:</span>
                    <span className="text-emerald-400 font-bold">{selectedCell.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Convective Hazard Projections */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  DERIVED HAZARD PROTOTYPE INDICES
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Severe Hail Prob (Derived POSH):</span>
                    </span>
                    <span className="font-bold text-amber-400">{selectedCell.hail_prob}%</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-red-400" />
                      <span>Cloudburst Potential (Derived CPI):</span>
                    </span>
                    <span className="font-bold text-red-400">{selectedCell.cloudburst_risk}%</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-300 flex items-center space-x-1.5">
                      <Wind className="w-3.5 h-3.5 text-blue-400" />
                      <span>Peak Downburst Gust (Derived):</span>
                    </span>
                    <span className="font-bold text-cyan-400">{selectedCell.wind_gust_kmh} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
              Select a storm cell from the map or dropdown to inspect its physical radar and kinematic attributes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

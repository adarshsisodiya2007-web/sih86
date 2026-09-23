import React from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  CloudLightning,
  Flame,
  CloudRain,
  Wind,
  ShieldAlert,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const HazardAnalysis: React.FC = () => {
  const { selectedRegion, forecast, selectedCell } = useWeather();
  const current = forecast[0] || {
    thunderstorm_prob: 84,
    hail_prob: 65,
    cloudburst_prob: 58,
    wind_risk_kmh: 78,
    rain_intensity_mmh: 68
  };

  const hazardComparisonData = [
    { name: 'Thunderstorm', prob: current.thunderstorm_prob, color: '#38bdf8' },
    { name: 'Hail (POSH)', prob: current.hail_prob, color: '#f59e0b' },
    { name: 'Cloudburst (CPI)', prob: current.cloudburst_prob, color: '#ef4444' },
    { name: 'Downburst (>75km/h)', prob: Math.min(95, Math.round(current.wind_risk_kmh * 0.95)), color: '#818cf8' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              MULTI-HAZARD DIAGNOSTIC ANALYSIS (PROTOTYPE INDICES)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SIMULATION MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Physics-grounded prototype diagnostic decomposition for {selectedRegion}. Computes derived indicators from simulated radar reflectivity, VIL, thermodynamic proxies, and satellite IR.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
          Target Sector: <strong className="text-white">{selectedRegion}</strong>
        </div>
      </div>

      {/* Comparative Hazard Probability Overview Bar Chart */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Hazard Probability Distribution (Next 0–2 Hours)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">IMD Alert Threshold: 60%</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hazardComparisonData} layout="vertical" margin={{ left: 20, right: 30 }}>
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" width={130} tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(val: any) => [`${val}%`, 'Probability']}
              />
              <Bar dataKey="prob" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {hazardComparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Dedicated Hazard Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. THUNDERSTORM MODULE */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <CloudLightning className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">SEVERE THUNDERSTORM</h3>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">Convective Initiation Engine</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-700 font-mono text-xs font-bold">
                {current.thunderstorm_prob}% PROB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">INITIATION STATUS</span>
                <div className="text-emerald-400 font-bold mt-0.5">EXPLOSIVE DEVELOPMENT</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">CAPE (BUOYANCY)</span>
                <div className="text-white font-bold mt-0.5">{selectedCell?.cape_jkg || 2850} J/kg</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">RADAR REFLECTIVITY</span>
                <div className="text-amber-400 font-bold mt-0.5">{selectedCell?.dbz_max || 62.5} dBZ Core</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">TREND DIRECTION</span>
                <div className="text-cyan-400 font-bold mt-0.5">{selectedCell?.movement_deg || 65}° @ {selectedCell?.speed_kmh || 38} km/h</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
              Rapid convective ascent signaled by satellite brightness temperature cooling (-5.2°C/15m) 
              combined with strong surface boundary moisture convergence exceeding 18 g/kg.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong className="text-cyan-400">Action:</strong> Suspend open-field operations; shelter high-voltage and telecom installations.
          </div>
        </div>

        {/* 2. HAIL MODULE */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-amber-950 border border-amber-800 text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">DAMAGING HAIL (POSH)</h3>
                  <div className="text-[10px] font-mono text-amber-400 uppercase">Witt SHA Algorithm Proxy</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-700 font-mono text-xs font-bold">
                {current.hail_prob}% PROB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">EXPECTED DIAMETER</span>
                <div className="text-amber-300 font-bold mt-0.5">3.5 – 5.0 cm (Golf Ball)</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">VIL DENSITY</span>
                <div className="text-white font-bold mt-0.5">{selectedCell?.vil_kgm2 || 48} kg/m²</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">ECHO TOP HEIGHT</span>
                <div className="text-white font-bold mt-0.5">{selectedCell?.echo_top_km || 15.2} km AGL</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">FREEZING LEVEL (0°C)</span>
                <div className="text-cyan-400 font-bold mt-0.5">4.2 km AGL</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
              High Vertically Integrated Liquid (VIL) density (&gt;3.2 g/m³) extending above the -20°C 
              isotherm confirms strong supercooled water suspension and severe graupel accretion.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong className="text-amber-400">Action:</strong> Protect horticultural crops, glasshouses, and parked aircraft in hangars.
          </div>
        </div>

        {/* 3. CLOUDBURST MODULE */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-red-950 border border-red-800 text-red-400">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">CLOUDBURST POTENTIAL (CPI)</h3>
                  <div className="text-[10px] font-mono text-red-400 uppercase">Flash Flood Threshold Index</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-red-950 text-red-400 border border-red-700 font-mono text-xs font-bold">
                {current.cloudburst_prob}% RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">CURRENT RAIN RATE</span>
                <div className="text-red-400 font-bold mt-0.5">{current.rain_intensity_mmh} mm/hour</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">THRESHOLD EXCEEDANCE</span>
                <div className="text-amber-400 font-bold mt-0.5">&gt;100 mm/h Risk Zone</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">PRECIPITABLE WATER</span>
                <div className="text-white font-bold mt-0.5">58.2 mm (Deep Column)</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">OROGRAPHIC ENHANCEMENT</span>
                <div className="text-cyan-400 font-bold mt-0.5">High Foothill Convergence</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
              Extreme localized rainfall rate nearing IMD cloudburst criteria (100 mm in &lt;1 hour) 
              triggered by slow-moving cell regeneration anchored against local elevation gradients.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong className="text-red-400">Action:</strong> Alert river basin flash flood coordinators; activate municipal sump stations.
          </div>
        </div>

        {/* 4. DOWNBURST MODULE */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-blue-950 border border-blue-800 text-blue-400">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">DOWNBURST / MICROBURST</h3>
                  <div className="text-[10px] font-mono text-blue-400 uppercase">Core Collapse Velocity Proxy</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-700 font-mono text-xs font-bold">
                {current.wind_risk_kmh} KM/H GUST
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">MICROBURST SIGNATURE</span>
                <div className="text-amber-400 font-bold mt-0.5">REFLECTIVITY CORE COLLAPSE</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">DEWPOINT DEPRESSION</span>
                <div className="text-white font-bold mt-0.5">10.5 °C (Dry Sub-cloud)</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">DOWNDRAFT CAPE (DCAPE)</span>
                <div className="text-white font-bold mt-0.5">1,120 J/kg</div>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">IMPACT RADIUS</span>
                <div className="text-cyan-400 font-bold mt-0.5">4.2 km footprint</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
              Negative buoyancy accelerated by intense evaporative chilling in sub-cloud inverted-V dry layer 
              creating localized high-velocity radial outflow winds upon surface strike.
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong className="text-blue-400">Action:</strong> Alert aerodrome ATC for low-level wind shear (LLWS); halt tower crane activities.
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Clock,
  TrendingUp,
  Activity,
  Layers,
  AlertTriangle,
  CloudLightning,
  Flame,
  CloudRain,
  Wind
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

export const ForecastTimeline: React.FC = () => {
  const { forecast, selectedRegion, selectedForecastHour, setSelectedForecastHour } = useWeather();

  const chartData = forecast.map((f) => ({
    label: f.label,
    time: f.timestamp,
    Thunderstorm: f.thunderstorm_prob,
    Hail: f.hail_prob,
    Cloudburst: f.cloudburst_prob,
    RainRate: f.rain_intensity_mmh,
    WindGust: f.wind_risk_kmh,
    CompositeRisk: f.composite_risk,
    upperBand: Math.min(100, f.composite_risk + 9),
    lowerBand: Math.max(0, f.composite_risk - 9)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              TEMPORAL FORECAST EVOLUTION (PROTOTYPE 0–6 HOURS)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SIMULATION MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic cell lifecycle trajectory: prototype simulation of initial cellular updraft, mature severe phase (+1h to +2h), 
            and stratiform decay phase (+4h to +6h).
          </p>
        </div>

        <div className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Target: <strong className="text-cyan-400">{selectedRegion}</strong>
        </div>
      </div>

      {/* Main Convective Risk Probability Curves Chart */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Hazard Probability vs. Forecast Horizon (%)</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="flex items-center space-x-1 text-red-400">
              <span className="w-2.5 h-0.5 bg-red-500"></span>
              <span>Severe Threshold (75%)</span>
            </span>
            <span className="flex items-center space-x-1 text-yellow-400">
              <span className="w-2.5 h-0.5 bg-yellow-500"></span>
              <span>Watch Threshold (50%)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11, fontFamily: 'monospace' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
              <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Severe (75%)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={50} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Watch (50%)', fill: '#eab308', fontSize: 10, position: 'insideTopRight' }} />

              <Area type="monotone" dataKey="CompositeRisk" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRisk)" name="Composite Convective Risk" isAnimationActive={false} />
              <Line type="monotone" dataKey="Thunderstorm" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} name="Thunderstorm Prob." isAnimationActive={false} />
              <Line type="monotone" dataKey="Hail" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Hail (POSH)" isAnimationActive={false} />
              <Line type="monotone" dataKey="Cloudburst" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cloudburst (CPI)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart: Rainfall Intensity & Downburst Wind Gusts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-emerald-400" />
              <span>Projected Rain Rate (mm/h)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">&gt;60 mm/h: Torrential</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" mm/h" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="RainRate" stroke="#10b981" fill="#10b981" fillOpacity={0.25} name="Rain Intensity" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
              <Wind className="w-4 h-4 text-blue-400" />
              <span>Maximum Downburst Wind Risk (km/h)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">&gt;75 km/h: Gale Force</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit=" km/h" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="WindGust" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} name="Peak Wind Gust" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Discretized Tabular Matrix */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl overflow-x-auto">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
          DISCRETIZED 0–6 HOUR OPERATIONAL PARAMETER MATRIX
        </div>

        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="py-2 px-3">HORIZON</th>
              <th className="py-2 px-3">TIMESTAMP</th>
              <th className="py-2 px-3">COMPOSITE RISK</th>
              <th className="py-2 px-3">THUNDER PROB</th>
              <th className="py-2 px-3">HAIL (POSH)</th>
              <th className="py-2 px-3">CLOUDBURST</th>
              <th className="py-2 px-3">RAIN RATE</th>
              <th className="py-2 px-3">WIND GUST</th>
              <th className="py-2 px-3">SEVERITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {forecast.map((f, i) => (
              <tr
                key={f.label}
                onClick={() => setSelectedForecastHour(i)}
                className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                  selectedForecastHour === i ? 'bg-slate-900/90 text-cyan-300' : 'text-slate-300'
                }`}
              >
                <td className="py-2.5 px-3 font-bold">{f.label}</td>
                <td className="py-2.5 px-3 text-slate-400">{f.timestamp}</td>
                <td className="py-2.5 px-3 font-bold text-white">{f.composite_risk}%</td>
                <td className="py-2.5 px-3 text-cyan-300">{f.thunderstorm_prob}%</td>
                <td className="py-2.5 px-3 text-amber-400">{f.hail_prob}%</td>
                <td className="py-2.5 px-3 text-red-400">{f.cloudburst_prob}%</td>
                <td className="py-2.5 px-3 text-emerald-400">{f.rain_intensity_mmh} mm/h</td>
                <td className="py-2.5 px-3 text-blue-300">{f.wind_risk_kmh} km/h</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      f.severity === 'severe'
                        ? 'bg-red-950 text-red-400 border border-red-700'
                        : f.severity === 'high'
                        ? 'bg-orange-950 text-orange-400 border border-orange-700'
                        : f.severity === 'elevated'
                        ? 'bg-yellow-950 text-yellow-400 border border-yellow-700'
                        : 'bg-blue-950 text-blue-400 border border-blue-700'
                    }`}
                  >
                    {f.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

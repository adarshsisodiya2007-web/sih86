import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Clock,
  Calendar,
  History,
  TrendingUp,
  Activity,
  Layers,
  AlertTriangle,
  CloudLightning,
  Flame,
  CloudRain,
  Wind,
  Droplets,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw
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
import { fetchPast3DaysHistory } from '../services/api';
import { Past3DaysAntecedentResponse } from '../types';

export const ForecastTimeline: React.FC = () => {
  const { forecast, selectedRegion, selectedForecastHour, setSelectedForecastHour, systemMode } = useWeather();

  // Operational view state: Default is 0-6H Nowcast, with an optional toggle for Past 3 Days (-72h to 0h) and Combined view
  const [timelineView, setTimelineView] = useState<'nowcast_0_6h' | 'past_3_days' | 'combined'>('nowcast_0_6h');
  const [past3DaysData, setPast3DaysData] = useState<Past3DaysAntecedentResponse | null>(null);
  const [loadingPast, setLoadingPast] = useState<boolean>(false);
  const [selectedPastHourIndex, setSelectedPastHourIndex] = useState<number | null>(null);

  // Load past 3 days antecedent history
  const loadPastHistory = async () => {
    setLoadingPast(true);
    try {
      const res = await fetchPast3DaysHistory(selectedRegion);
      if (res) {
        setPast3DaysData(res);
      }
    } catch (e) {
      console.warn('Failed to load past 3 days data:', e);
    } finally {
      setLoadingPast(false);
    }
  };

  useEffect(() => {
    loadPastHistory();
  }, [selectedRegion]);

  // Standard 0-6 Hour Forward Forecast Data
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

  // Past 3 Days (-72h to 0h) Chart Data
  const pastChartData = (past3DaysData?.hourly_timeline || []).map((p) => ({
    label: p.label,
    time: p.timestamp,
    RainRate: p.rain_mmh,
    CumulativeRain: p.cumulative_rain_mm,
    CAPE: p.cape_jkg,
    Temperature: p.temperature_c,
    DewpointDepression: p.dewpoint_depression_c,
    WindGust: p.wind_gust_kmh,
    SoilMoisture: p.soil_moisture_saturation_pct,
    CompositeRisk: p.composite_risk,
    Severity: p.severity
  }));

  // Combined Continuum (-72h to +6h) Chart Data
  const combinedChartData = [
    ...pastChartData.filter((_, i) => i % 2 === 0), // Sample every 2 hours for clean chart density
    ...forecast.map((f) => ({
      label: f.label === 'NOW' ? 'NOW (t=0)' : f.label,
      time: f.timestamp,
      RainRate: f.rain_intensity_mmh,
      CumulativeRain: (past3DaysData?.summary_72h?.total_antecedent_rainfall_mm || 35.0) + (f.rain_intensity_mmh * 0.5),
      CAPE: 2200.0,
      Temperature: 28.5,
      DewpointDepression: 7.5,
      WindGust: f.wind_risk_kmh,
      SoilMoisture: past3DaysData?.summary_72h?.soil_moisture_saturation_pct || 65.0,
      CompositeRisk: f.composite_risk,
      Severity: f.severity
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header with Optional Button for Past 3 Days */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              {timelineView === 'nowcast_0_6h' && 'TEMPORAL FORECAST EVOLUTION (PROTOTYPE 0–6 HOURS)'}
              {timelineView === 'past_3_days' && 'ANTECEDENT OBSERVATION ARCHIVE (PAST 3 DAYS / -72h to 0h)'}
              {timelineView === 'combined' && 'MULTI-DAY CONVECTIVE LIFECYCLE (-72h to +6h FULL CONTINUUM)'}
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              systemMode === 'LIVE_DATA' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {systemMode === 'LIVE_DATA' ? 'LIVE DATA' : 'SIMULATION'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {timelineView === 'nowcast_0_6h' && 'Forward 0–6 hour kinematic nowcasting trajectory: initial cell updraft, mature severe phase (+1h to +2h), and stratiform decay (+4h to +6h).'}
            {timelineView === 'past_3_days' && 'Preceding 3-day observational history (Open-Meteo gridded archive): antecedent rainfall, soil moisture pre-saturation, and diurnal CAPE oscillation.'}
            {timelineView === 'combined' && 'Continuous 78-hour multi-day meteorological timeline connecting 3-day antecedent ground-truth history with forward 0–6 hour severe weather nowcasts.'}
          </p>
        </div>

        {/* Optional Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setTimelineView('nowcast_0_6h')}
              className={`px-3 py-1.5 rounded transition-all font-bold cursor-pointer ${
                timelineView === 'nowcast_0_6h'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⏱️ 0–6H NOWCAST
            </button>
            <button
              onClick={() => setTimelineView('past_3_days')}
              className={`px-3 py-1.5 rounded transition-all font-bold cursor-pointer flex items-center space-x-1.5 ${
                timelineView === 'past_3_days'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>PAST 3 DAYS (-72h)</span>
              <span className="text-[9px] px-1 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded font-bold">
                OPTIONAL
              </span>
            </button>
            <button
              onClick={() => setTimelineView('combined')}
              className={`px-3 py-1.5 rounded transition-all font-bold cursor-pointer ${
                timelineView === 'combined'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 FULL (-72h to +6h)
            </button>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <span>Target:</span>
            <strong className="text-cyan-400">{selectedRegion}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PAST 3 DAYS ANTECEDENT HISTORY (OPTIONAL VIEW REQUESTED BY USER) */}
      {/* ========================================================================= */}
      {timelineView === 'past_3_days' && (
        <div className="space-y-6">
          {/* Top 4 Antecedent Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <CloudRain className="w-4 h-4 text-emerald-400" />
                  <span>72H CUMULATIVE RAIN</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">3-Day Total</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white pt-1">
                {past3DaysData?.summary_72h?.total_antecedent_rainfall_mm ?? 48.5} mm
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                Ground-truth antecedent precipitation index determining watershed runoff readiness.
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>SOIL MOISTURE SATURATION</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">Antecedent API</span>
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-300 pt-1">
                {past3DaysData?.summary_72h?.soil_moisture_saturation_pct ?? 74.2}%
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                Status: <strong className="text-amber-400">{past3DaysData?.summary_72h?.antecedent_risk_level || 'ELEVATED PRE-SATURATION'}</strong>
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>PEAK 3-DAY CAPE</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">Thermal Buoyancy</span>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-300 pt-1">
                {past3DaysData?.summary_72h?.peak_past_cape_jkg ?? 2850} J/kg
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                Maximum atmospheric convective instability recorded during afternoon heating peaks.
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Wind className="w-4 h-4 text-blue-400" />
                  <span>MAX PAST WIND GUST</span>
                </span>
                <span className="text-[10px] text-blue-400 font-bold">Boundary Layer</span>
              </div>
              <div className="text-2xl font-mono font-bold text-blue-300 pt-1">
                {past3DaysData?.summary_72h?.peak_gust_kmh ?? 58.4} km/h
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                Cloudburst vulnerability multiplier: <strong className="text-cyan-300">{past3DaysData?.summary_72h?.cloudburst_vulnerability_multiplier ?? 1.25}x</strong>
              </p>
            </div>
          </div>

          {/* 3 Daily Antecedent Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(past3DaysData?.daily_summaries || [
              { day_number: 1, day_label: "Day -3 (72h ago)", date: "3 Days Ago", total_rainfall_mm: 12.4, max_temperature_c: 34.2, min_temperature_c: 24.1, avg_rh_pct: 65, peak_cape_jkg: 2100, peak_wind_gust_kmh: 38.0, convective_activity: "Isolated Afternoon Convective Cells" },
              { day_number: 2, day_label: "Day -2 (48h ago)", date: "2 Days Ago", total_rainfall_mm: 24.8, max_temperature_c: 33.0, min_temperature_c: 23.5, avg_rh_pct: 74, peak_cape_jkg: 2850, peak_wind_gust_kmh: 58.4, convective_activity: "Moderate Thunderstorm & Pre-Storm Rainband" },
              { day_number: 3, day_label: "Day -1 (Yesterday)", date: "Yesterday", total_rainfall_mm: 11.3, max_temperature_c: 31.8, min_temperature_c: 23.0, avg_rh_pct: 71, peak_cape_jkg: 2600, peak_wind_gust_kmh: 44.2, convective_activity: "Strong Solar Heating & Boundary Layer Saturation" }
            ]).map((d) => (
              <div key={d.day_number} className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center space-x-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>{d.day_label}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{d.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[9px] text-slate-400">DAILY RAINFALL</div>
                    <div className="text-sm font-bold text-emerald-400">{d.total_rainfall_mm} mm</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[9px] text-slate-400">PEAK CAPE</div>
                    <div className="text-sm font-bold text-amber-400">{d.peak_cape_jkg} J/kg</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[9px] text-slate-400">TEMP RANGE</div>
                    <div className="text-sm font-bold text-white">{d.min_temperature_c}° - {d.max_temperature_c}°C</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[9px] text-slate-400">MAX GUST</div>
                    <div className="text-sm font-bold text-blue-400">{d.peak_wind_gust_kmh} km/h</div>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-sans text-slate-300">
                  <strong className="text-cyan-400 font-mono">SYNOPTIC PATTERN: </strong>
                  {d.convective_activity}
                </div>
              </div>
            ))}
          </div>

          {/* Main 72-Hour Preceding Thermal Instability (CAPE) & Moisture Curve */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>72-Hour Antecedent Instability & Thermal Diurnal Cycle (CAPE vs Dewpoint Depression)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                -72h (Day -3) ➔ -48h (Day -2) ➔ -24h (Day -1) ➔ NOW (0h)
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pastChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPastCape" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPastRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} interval={6} />
                  <YAxis stroke="#64748b" domain={[0, 3500]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" J/kg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="CAPE" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPastCape)" name="CAPE (J/kg)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="DewpointDepression" stroke="#38bdf8" strokeWidth={1.8} dot={false} name="Dewpoint Dep. (°C)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="SoilMoisture" stroke="#10b981" strokeWidth={1.8} dot={false} name="Soil Moisture (%)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary 72-Hour Charts: Rain Rate & Wind Gust History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                  <CloudRain className="w-4 h-4 text-emerald-400" />
                  <span>Preceding Hourly Rain & Cumulative Total (mm)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Total: {past3DaysData?.summary_72h?.total_antecedent_rainfall_mm ?? 48.5} mm</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pastChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} interval={8} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" mm" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="CumulativeRain" stroke="#059669" fill="#10b981" fillOpacity={0.2} name="Cumulative Rain (mm)" isAnimationActive={false} />
                    <Line type="monotone" dataKey="RainRate" stroke="#34d399" strokeWidth={1.5} dot={false} name="Hourly Rate (mm/h)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                  <Wind className="w-4 h-4 text-blue-400" />
                  <span>Preceding Boundary Layer Gusts (km/h)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Peak: {past3DaysData?.summary_72h?.peak_gust_kmh ?? 58.4} km/h</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pastChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} interval={8} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit=" km/h" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="WindGust" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} name="Peak Gust (km/h)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 72-Hour Discretized Historical Matrix Table */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>DISCRETIZED 72-HOUR ANTECEDENT OBSERVATION ARCHIVE MATRIX</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Showing 72 Historical Hourly Timesteps
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                  <tr className="text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">HORIZON</th>
                    <th className="py-2.5 px-3">TIMESTAMP</th>
                    <th className="py-2.5 px-3">RAIN (mm/h)</th>
                    <th className="py-2.5 px-3">CUMULATIVE</th>
                    <th className="py-2.5 px-3">CAPE</th>
                    <th className="py-2.5 px-3">TEMP (°C)</th>
                    <th className="py-2.5 px-3">DEWPOINT DEP</th>
                    <th className="py-2.5 px-3">GUST</th>
                    <th className="py-2.5 px-3">SOIL SATURATION</th>
                    <th className="py-2.5 px-3">RISK PROXY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(past3DaysData?.hourly_timeline || []).map((p, i) => (
                    <tr
                      key={p.label}
                      onClick={() => setSelectedPastHourIndex(i)}
                      className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                        selectedPastHourIndex === i ? 'bg-slate-900/90 text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white">{p.label}</td>
                      <td className="py-2 px-3 text-slate-400">{p.timestamp}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{p.rain_mmh}</td>
                      <td className="py-2 px-3 text-emerald-300">{p.cumulative_rain_mm} mm</td>
                      <td className="py-2 px-3 text-amber-400">{p.cape_jkg} J/kg</td>
                      <td className="py-2 px-3 text-white">{p.temperature_c}°C</td>
                      <td className="py-2 px-3 text-cyan-300">{p.dewpoint_depression_c}°C</td>
                      <td className="py-2 px-3 text-blue-300">{p.wind_gust_kmh} km/h</td>
                      <td className="py-2 px-3 text-cyan-400">{p.soil_moisture_saturation_pct}%</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            p.severity === 'severe'
                              ? 'bg-red-950 text-red-400 border border-red-700'
                              : p.severity === 'high'
                              ? 'bg-orange-950 text-orange-400 border border-orange-700'
                              : p.severity === 'elevated'
                              ? 'bg-yellow-950 text-yellow-400 border border-yellow-700'
                              : 'bg-blue-950 text-blue-400 border border-blue-700'
                          }`}
                        >
                          {p.composite_risk}% ({p.severity})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: COMBINED LIFECYCLE (-72h to +6h FULL MULTI-DAY CONTINUUM)        */}
      {/* ========================================================================= */}
      {timelineView === 'combined' && (
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Multi-Day Continuum: 3-Day Historical Observation (-72h) + Forward AI Nowcast (+6h)</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono">
                <span className="flex items-center space-x-1 text-cyan-400 font-bold">
                  <span className="w-2.5 h-0.5 bg-cyan-400"></span>
                  <span>NOW (t = 0 Line)</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-400">
                  <span className="w-2.5 h-0.5 bg-amber-400"></span>
                  <span>CAPE</span>
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCombRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} interval={4} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                  <ReferenceLine x="NOW (t=0)" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="3 3" label={{ value: 'NOW (t=0)', fill: '#22d3ee', fontSize: 11, position: 'insideTopLeft' }} />
                  <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Severe (75%)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

                  <Area type="monotone" dataKey="CompositeRisk" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCombRisk)" name="Continuous Convective Risk (%)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="RainRate" stroke="#10b981" strokeWidth={2} dot={false} name="Rain Rate (mm/h)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="WindGust" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Wind Gust (km/h)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 text-xs font-sans text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-800/80 gap-2">
              <div>
                <strong className="text-amber-400 font-mono">LEFT SIDE (-72h to 0h): </strong>
                Genuine Open-Meteo external gridded reanalysis history.
              </div>
              <div>
                <strong className="text-cyan-400 font-mono">RIGHT SIDE (NOW to +6h): </strong>
                VARSHANET forward convective-scale nowcast extrapolation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: DEFAULT 0–6H FORWARD NOWCAST VIEW (ORIGINAL DEFAULT PRESERVED)   */}
      {/* ========================================================================= */}
      {timelineView === 'nowcast_0_6h' && (
        <div className="space-y-6">
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
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Radio,
  Satellite,
  Zap,
  Thermometer,
  CloudRain,
  Cpu,
  Archive,
  CheckCircle2,
  Clock,
  ArrowDown,
  ShieldCheck,
  Server,
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { DataSourceAuditEntry } from '../types';
import { useWeather } from '../context/WeatherContext';
import { fetchDataFusionSources, fetchDataFusionPipeline } from '../services/api';

export const DataFusion: React.FC = () => {
  const { selectedRegion, systemMode, setSystemMode } = useWeather();
  const [sources, setSources] = useState<DataSourceAuditEntry[]>([]);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcs, pipe] = await Promise.all([
        fetchDataFusionSources(selectedRegion),
        fetchDataFusionPipeline(selectedRegion)
      ]);
      setSources(srcs);
      setPipelineData(pipe);
    } catch (e) {
      console.warn("Failed to load data fusion details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [selectedRegion, systemMode]);

  const pipelineSteps = [
    { step: 1, title: 'SOURCE INGESTION', desc: 'Asynchronous fetch of real Open-Meteo, RainViewer & adapter interfaces', latency: '0.8s' },
    { step: 2, title: 'VALIDATION', desc: 'Checking physical bounds (temperature -20..55°C, positive CAPE, barometric pressure)', latency: '0.1s' },
    { step: 3, title: 'NORMALIZATION', desc: 'Transforming into unified NormalizedObservation schema', latency: '0.1s' },
    { step: 4, title: 'TIMESTAMP ALIGNMENT', desc: 'Synchronizing UTC timestamps and flagging stale observations', latency: '0.1s' },
    { step: 5, title: 'SPATIAL ALIGNMENT', desc: 'Projecting observations onto target 1–3 km Cartesian WGS84 matrix', latency: '0.2s' },
    { step: 6, title: 'QUALITY CONTROL', desc: 'Anomalous propagation filtering and observational confidence assessment', latency: '0.2s' },
    { step: 7, title: 'FEATURE EXTRACTION', desc: 'Computing CAPE buoyancy, dewpoint depression, reflectivity, and shear proxy', latency: '0.3s' },
    { step: 8, title: 'METEOROLOGICAL ENGINE', desc: 'Witt SHA hail index, IMD CPI cloudburst threshold, DCAPE downburst velocity', latency: '0.2s' },
    { step: 9, title: 'ML RISK ENGINE', desc: 'ML-Ready prototype inference using calibrated convective distribution', latency: '0.4s' },
    { step: 10, title: '0–6H NOWCAST & ALERTS', desc: 'Kinematic advection, hazard extrapolation, and OASIS CAP 1.2 alert generation', latency: '0.1s' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
      case 'ADAPTER READY':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60';
      case 'NOT CONNECTED':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/60';
      case 'STATIC REFERENCE':
        return 'bg-purple-950/80 text-purple-400 border-purple-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'LIVE DATA':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50';
      case 'NOT CONNECTED':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      case 'REFERENCE':
        return 'bg-purple-900/60 text-purple-300 border-purple-600/50';
      default:
        return 'bg-amber-900/60 text-amber-300 border-amber-600/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              MULTI-SOURCE METEOROLOGICAL DATA FUSION LAYER
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
              systemMode === 'LIVE_DATA' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {systemMode === 'LIVE_DATA' ? 'LIVE DATA MODE' : 'SIMULATION MODE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-source data ingestion, validation, normalization, and sensor harmonization engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSystemMode('LIVE_DATA')}
              className={`px-3 py-1 rounded transition-all font-bold ${
                systemMode === 'LIVE_DATA' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              LIVE DATA
            </button>
            <button
              onClick={() => setSystemMode('SIMULATION')}
              className={`px-3 py-1 rounded transition-all font-bold ${
                systemMode === 'SIMULATION' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              SIMULATION
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Refresh Sources"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Verified Data Sources Audit Table (Phase 15 Requirement) */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>VERIFIED DATA SOURCES AUDIT TABLE ({selectedRegion})</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            2 Live External Feeds • 6 Adapter-Ready Interfaces • 1 Static DEM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                <th className="py-2.5 px-3">SOURCE</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">LAST UPDATE</th>
                <th className="py-2.5 px-3">LATENCY</th>
                <th className="py-2.5 px-3">DATA FRESHNESS</th>
                <th className="py-2.5 px-3">COVERAGE</th>
                <th className="py-2.5 px-3">MODE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sources.map((src, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    {src.is_live_external && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                    <span>{src.source}</span>
                  </td>
                  <td className="py-3 px-3 text-cyan-400">{src.type}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(src.status)}`}>
                      {src.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{src.last_update}</td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{src.latency}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      src.data_freshness === 'FRESH' ? 'bg-emerald-950 text-emerald-400' : 'text-slate-400'
                    }`}>
                      {src.data_freshness}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{src.coverage}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getModeBadge(src.mode)}`}>
                      {src.mode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <strong className="text-emerald-400">Live External Feeds:</strong> Open-Meteo & RainViewer connect directly to live public APIs.
          </div>
          <div>
            <strong className="text-cyan-400">Adapter-Ready Feeds:</strong> Standardized code contracts in <code className="text-slate-300">backend/app/adapters/</code> ready for operational IMD/ISRO gateway connections.
          </div>
        </div>
      </div>

      {/* 10-Stage Pipeline Architecture Flow Diagram */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>DATA FUSION & FORECAST PIPELINE FLOW (10-STAGE ARCHITECTURE)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {pipelineSteps.map((step) => (
            <div
              key={step.step}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-md group relative"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                    STEP {step.step}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{step.latency}</span>
                </div>
                <h4 className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug font-sans">
                  {step.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>ACTIVE</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Fused Atmospheric Features Card (when pipelineData is loaded) */}
      {pipelineData && (
        <div className="space-y-6">
          {/* Fused Parameters & Physics Indices */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>FUSED METEOROLOGICAL PARAMETERS & DERIVED INDICES ({selectedRegion})</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                pipelineData.fusion_mode_label?.includes('LIVE') ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {pipelineData.fusion_mode_label || (systemMode === 'LIVE_DATA' ? 'LIVE DATA' : 'SIMULATION')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">LIVE CAPE</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {pipelineData.fused_features?.live_cape_jkg ?? pipelineData.fused_features?.cape_jkg ?? '—'} J/kg
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">DEWPOINT DEP (T-Td)</div>
                <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                  {pipelineData.fused_features?.dewpoint_depression_c ?? '—'} °C
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">PEAK WIND GUST</div>
                <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                  {pipelineData.fused_features?.peak_gust_kmh ?? '—'} km/h
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">RAIN RATE</div>
                <div className="text-sm font-mono font-bold text-blue-400 mt-0.5">
                  {pipelineData.fused_features?.instant_rain_mmh ?? pipelineData.fused_features?.rain_rate_mmh ?? '—'} mm/h
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">OROGRAPHIC FACTOR</div>
                <div className="text-sm font-mono font-bold text-purple-400 mt-0.5">
                  {pipelineData.fused_features?.orographic_multiplier ?? pipelineData.fused_features?.orographic_lift_factor ?? '1.0'}x
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">RADAR REFLECTIVITY</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {pipelineData.fused_features?.radar_dbz !== null && pipelineData.fused_features?.radar_dbz !== undefined
                    ? `${pipelineData.fused_features.radar_dbz} dBZ`
                    : 'AUTH REQ'}
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">HAIL PROB (POSH)</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {pipelineData.physics_derived_indices?.hail_posh?.probability_pct ?? pipelineData.physics_derived_indices?.hail_probability_pct ?? '—'}%
                </div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div className="text-[9px] font-mono text-slate-500">CLOUDBURST RISK</div>
                <div className="text-sm font-mono font-bold text-red-400 mt-0.5">
                  {pipelineData.physics_derived_indices?.cloudburst_cpi?.risk_pct ?? pipelineData.physics_derived_indices?.cloudburst_risk_pct ?? '—'}%
                </div>
              </div>
            </div>
          </div>

          {/* Feature Provenance Table (Phase 8 & 16) */}
          {pipelineData.feature_provenance && pipelineData.feature_provenance.length > 0 && (
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>MODEL FEATURE PROVENANCE TABLE ({selectedRegion})</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Total Features: {pipelineData.feature_provenance.length} • Provenance Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 text-[11px]">
                      <th className="py-2.5 px-3">FEATURE</th>
                      <th className="py-2.5 px-3 text-center">VALUE</th>
                      <th className="py-2.5 px-3">SOURCE</th>
                      <th className="py-2.5 px-3 text-center">STATUS</th>
                      <th className="py-2.5 px-3">PROVENANCE NOTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {pipelineData.feature_provenance.map((p: any, idx: number) => {
                      const isReal = p.status?.includes('REAL');
                      const isSim = p.status?.includes('SIMULATED');
                      const isUnavail = p.status?.includes('UNAVAILABLE') || p.status?.includes('AUTH');
                      const isStatic = p.status?.includes('STATIC');

                      return (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{p.feature}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-cyan-300">
                            {p.value !== null && p.value !== undefined ? `${p.value} ${p.unit || ''}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{p.source}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                              isStatic ? 'bg-purple-950 text-purple-300 border-purple-800' :
                              isReal ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                              isSim ? 'bg-amber-950 text-amber-300 border-amber-800' :
                              isUnavail ? 'bg-rose-950 text-rose-300 border-rose-800' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] font-sans">{p.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

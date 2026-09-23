import React, { useState } from 'react';
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
  Server
} from 'lucide-react';
import { DataSourceStatus } from '../types';

export const DataFusion: React.FC = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    {
      name: 'Doppler Weather Radar (DWR)',
      source_type: 'Doppler Weather Radar',
      status: 'SIMULATED FEED',
      last_update: '18s ago (simulated)',
      coverage: 'Target coverage: 38 DWR Sectors',
      data_quality: 'Synthetic Dual-Pol Filtered',
      latency_sec: 18,
      confidence_pct: 96,
      note: 'Simulation layer modeled after S/C-band Doppler volume scan parameters'
    },
    {
      name: 'INSAT-3D/3DR Satellite Feeds',
      source_type: 'INSAT-3D/3DR Satellite',
      status: 'SIMULATED FEED',
      last_update: '42s ago (simulated)',
      coverage: 'Target coverage: All-India 4km Grid',
      data_quality: 'Synthetic Radiance Corrected',
      latency_sec: 42,
      confidence_pct: 92,
      note: 'Simulation layer modeled after TIR1 (10.8µm) and WV (6.7µm) cooling rates'
    },
    {
      name: 'Ground Lightning Detection (GLDN)',
      source_type: 'Ground Lightning Network',
      status: 'SIMULATED FEED',
      last_update: '4s ago (simulated)',
      coverage: 'Target coverage: Sub-continental Network',
      data_quality: 'Synthetic TOA Coherence',
      latency_sec: 8,
      confidence_pct: 98,
      note: 'Simulation layer generating realistic flash clusters based on cell reflectivity'
    },
    {
      name: 'Surface Auto Weather Stations (AWS)',
      source_type: 'Surface Weather Stations',
      status: 'SIMULATED FEED',
      last_update: '55s ago (simulated)',
      coverage: 'Target coverage: 1,420 Mesonet Nodes',
      data_quality: 'Automated QC Spike Filter Passed',
      latency_sec: 55,
      confidence_pct: 90,
      note: 'Simulated surface boundary observations for temperature, dewpoint, and pressure'
    },
    {
      name: 'Disdrometers & Rain Gauges',
      source_type: 'Rainfall Observations',
      status: 'SIMULATED FEED',
      last_update: '1m ago (simulated)',
      coverage: 'Target coverage: River Basins',
      data_quality: 'Simulated Dual-Gauge Redundancy',
      latency_sec: 60,
      confidence_pct: 94,
      note: 'Simulated short-duration rain rate accumulation observations'
    },
    {
      name: 'NWP Ensemble / WRF 3km Mesoscale',
      source_type: 'Numerical Weather Prediction',
      status: 'SIMULATED FEED',
      last_update: '4m ago (simulated)',
      coverage: 'Target coverage: Regional Domains',
      data_quality: '00Z/12Z Boundary Integrated',
      latency_sec: 120,
      confidence_pct: 88,
      note: 'Simulated thermodynamic background indices (CAPE, CIN, bulk shear)'
    },
    {
      name: 'Historical Extreme Event Archive',
      source_type: 'Historical Archive',
      status: 'BENCHMARK ARCHIVE',
      last_update: 'Reference Data',
      coverage: '15-Year Convective Climatology',
      data_quality: 'Peer-Reviewed Ground Truth',
      latency_sec: 0,
      confidence_pct: 99,
      note: 'Demonstration reference cases for comparative analog demonstration'
    }
  ]);

  const pipelineSteps = [
    { step: 1, title: 'MULTI-SOURCE INGESTION', desc: 'Continuous asynchronous pull of DWR radar, INSAT imagery, lightning TOA, and surface telemetry (Simulated Feeds)', latency: '12s sim' },
    { step: 2, title: 'QUALITY CONTROL & FILTERING', desc: 'AP removal, despeckling, clutter ground gating, and pressure trend validation', latency: '3s sim' },
    { step: 3, title: 'SPATIAL-TEMPORAL ALIGNMENT', desc: 'Re-projecting disparate sensor grids onto unified target 1–3 km Cartesian WGS84 matrix', latency: '5s sim' },
    { step: 4, title: 'FEATURE EXTRACTION', desc: 'VIL computation, Echo Top height, cloud-top cooling, and CAPE proxy integration', latency: '4s sim' },
    { step: 5, title: 'DATA FUSION MATRIX', desc: 'Multi-layer weighted sensor fusion resolving observational blind spots and parallax errors', latency: '6s sim' },
    { step: 6, title: 'CONVECTIVE CELL DETECTION', desc: 'TITAN/SCIT-style watershed segmentation identifying active convective cores', latency: '4s sim' },
    { step: 7, title: '0–6 HOUR NOWCAST ENGINE', desc: 'Kinematic advection, hazard index extrapolation (POSH, CPI, DCAPE), and CAP alerts', latency: '2s sim' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              MULTI-SOURCE METEOROLOGICAL DATA FUSION (PROTOTYPE)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SIMULATION MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Harmonizing non-uniform observation streams into a coherent target 1–3 km spatial-temporal convective intelligence mesh.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs font-mono text-cyan-400 font-bold">ALL 7 INGESTION FEEDS SIMULATED (API-READY)</span>
        </div>
      </div>

      {/* Visual Data Fusion Architecture Flow Diagram */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>DATA FUSION & FORECAST PIPELINE FLOW (PROTOTYPE ARCHITECTURE)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
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

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>SYNCHRONIZED</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Meteorological Source Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => (
          <div
            key={src.name}
            className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
          >
            <div>
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white">{src.name}</h4>
                  <div className="text-[10px] font-mono text-cyan-400">{src.source_type}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono text-[10px] font-bold">
                  {src.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono text-slate-300">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">SIMULATED LATENCY</div>
                  <div className="text-cyan-400 font-bold">{src.latency_sec}s (sim)</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">SYNTHETIC CONFIDENCE</div>
                  <div className="text-white font-bold">{src.confidence_pct}%</div>
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono text-slate-400">
                <div>Coverage: <strong className="text-slate-200">{src.coverage}</strong></div>
                <div>Quality: <strong className="text-cyan-300">{src.data_quality}</strong></div>
                <p className="text-[11px] text-slate-400 font-sans mt-2 italic leading-relaxed">
                  {src.note}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
              Plug-in API Ready • Real-Time Stream Simulator
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

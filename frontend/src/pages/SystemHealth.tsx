import React from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Activity,
  Server,
  Radio,
  Satellite,
  Zap,
  Database,
  Cpu,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive
} from 'lucide-react';

export const SystemHealth: React.FC = () => {
  const { systemHealth, simulationTick, isLiveSimulation } = useWeather();

  const feeds = [
    { name: 'Doppler Radar Volume Scan (DWR)', status: 'SIMULATED FEED', latency: `${systemHealth?.radar_latency_sec || 18}s (simulated)`, icon: <Radio className="w-4 h-4 text-cyan-400" />, quality: 'Synthetic Dual-Pol', details: 'Modeled after 38 S/C-band DWR volume scan geometry' },
    { name: 'INSAT-3D/3DR Satellite Rapid Scan', status: 'SIMULATED FEED', latency: `${systemHealth?.satellite_latency_sec || 42}s (simulated)`, icon: <Satellite className="w-4 h-4 text-blue-400" />, quality: 'Synthetic Radiance', details: 'Modeled after TIR1 (10.8µm) & WV (6.7µm) rapid scans' },
    { name: 'Ground Lightning TOA Feed (GLDN)', status: 'SIMULATED FEED', latency: `${systemHealth?.lightning_latency_sec || 8}s (simulated)`, icon: <Zap className="w-4 h-4 text-yellow-400" />, quality: 'Synthetic TOA', details: 'Realistic synthetic stroke clusters generated near cells' },
    { name: 'Surface Auto Weather Stations (AWS)', status: 'SIMULATED FEED', latency: '55s (simulated)', icon: <Server className="w-4 h-4 text-emerald-400" />, quality: 'Automated QC Pass', details: 'Simulated surface temperature, dewpoint, pressure tendency' },
    { name: 'TITAN Kinematic Extrapolation Engine', status: 'ONLINE (PROTOTYPE)', latency: '120 ms', icon: <Cpu className="w-4 h-4 text-purple-400" />, quality: 'Operational Code', details: 'Python/NumPy kinematic cell vector advection' },
    { name: 'PostgreSQL / PostGIS Spatial Store', status: 'READY (SCHEMA)', latency: 'Local DDL', icon: <Database className="w-4 h-4 text-emerald-400" />, quality: 'Production DDL', details: 'Full GiST-indexed schema defined in backend/app/database/schema.sql' },
    { name: 'FastAPI REST Microservice Core', status: 'ONLINE', latency: '12 ms', icon: <Wifi className="w-4 h-4 text-cyan-400" />, quality: 'Live Process', details: 'Uvicorn ASGI microservice handling endpoints' },
    { name: 'WebSocket Real-Time Broadcast Stream', status: 'ONLINE', latency: '18 ms', icon: <Activity className="w-4 h-4 text-emerald-400" />, quality: 'Live Stream', details: '/ws/live active feed emitting ticks every 5s' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              SIMULATED SENSOR TELEMETRY & SYSTEM HEALTH MONITOR
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              SIMULATION MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulated latency metrics, ingestion pipeline heartbeat, and microservice status.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Simulation Mode:</span>
          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
            {isLiveSimulation ? 'ACTIVE (TICK ' + simulationTick + ')' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Primary KPI Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">RADAR SCAN LATENCY</div>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">{systemHealth?.radar_latency_sec || 18}s</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Optimal (IMD benchmark &lt;60s)</span>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">SATELLITE SCAN LATENCY</div>
          <div className="text-2xl font-mono font-bold text-blue-400 mt-1">{systemHealth?.satellite_latency_sec || 42}s</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Rapid Scan Mode</span>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">LIGHTNING TOA LATENCY</div>
          <div className="text-2xl font-mono font-bold text-yellow-400 mt-1">{systemHealth?.lightning_latency_sec || 8}s</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Near Real-Time</span>
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">WS CONNECTIONS</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">ACTIVE (1)</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Zero Dropped Frames</span>
          </div>
        </div>
      </div>

      {/* Sensor Feeds Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
          LIVE DATA STREAM HEARTBEATS & TELEMETRY
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feeds.map((f) => (
            <div
              key={f.name}
              className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between shadow-md"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white">{f.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{f.details}</div>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                  {f.status}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">
                  Latency: <strong className="text-white">{f.latency}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

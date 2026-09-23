import React from 'react';
import {
  Cpu,
  Layers,
  Database,
  Radio,
  Server,
  BellRing,
  Globe2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowDown,
  Terminal,
  FileCode
} from 'lucide-react';

export const Architecture: React.FC = () => {
  const tiers = [
    {
      title: '1. SENSOR INGESTION LAYER (PLUGGABLE INTERFACE / SIMULATED IN PROTOTYPE)',
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
      items: [
        'Doppler Weather Radar (DWR) BUFR/HDF5 polarimetric volume scan interface',
        'INSAT-3D/3DR Geostationary Imager & Sounder HDF5/NetCDF feeds (TIR1 10.8µm, WV 6.7µm)',
        'Ground Lightning Detection Network (GLDN) Time-of-Arrival (TOA) strokes',
        'Automatic Weather Stations (AWS) & High-rate tipping bucket rain gauges',
        'NWP Ensemble / WRF mesoscale thermodynamic background grids (GRIB2/NetCDF)'
      ]
    },
    {
      title: '2. PRE-PROCESSING & QUALITY CONTROL',
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400',
      items: [
        'Anomalous propagation (AP) & ground clutter dual-pol filtering',
        'Radial velocity dealiasing & radar beam blockage correction',
        'Automated AWS spike detection and barometric pressure tendency validation',
        'Satellite parallax projection correction against Himalayan terrain DEM'
      ]
    },
    {
      title: '3. SPATIAL-TEMPORAL DATA FUSION',
      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-400',
      items: [
        'Projection onto unified target 1–3 km Cartesian WGS84 EPSG:4326 grid',
        'Temporal synchronization to 5-minute operational nowcast epochs',
        'Multi-sensor composite filling radar cone of silence via satellite IR'
      ]
    },
    {
      title: '4. CONVECTIVE FEATURE EXTRACTION',
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
      items: [
        'Vertically Integrated Liquid (VIL) & VIL Density calculations',
        'Radar Echo Tops (18 dBZ & 40 dBZ boundaries) in km AGL',
        'Satellite cloud-top cooling rates (ΔT/Δt < -4°C/15min trigger)',
        'Thermodynamic CAPE, CIN, and 0–6 km bulk wind shear proxy integration'
      ]
    },
    {
      title: '5. CONVECTIVE CELL TRACKING & EXTRAPOLATION',
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
      items: [
        'TITAN / SCIT equivalent watershed storm cell centroid identification',
        'Cross-correlation kinematic motion vector solver (speed & bearing)',
        'Cell lifecycle modeling: initiation, growth, peak, and stratiform dissipation'
      ]
    },
    {
      title: '6. EXPLAINABLE CONVECTIVE RISK ENGINE (PROTOTYPE / ML-READY)',
      color: 'border-red-500/50 bg-red-950/20 text-red-400',
      items: [
        'Severe Hail Index (SHI) / Probability of Severe Hail (Derived POSH indicator)',
        'Cloudburst Potential Index (CPI) with short-duration extreme rate exceedance',
        'Microburst / Downburst peak surface wind gust velocity proxy',
        'Explainable Convective Risk Score (0–100) with diagnostic factor attribution'
      ]
    },
    {
      title: '7. DELIVERY & EARLY WARNING BROADCAST',
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
      items: [
        'FastAPI REST Microservices & asynchronous WebSocket real-time feeds',
        'OASIS / WMO Common Alerting Protocol (CAP-CP v1.2) XML/JSON generation',
        'Interactive Leaflet GIS Command Center with dynamic storm vectors'
      ]
    }
  ];

  const stakeholders = [
    { role: 'Disaster Management (NDMA / SDRF)', desc: 'Evacuation coordination, flood barrier deployment, and pre-positioning NDRF battalions.' },
    { role: 'Operational Meteorologists', desc: 'Real-time surveillance workstation with multi-sensor diagnostic verification.' },
    { role: 'Civil Aviation (AAI / DGCA)', desc: 'Aerodrome terminal area convective cell hazard avoidance and microburst wind shear alerts.' },
    { role: 'Agriculture & Farmers', desc: 'Hail protection netting and harvest scheduling warnings 2–4 hours ahead.' },
    { role: 'Emergency Services & Police', desc: 'Urban underpass flooding closures and electrical grid isolation.' },
    { role: 'General Public', desc: 'Localized cell broadcast SMS and siren alarms to seek immediate indoor shelter.' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <img
            src="/logo.png"
            alt="VARSHANET Logo"
            className="w-11 h-11 object-contain rounded-full border border-cyan-400/50 shadow-md shadow-cyan-950/60 shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
                VARSHANET SYSTEM ARCHITECTURE & ENGINEERING
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                SIH26084 SPECIFICATION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end technical blueprint illustrating multi-source sensor ingestion to disaster authority alert dissemination.
            </p>
          </div>
        </div>
      </div>

      {/* Layer-by-Layer Architectural Pipeline Flow */}
      <div className="space-y-3">
        {tiers.map((t, idx) => (
          <React.Fragment key={t.title}>
            <div className={`border rounded-xl p-4.5 shadow-lg backdrop-blur ${t.color}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider">{t.title}</h3>
                <span className="text-[10px] font-mono text-slate-400">LAYER {idx + 1} OF 7</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                {t.items.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {idx < tiers.length - 1 && (
              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-4 h-4 text-cyan-500/60" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* End User Stakeholders Integration */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>END USERS & OPERATIONAL STAKEHOLDER INTEGRATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stakeholders.map((s) => (
            <div key={s.role} className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1">
              <h4 className="text-xs font-mono font-bold text-cyan-300">{s.role}</h4>
              <p className="text-[11px] font-sans text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Database Schema & Technical Notes */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>PRODUCTION POSTGIS SPATIAL DATABASE STRUCTURE</span>
        </div>
        <p className="text-slate-400 font-sans text-xs">
          The database schema (located at <code className="text-cyan-400 font-mono">backend/app/database/schema.sql</code>) 
          is indexed with GiST spatial indexes over geometries (<code className="text-cyan-400 font-mono">GEOMETRY(Polygon, 4326)</code> and <code className="text-cyan-400 font-mono">GEOMETRY(Point, 4326)</code>) 
          and time-partitioned for sub-second spatial-temporal nowcast spatial queries.
        </p>
      </div>
    </div>
  );
};

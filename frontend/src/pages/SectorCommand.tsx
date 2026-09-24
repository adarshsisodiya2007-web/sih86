import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Plane,
  Sprout,
  Building2,
  Wind,
  CloudRain,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Navigation2,
  Shield,
  Clock,
  Compass
} from 'lucide-react';

export const SectorCommand: React.FC = () => {
  const { selectedRegion, stormCells } = useWeather();
  const [activeSectorTab, setActiveSectorTab] = useState<'aviation' | 'agriculture' | 'urban'>('aviation');

  const maxDbz = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.dbz_max)) : 62.5;
  const maxWind = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.wind_gust_kmh)) : 88;
  const maxHail = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.hail_prob)) : 76;
  const maxRain = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.rain_rate_mmh)) : 84;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Shield className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
              GOVERNMENT & SECTOR-SPECIFIC OPERATIONAL COMMAND
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              3 ACTIVE PORTALS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tailored convective decision-support modules for DGCA/Airports, Agriculture & Mandis, and Municipal Urban Flood Units.
          </p>
        </div>

        {/* Sector Selection Tabs */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveSectorTab('aviation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSectorTab === 'aviation'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>AVIATION MET</span>
          </button>
          <button
            onClick={() => setActiveSectorTab('agriculture')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSectorTab === 'agriculture'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>AGRI-SHIELD</span>
          </button>
          <button
            onClick={() => setActiveSectorTab('urban')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSectorTab === 'urban'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>URBAN DRAINAGE</span>
          </button>
        </div>
      </div>

      {/* 1. Aviation Weather Portal */}
      {activeSectorTab === 'aviation' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Top Aerodrome Status Alert */}
          <div className="bg-red-950/40 border border-red-500/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-red-600/30 border border-red-500 text-red-400 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-red-300 tracking-wide">
                  AIRPORT ALERT LEVEL: RED • LOW-LEVEL WIND SHEAR (LLWS) ACTIVE
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Nagpur Dr. Babasaheb Ambedkar International Airport (ICAO: VANP) Runway 14/32
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Peak Wind Gust:</span>
              <span className="px-3 py-1 rounded bg-red-950 border border-red-700 text-sm font-mono font-bold text-red-400">
                {maxWind} km/h (48 KT)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* TAF Decoding Card */}
            <div className="lg:col-span-2 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>TERMINAL AERODROME FORECAST (TAF RAW & DECODED)</span>
                <span className="text-cyan-400 text-[10px]">ICAO VANP</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
                TAF VANP 241800Z 2418/2524 09018G38KT 2500 TSRA SCT015CB BKN080 TEMPO 2419/2422 12048G60KT 0800 +TSGRRA SQ FG=
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">SURFACE WIND</div>
                  <div className="text-sm font-bold text-white mt-1">090° @ 18 KT</div>
                  <div className="text-[10px] text-amber-400">Gusting 38 KT</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">VISIBILITY</div>
                  <div className="text-sm font-bold text-white mt-1">2,500 M</div>
                  <div className="text-[10px] text-red-400">Drops to 800M in Squall</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">SIGNIFICANT CLOUD</div>
                  <div className="text-sm font-bold text-white mt-1">SCT 1,500 FT CB</div>
                  <div className="text-[10px] text-cyan-400">Echo Top 15.6 KM</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">HAZARD TRIGGER</div>
                  <div className="text-sm font-bold text-red-400 mt-1">+TSGR (Hail)</div>
                  <div className="text-[10px] text-slate-400">Heavy Squall Line</div>
                </div>
              </div>

              {/* Flight Path Diversion Vectors */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-2">
                <div className="font-bold text-slate-200 flex items-center space-x-2">
                  <Navigation2 className="w-4 h-4 text-cyan-400" />
                  <span>ATC CONVECTIVE REROUTING RECOMMENDATION:</span>
                </div>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  Inbound flights from Mumbai & Hyderabad (Airway W12/Q13) hold minimum 25 NM clearance south-west of aerodrome. Runway 32 ILS glide slope intercepted by Supercell Alpha core (63.5 dBZ). Suggest 20-minute holding pattern or diversion to Jabalpur (VAJB).
                </div>
              </div>
            </div>

            {/* Microburst & Wind Shear Detection Index */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
                TERMINAL WIND SHEAR METRICS
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">LLWS Alert:</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">F-Factor Hazard Index:</span>
                  <span className="text-red-400 font-bold">0.142 (&gt; 0.10 Hazard)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Runway Crosswind:</span>
                  <span className="text-amber-400 font-bold">24 KT (Limit 25 KT)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Microburst Outflow Speed:</span>
                  <span className="text-cyan-400 font-bold">{maxWind} km/h</span>
                </div>
              </div>

              <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-lg text-[11px] font-mono text-red-300">
                ⚠️ Critical warning: Downward convective draft velocity exceeds 18 m/s within 4 NM of final approach fix.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Agriculture & Mandi Advisory */}
      {activeSectorTab === 'agriculture' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-400 animate-pulse">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-emerald-300 tracking-wide">
                  AGRI-SHIELD: KISAN SEVERE HAIL & RAIN SURGE ADVISORY
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Vidarbha Agricultural Zone • Nagpur, Wardha & Amravati Mandi Circuits
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Hail Hazard Risk:</span>
              <span className="px-3 py-1 rounded bg-orange-950 border border-orange-700 text-sm font-mono font-bold text-orange-400">
                {maxHail}% (Large Hail &gt;2.5 cm)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-white flex justify-between">
                <span>Cotton (Kapas)</span>
                <span className="text-red-400">HIGH RISK</span>
              </div>
              <div className="text-[11px] text-slate-400">Bolling & Maturity Stage</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hailstones will cause boll drop and fibre shredding. Farmers advised to harvest mature pickings immediately.
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-white flex justify-between">
                <span>Soybean</span>
                <span className="text-red-400">HIGH RISK</span>
              </div>
              <div className="text-[11px] text-slate-400">Pod Development Stage</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                High wind gusts ({maxWind} km/h) threaten pod shattering and waterlogging. Clear drainage channels in fields.
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-white flex justify-between">
                <span>Citrus / Nagpur Orange</span>
                <span className="text-orange-400">SEVERE RISK</span>
              </div>
              <div className="text-[11px] text-slate-400">Mrug Bahar Fruit Setting</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hail impact causes fruit dropping & bark bruising. Deploy anti-hail nets where infrastructure is available.
              </p>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-white flex justify-between">
                <span>APMC Mandi Grain Stock</span>
                <span className="text-red-400">IMMEDIATE ACTION</span>
              </div>
              <div className="text-[11px] text-slate-400">Open Yard Storage</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mandi secretaries instructed: Cover all wheat/soybean bags with waterproof tarpaulins before 20-min rain onset.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Urban Smart Drainage & Flood Control */}
      {activeSectorTab === 'urban' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-purple-950/40 border border-purple-500/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-600/30 border border-purple-500 text-purple-400 animate-pulse">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-purple-300 tracking-wide">
                  MUNICIPAL SMART CITY URBAN INUNDATION COMMAND
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Nagpur Municipal Corporation (NMC) • Storm Water Discharge Network
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Current Radar Rain Peak:</span>
              <span className="px-3 py-1 rounded bg-purple-950 border border-purple-700 text-sm font-mono font-bold text-purple-300">
                {maxRain} mm/h
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
              <div className="font-bold text-white border-b border-slate-800 pb-2">
                CRITICAL LOW-LYING VULNERABILITY ZONES
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span>Nag River Basin (Ward 14):</span>
                <span className="text-red-400 font-bold">OVERFLOW IN 18 MIN</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span>Pili Nadi Storm Culvert:</span>
                <span className="text-orange-400 font-bold">CAPACITY 84% FULL</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span>Manish Nagar Underpass:</span>
                <span className="text-red-400 font-bold">CLOSURE RECOMMENDED</span>
              </div>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
              <div className="font-bold text-white border-b border-slate-800 pb-2">
                AUTOMATED DRAIN PUMP DISPATCH
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span>Pump Station #04 (Dharampeth):</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">RUNNING 100%</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span>Pump Station #09 (Sitabuldi):</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">RUNNING 100%</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span>Emergency Sump #12 (Civil Lines):</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">AUTO-ARMED</span>
              </div>
            </div>

            <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
              <div className="font-bold text-white border-b border-slate-800 pb-2">
                DRAIN DISCHARGE CAPACITY METRICS
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Radar Precipitation Influx:</span>
                  <span className="text-white font-bold">{maxRain} mm/h</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Drain Design Carrying Max:</span>
                  <span className="text-white font-bold">50 mm/h</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Net Surface Water Surcharge:</span>
                  <span className="text-red-400 font-bold">+{maxRain - 50} mm/h</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-red-950/40 border border-red-700/50 text-[11px] text-red-300">
                Action: Deploy mobile high-capacity dewatering diesel units to Sitabuldi interchange.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

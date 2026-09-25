/**
 * screens/HomeScreen.tsx
 * VARSHANET Citizen Dashboard — featuring Live Doppler Radar Map & Instant Officer Alerts.
 */
import React from 'react'
import { getSeverityTheme, timeAgo, formatDateTime } from '../helpers'
import { SeverityBadge } from '../components/SeverityBadge'
import { AlertCard } from '../components/AlertCard'
import { CitizenRadarMap } from '../components/CitizenRadarMap'
import type { CitizenAlert, CitizenStatus, CitizenUpdate } from '../types'

interface Props {
  status:        CitizenStatus | null
  alerts:        CitizenAlert[]
  updates:       CitizenUpdate[]
  location:      string
  isLoading:     boolean
  lastRefreshed: Date | null
  onViewAlert:   (id: string) => void
  onGoToAlerts:  () => void
  onGoToSafety:  () => void
  onRefresh:     () => void
  onChangeCity:  () => void
}

export const HomeScreen: React.FC<Props> = ({
  status, alerts, updates, location,
  isLoading, lastRefreshed,
  onViewAlert, onGoToAlerts, onGoToSafety, onRefresh, onChangeCity
}) => {
  const topAlert   = alerts[0] ?? null
  const severity   = status?.overall_severity ?? topAlert?.severity ?? 'NORMAL'
  const t          = getSeverityTheme(severity)
  const displayLoc = location || status?.location || 'All Areas'

  return (
    <div className="flex-1 overflow-y-auto bg-[#040711] text-slate-100 pb-6">
      {/* ── Top Control Strip ── */}
      <div className="px-4 py-2.5 bg-[#0b1329] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <button
          onClick={onChangeCity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#060a14] border border-cyan-500/40 text-cyan-300 font-bold hover:border-cyan-400 transition-colors cursor-pointer"
        >
          <span>📍 {displayLoc}</span>
          <span className="text-[10px] text-slate-400">CHANGE ▾</span>
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#863bff]/30 to-cyan-500/30 border border-cyan-500/50 text-cyan-300 hover:text-white font-bold cursor-pointer transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{isLoading ? 'SYNCING...' : '⚡ LIVE SYNC'}</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ── ACTIVE OFFICER ALERT BANNER (If alert is active for this city) ── */}
        {topAlert && (
          <div className={`rounded-2xl p-4 border-2 ${t.border} ${t.bg} shadow-2xl relative overflow-hidden animate-pulse`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono font-black tracking-wider text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  OFFICIAL {topAlert.severity} WARNING IN EFFECT
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{topAlert.title}</h2>
              </div>
              <span className="text-3xl p-1 bg-black/40 rounded-xl border border-white/10">
                {t.icon}
              </span>
            </div>

            <p className="text-xs text-slate-200 mt-2 line-clamp-2 leading-relaxed">
              {topAlert.message}
            </p>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono text-slate-300">
                📍 {topAlert.location} • {timeAgo(topAlert.issued_at)}
              </span>
              <button
                onClick={onGoToSafety}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                VIEW SAFETY STEPS ›
              </button>
            </div>
          </div>
        )}

        {/* ── INTERACTIVE LIVE WEATHER RADAR MAP ── */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-cyan-400">
              <span>📡</span> 0–6H DOPPLER RADAR & STORM CELLS
            </span>
            <span className="text-[10px] text-slate-400">Pinch/Drag to Explore</span>
          </div>

          <CitizenRadarMap
            selectedLocation={displayLoc}
            alerts={alerts}
            onViewAlert={onViewAlert}
            height="230px"
          />
        </section>

        {/* ── ALL CLEAR / SITUATION SUMMARY ── */}
        {!topAlert && (
          <div className={`rounded-2xl p-4 border border-slate-800 bg-[#0b1329] shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  CURRENT SITUATION IN {displayLoc.toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={severity} large />
                </div>
              </div>
              <div className="text-3xl">🟢</div>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {status?.headline || `No severe convective storms or flood warnings currently reported in ${displayLoc}. Doppler radar scans are clear.`}
            </p>
          </div>
        )}

        {/* ── QUICK METRICS GRID ── */}
        {status?.weather && (
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">RAIN RATE</div>
              <div className="text-xs font-black text-cyan-400 mt-0.5">
                {status.weather.rain_rate_mmh > 0 ? `${status.weather.rain_rate_mmh.toFixed(1)} mm/h` : '0 mm/h'}
              </div>
            </div>
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">CONDITION</div>
              <div className="text-xs font-black text-cyan-400 mt-0.5 truncate">
                {status.weather.condition || 'Clear'}
              </div>
            </div>
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">TEMP</div>
              <div className="text-xs font-black text-slate-200 mt-0.5">
                {status.weather.temperature_c}°C
              </div>
            </div>
            <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">WIND</div>
              <div className="text-xs font-black text-slate-200 mt-0.5">
                {status.weather.wind_speed_kmh} km/h
              </div>
            </div>
          </div>
        )}

        {/* ── ROAD STATUS IF IMPACTED ── */}
        {status?.road_status && status.road_status !== 'Normal operations' && (
          <div className="rounded-2xl p-3.5 bg-yellow-950/40 border border-yellow-700/60 text-xs">
            <div className="font-mono font-bold text-yellow-400 mb-1 flex items-center gap-1.5">
              <span>🚧</span> TRAFFIC & ROAD CONDITION
            </div>
            <p className="text-yellow-100 leading-snug">{status.road_status}</p>
          </div>
        )}

        {/* ── ALL ACTIVE WARNINGS IN SECTOR ── */}
        {alerts.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>⚡ ACTIVE ALERTS ({alerts.length})</span>
              <button onClick={onGoToAlerts} className="text-cyan-400 hover:underline cursor-pointer">
                View all →
              </button>
            </div>
            {alerts.map(a => (
              <AlertCard key={a.id} alert={a} onClick={() => onViewAlert(a.id)} />
            ))}
          </section>
        )}

        {/* ── RECENT BULLETINS ── */}
        {updates.length > 0 && (
          <section className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>📢</span> OFFICIAL DISPATCHES
            </div>
            <div className="space-y-2">
              {updates.slice(0, 2).map(u => (
                <div key={u.id} className="bg-[#0b1329] border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                    <span className="text-cyan-400 font-bold">{u.category || 'BULLETIN'}</span>
                    <span>{timeAgo(u.timestamp)}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 leading-snug">{u.title}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{u.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <div className="text-center text-[10px] font-mono text-slate-500 pt-2 space-y-1">
          <div>VARSHANET • SEVERE CONVECTIVE NOWCASTING ENGINE</div>
          {lastRefreshed && (
            <div>Last Updated: {formatDateTime(lastRefreshed.toISOString())}</div>
          )}
        </div>
      </div>
    </div>
  )
}

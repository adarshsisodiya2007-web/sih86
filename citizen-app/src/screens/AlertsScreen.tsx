/**
 * screens/AlertsScreen.tsx
 * Full list of active officer-published alerts for the citizen's location.
 */
import React from 'react'
import { AlertCard } from '../components/AlertCard'
import type { CitizenAlert } from '../types'

interface Props {
  alerts:       CitizenAlert[]
  location:     string
  isLoading:    boolean
  onViewAlert:  (id: string) => void
  onRefresh:    () => void
  onChangeCity: () => void
}

export const AlertsScreen: React.FC<Props> = ({
  alerts, location, isLoading, onViewAlert, onRefresh, onChangeCity
}) => {
  const criticals = alerts.filter(a => a.severity === 'CRITICAL')
  const highs     = alerts.filter(a => a.severity === 'HIGH')
  const others    = alerts.filter(a => !['CRITICAL', 'HIGH'].includes(a.severity))

  return (
    <div className="flex-1 overflow-y-auto bg-[#040711] text-slate-100 pb-6">
      {/* ── Header ── */}
      <div className="bg-[#0b1329] border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono font-black text-lg tracking-wider text-slate-100 flex items-center gap-2">
              <span>⚡</span> ACTIVE WARNINGS
            </h1>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              {location ? `FILTER: ${location.toUpperCase()}` : 'ALL MONITORED SECTORS'}
              {alerts.length > 0 && ` • ${alerts.length} ACTIVE`}
            </div>
          </div>
          <button
            onClick={onChangeCity}
            className="text-xs font-mono text-cyan-400 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-colors"
          >
            CHANGE 📍
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Loading Skeleton ── */}
        {isLoading && alerts.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#0b1329] rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-16 px-4 bg-[#0b1329]/50 border border-slate-800 rounded-3xl mt-2 space-y-3">
            <div className="text-5xl">🛡️</div>
            <div className="font-mono font-bold text-base text-slate-200">
              No Active Alerts for {location || 'This Area'}
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              IMD Doppler radar & MOSDAC satellite fusion show no critical convective hazards currently active in this sector.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={onRefresh}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                🔄 Refresh Now
              </button>
              {location && (
                <button
                  onClick={onChangeCity}
                  className="bg-[#863bff] hover:bg-[#7e14ff] text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Choose Another City
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── CRITICAL ── */}
        {criticals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-red-400 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              CRITICAL EMERGENCY WARNINGS ({criticals.length})
            </div>
            {criticals.map(a => (
              <AlertCard key={a.id} alert={a} onClick={() => onViewAlert(a.id)} />
            ))}
          </section>
        )}

        {/* ── HIGH ── */}
        {highs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-orange-400 tracking-wider">
              <span>🟠</span> HIGH SEVERITY ALERTS ({highs.length})
            </div>
            {highs.map(a => (
              <AlertCard key={a.id} alert={a} onClick={() => onViewAlert(a.id)} />
            ))}
          </section>
        )}

        {/* ── WATCH / NORMAL ── */}
        {others.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-yellow-400 tracking-wider">
              <span>🟡</span> WATCH & ADVISORY ALERTS ({others.length})
            </div>
            {others.map(a => (
              <AlertCard key={a.id} alert={a} onClick={() => onViewAlert(a.id)} />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

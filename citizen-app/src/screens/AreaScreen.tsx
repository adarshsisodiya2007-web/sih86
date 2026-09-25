/**
 * screens/AreaScreen.tsx
 * Regional Overview & National Radar Map
 */
import React from 'react'
import { getSeverityTheme, formatDateTime } from '../helpers'
import { SeverityBadge } from '../components/SeverityBadge'
import { CitizenRadarMap } from '../components/CitizenRadarMap'
import type { CitizenAlert, CitizenStatus } from '../types'

interface Props {
  allAlerts:        CitizenAlert[]
  status:           CitizenStatus | null
  selectedLocation: string
  onSelectLocation: (loc: string) => void
  onViewAlert:      (id: string) => void
}

export const AreaScreen: React.FC<Props> = ({
  allAlerts, status: _status, selectedLocation, onSelectLocation, onViewAlert
}) => {
  // Group alerts by location
  const byLocation: Record<string, CitizenAlert[]> = {}
  for (const alert of allAlerts) {
    const loc = alert.location || 'Regional Zone'
    if (!byLocation[loc]) byLocation[loc] = []
    byLocation[loc].push(alert)
  }

  const SEV_RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, WATCH: 2, NORMAL: 1 }
  const sortedLocations = Object.keys(byLocation).sort((a, b) => {
    const aMax = Math.max(...byLocation[a].map(al => SEV_RANK[al.severity] ?? 0))
    const bMax = Math.max(...byLocation[b].map(bl => SEV_RANK[bl.severity] ?? 0))
    return bMax - aMax
  })

  return (
    <div className="flex-1 overflow-y-auto bg-[#040711] text-slate-100 pb-6">
      {/* ── Header ── */}
      <div className="bg-[#0b1329] border-b border-slate-800 p-4">
        <h1 className="font-mono font-black text-lg tracking-wider text-slate-100 flex items-center gap-2">
          <span>🗺️</span> NATIONAL RADAR & SECTORS
        </h1>
        <div className="text-xs font-mono text-slate-400 mt-0.5">
          LIVE DOPPLER RADAR CELLS & AFFECTED REGIONS
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Full Interactive Radar Map ── */}
        <CitizenRadarMap
          selectedLocation={selectedLocation}
          alerts={allAlerts}
          onViewAlert={onViewAlert}
          height="280px"
        />

        {/* Sectors list */}
        {sortedLocations.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              MONITORED REGIONS UNDER ADVISORY ({sortedLocations.length})
            </h2>
            {sortedLocations.map(loc => {
              const locAlerts = byLocation[loc]
              const worstSeverity = locAlerts.reduce((best, al) =>
                (SEV_RANK[al.severity] ?? 0) > (SEV_RANK[best] ?? 0) ? al.severity : best,
                'NORMAL' as string
              )
              const t = getSeverityTheme(worstSeverity)
              const isSelected = selectedLocation.toLowerCase().includes(loc.toLowerCase()) ||
                                 loc.toLowerCase().includes(selectedLocation.toLowerCase())

              return (
                <div
                  key={loc}
                  className={`rounded-2xl border-2 ${t.border} bg-[#0b1329] overflow-hidden transition-all`}
                >
                  <div className="p-3.5 flex items-center justify-between bg-black/20 border-b border-white/5">
                    <button
                      onClick={() => onSelectLocation(loc)}
                      className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-100">{loc}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {locAlerts.length} alert{locAlerts.length > 1 ? 's' : ''} reported
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={worstSeverity} />
                      <button
                        onClick={() => onSelectLocation(loc)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-black border-cyan-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400'
                        }`}
                      >
                        {isSelected ? 'SELECTED ✓' : 'FILTER'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {locAlerts.map(alert => (
                      <button
                        key={alert.id}
                        onClick={() => onViewAlert(alert.id)}
                        className="w-full text-left p-2 rounded-xl bg-[#060a14] border border-slate-800/80 hover:border-slate-600 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-slate-200 truncate">{alert.title}</div>
                          <div className="text-[10px] font-mono text-slate-500">{formatDateTime(alert.issued_at)}</div>
                        </div>
                        <span className="text-cyan-400 font-mono text-xs flex-shrink-0">DETAILS ›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        ) : (
          <div className="text-center py-8 px-4 bg-[#0b1329]/50 border border-slate-800 rounded-2xl">
            <div className="text-3xl mb-1">🟢</div>
            <div className="font-mono font-bold text-sm text-slate-200">All Sectors Clear</div>
            <div className="text-xs text-slate-400 mt-1">No emergency alert reported currently.</div>
          </div>
        )}
      </div>
    </div>
  )
}

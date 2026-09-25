/**
 * AlertDetailModal.tsx — Full-screen alert detail with VARSHANET dark branding
 */
import React, { useEffect, useState } from 'react'
import { getAlertDetail } from '../api'
import { getSeverityTheme, formatDateTime } from '../helpers'
import { SeverityBadge } from './SeverityBadge'
import type { CitizenAlertDetail } from '../types'

interface Props {
  alertId: string
  onClose: () => void
}

export const AlertDetailModal: React.FC<Props> = ({ alertId, onClose }) => {
  const [detail, setDetail]   = useState<CitizenAlertDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAlertDetail(alertId).then(d => { setDetail(d); setLoading(false) })
  }, [alertId])

  const t = detail ? getSeverityTheme(detail.severity) : getSeverityTheme('NORMAL')

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#040711' }}>
      {/* ── Header ── */}
      <div className={`flex-shrink-0 px-4 py-3 border-b ${t.border} bg-[#0b1329]`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-400 text-2xl font-light leading-none p-1 -ml-1"
            aria-label="Back"
          >‹</button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 font-mono mb-0.5">VARSHANET ALERT DETAIL</div>
            {detail && (
              <div className="font-bold text-sm text-slate-100 truncate leading-tight">{detail.title}</div>
            )}
          </div>
          {detail && <SeverityBadge severity={detail.severity} />}
        </div>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
            <div className="text-sm font-mono">Loading alert details…</div>
          </div>
        </div>
      ) : !detail ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500">
          <div>
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-sm font-mono">Could not load alert details.</div>
            <button onClick={onClose} className="mt-4 text-cyan-400 text-sm underline font-mono">Go Back</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* ── Hero severity banner ── */}
          <div className={`border-b-2 ${t.border} ${t.bg} px-4 py-5`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{t.icon}</span>
              <div>
                <div className={`font-mono font-black text-xl tracking-widest ${t.text}`}>
                  {t.label} ALERT
                </div>
                <div className="text-slate-400 text-xs font-mono">ISSUED BY VARSHANET OFFICER</div>
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-100 leading-snug mb-3">{detail.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400 font-mono">
              <span>📍 {detail.location}</span>
              <span>🕐 {formatDateTime(detail.issued_at)}</span>
              {detail.expires_at && (
                <span className="text-orange-400">⏰ Expires: {formatDateTime(detail.expires_at)}</span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* ── Officer message ── */}
            <section>
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">
                Officer Message
              </h2>
              <p className="text-base text-slate-200 leading-relaxed">{detail.message}</p>
            </section>

            {/* ── Safety instructions ── */}
            {detail.safety_instructions.length > 0 && (
              <section className="rounded-2xl border border-cyan-800/60 bg-cyan-950/40 p-4">
                <h2 className="text-sm font-bold font-mono text-cyan-400 tracking-wide mb-3">🛡️ SAFETY INSTRUCTIONS</h2>
                <ol className="space-y-2.5">
                  {detail.safety_instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-200">
                      <span className="flex-shrink-0 w-5 h-5 bg-cyan-600 text-white rounded-full text-xs flex items-center justify-center font-bold font-mono">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* ── Road status ── */}
            {detail.road_status && (
              <section className="rounded-2xl border border-yellow-700/60 bg-yellow-950/40 p-4">
                <h2 className="text-sm font-bold font-mono text-yellow-400 tracking-wide mb-2">🚧 ROAD / AREA STATUS</h2>
                <p className="text-sm text-yellow-100">{detail.road_status}</p>
              </section>
            )}

            {/* ── Hazards ── */}
            {detail.hazards.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Active Hazards</h2>
                <div className="flex flex-wrap gap-2">
                  {detail.hazards.map(h => (
                    <span key={h} className="bg-red-950/60 text-red-400 border border-red-700/60 text-sm px-3 py-1 rounded-full font-mono font-semibold">
                      ⚠️ {h}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── Safe shelters ── */}
            {detail.safe_shelters.length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">🏠 Nearby Safe Shelters</h2>
                <div className="space-y-3">
                  {detail.safe_shelters.map((s, i) => (
                    <div key={i} className="border border-slate-700/60 rounded-2xl p-4 bg-[#0b1329]">
                      <div className="font-semibold text-slate-100">{s.name}</div>
                      <div className="text-sm text-slate-400 mt-0.5 font-mono">📍 {s.address}</div>
                      {s.contact && (
                        <a href={`tel:${s.contact}`} className="inline-flex items-center gap-1 text-cyan-400 text-sm mt-1 font-bold font-mono">
                          📞 {s.contact}
                        </a>
                      )}
                      {s.capacity && (
                        <div className="text-xs text-slate-500 mt-1 font-mono">Capacity: {s.capacity}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Emergency contacts ── */}
            {Object.keys(detail.emergency_contacts ?? {}).length > 0 && (
              <section>
                <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">📞 Emergency Contacts</h2>
                <div className="space-y-2">
                  {Object.entries(detail.emergency_contacts).map(([label, num]) => (
                    <a
                      key={label}
                      href={`tel:${num}`}
                      className="flex items-center justify-between border border-slate-700/60 rounded-2xl px-4 py-3.5 bg-[#0b1329] active:bg-slate-800"
                    >
                      <span className="text-sm text-slate-300 font-mono">{label}</span>
                      <span className="bg-[#863bff] text-white text-base font-black px-3 py-1.5 rounded-xl font-mono">{num}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ── Metadata ── */}
            <section className="text-xs text-slate-600 font-mono space-y-0.5 pt-2 border-t border-slate-800">
              <div>Source: {detail.source}</div>
              {detail.confidence_pct !== undefined && <div>Confidence: {Math.round(detail.confidence_pct)}%</div>}
              <div>Status: {detail.status}</div>
              <div className="pt-2 text-slate-700">VARSHANET — Severe Convective Weather Intelligence System</div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

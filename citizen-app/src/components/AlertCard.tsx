import React from 'react'
import { getSeverityTheme, timeAgo, formatTime } from '../helpers'
import { SeverityBadge } from './SeverityBadge'
import type { CitizenAlert } from '../types'

interface Props {
  alert: CitizenAlert
  onClick: () => void
  compact?: boolean
}

export const AlertCard: React.FC<Props> = ({ alert, onClick, compact = false }) => {
  const t = getSeverityTheme(alert.severity)
  const isCritical = alert.severity === 'CRITICAL'

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl border-l-4 ${t.border} ${t.bg}
        p-4 mb-3 active:opacity-75 transition-all
        ${isCritical ? `shadow-lg shadow-red-900/40 ring-1 ring-red-500/30` : 'shadow-md shadow-black/30'}
      `}
      aria-label={`Alert: ${alert.title}, severity ${alert.severity}`}
    >
      <div className="flex items-center justify-between mb-2">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs text-slate-500 font-mono">{timeAgo(alert.issued_at)}</span>
      </div>

      <h3 className={`font-bold text-base leading-snug mb-1 text-slate-100`}>
        {alert.title}
      </h3>

      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-2">
        <span>📍 {alert.location}</span>
        <span>🕐 {formatTime(alert.issued_at)}</span>
      </div>

      {!compact && (
        <p className="text-sm text-slate-300 line-clamp-2 leading-snug">
          {alert.message}
        </p>
      )}

      {!compact && alert.hazards.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {alert.hazards.slice(0, 3).map(h => (
            <span key={h} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
              {h}
            </span>
          ))}
        </div>
      )}

      <div className={`mt-2.5 text-xs font-bold font-mono ${t.text} flex items-center gap-1`}>
        VIEW FULL DETAILS <span>›</span>
      </div>
    </button>
  )
}

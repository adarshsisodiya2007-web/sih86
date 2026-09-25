import React from 'react'
import { getSeverityTheme, formatTime } from '../helpers'
import type { CitizenAlert } from '../types'

interface Props {
  alert: CitizenAlert
  onDismiss: () => void
  onView: () => void
}

export const NotificationBanner: React.FC<Props> = ({ alert, onDismiss, onView }) => {
  const t = getSeverityTheme(alert.severity)
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 border-b-2 ${t.border} shadow-xl max-w-md mx-auto`}
      style={{ background: 'rgba(11,19,41,0.97)', backdropFilter: 'blur(12px)' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-3">
        <span className="text-2xl flex-shrink-0">{t.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-mono font-bold text-sm tracking-wide ${t.text}`}>
            NEW {t.label} ALERT
          </div>
          <div className="text-slate-200 text-sm font-semibold leading-snug mt-0.5">{alert.title}</div>
          <div className="text-slate-400 text-xs mt-0.5">📍 {alert.location} · 🕐 {formatTime(alert.issued_at)}</div>
          <button onClick={onView} className={`text-xs font-bold font-mono ${t.text} underline mt-1`}>
            TAP TO VIEW SAFETY INSTRUCTIONS →
          </button>
        </div>
        <button onClick={onDismiss} className="text-slate-500 hover:text-slate-200 text-xl flex-shrink-0" aria-label="Dismiss">×</button>
      </div>
    </div>
  )
}

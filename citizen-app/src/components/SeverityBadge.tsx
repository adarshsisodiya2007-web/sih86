import React from 'react'
import { getSeverityTheme } from '../helpers'

interface Props {
  severity: string
  large?: boolean
}

export const SeverityBadge: React.FC<Props> = ({ severity, large = false }) => {
  const t = getSeverityTheme(severity)
  const sz = large
    ? 'px-4 py-1.5 text-sm font-black rounded-lg tracking-widest'
    : 'px-2.5 py-0.5 text-xs font-bold rounded-md tracking-wide'
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${sz} ${t.badge} ${t.badgeText}`}>
      {t.icon} {t.label}
    </span>
  )
}

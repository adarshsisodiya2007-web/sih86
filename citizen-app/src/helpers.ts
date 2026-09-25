/**
 * helpers.ts — Shared utilities for VARSHANET Citizen App
 */

import type { Severity } from './types'

// ─── Severity theming — dark theme matching VARSHANET's dark bg ───────────────
export interface SeverityTheme {
  bg: string        // card background class
  border: string    // border class
  text: string      // primary label text
  badge: string     // badge bg
  badgeText: string // badge text
  dot: string       // dot indicator
  icon: string      // emoji
  label: string     // display label
  ring: string      // glow ring color (for hero cards)
}

export function getSeverityTheme(severity: string): SeverityTheme {
  switch ((severity ?? '').toUpperCase()) {
    case 'CRITICAL':
      return {
        bg:        'bg-red-950/60',
        border:    'border-red-500',
        text:      'text-red-400',
        badge:     'bg-red-600',
        badgeText: 'text-white',
        dot:       'bg-red-500',
        icon:      '🔴',
        label:     'CRITICAL',
        ring:      'shadow-red-500/40',
      }
    case 'HIGH':
      return {
        bg:        'bg-orange-950/60',
        border:    'border-orange-500',
        text:      'text-orange-400',
        badge:     'bg-orange-600',
        badgeText: 'text-white',
        dot:       'bg-orange-500',
        icon:      '🟠',
        label:     'HIGH',
        ring:      'shadow-orange-500/40',
      }
    case 'WATCH':
      return {
        bg:        'bg-yellow-950/60',
        border:    'border-yellow-500',
        text:      'text-yellow-400',
        badge:     'bg-yellow-500',
        badgeText: 'text-yellow-950 font-bold',
        dot:       'bg-yellow-400',
        icon:      '🟡',
        label:     'WATCH',
        ring:      'shadow-yellow-500/40',
      }
    default:
      return {
        bg:        'bg-green-950/60',
        border:    'border-green-600',
        text:      'text-green-400',
        badge:     'bg-green-600',
        badgeText: 'text-white',
        dot:       'bg-green-500',
        icon:      '🟢',
        label:     'ALL CLEAR',
        ring:      'shadow-green-500/40',
      }
  }
}

// ─── Time ────────────────────────────────────────────────────────────────────
export function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

// ─── Location matching ────────────────────────────────────────────────────────
export function alertMatchesLocation(alertLocation: string, userLocation: string): boolean {
  if (!userLocation.trim()) return true
  const ul = userLocation.toLowerCase().trim()
  const al = alertLocation.toLowerCase()
  if (al.includes(ul) || ul.includes(al)) return true
  return ul.split(/\s+/).some(w => w.length > 2 && al.includes(w))
}

// ─── Severity rank for sorting ────────────────────────────────────────────────
const SEV_RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, WATCH: 2, NORMAL: 1 }
export function severityRank(s: string): number { return SEV_RANK[(s ?? '').toUpperCase()] ?? 0 }
export function sortBySeverity<T extends { severity: Severity | string }>(items: T[]): T[] {
  return [...items].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

// ─── Update category icon ─────────────────────────────────────────────────────
export function categoryIcon(category: string): string {
  const m: Record<string, string> = {
    ALERT: '⚡', BULLETIN: '📢', ROAD_UPDATE: '🚧',
    WEATHER_UPDATE: '🌧️', SAFETY: '🛡️', alert: '⚡',
    bulletin: '📢', road: '🚧', weather: '🌧️', safety: '🛡️', general: '📋',
  }
  return m[category] ?? '📋'
}

// ─── Cache staleness ──────────────────────────────────────────────────────────
export function isStale(cachedAt: string | undefined, maxAgeMinutes = 5): boolean {
  if (!cachedAt) return true
  return Date.now() - new Date(cachedAt).getTime() > maxAgeMinutes * 60_000
}

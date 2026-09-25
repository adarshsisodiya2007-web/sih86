/**
 * api.ts — All HTTP calls from the citizen mobile app to the VARSHANET backend.
 *
 * The app talks ONLY to /api/citizen/* endpoints.
 * No officer-only or authenticated endpoints are called here.
 *
 * Offline resilience: every function tries localStorage cache on network failure.
 */

import type {
  CitizenAlert,
  CitizenAlertDetail,
  CitizenUpdate,
  CitizenStatus,
  CachedData,
} from './types'

// ─── Config ───────────────────────────────────────────────────────────────────
// Detect if running inside native Capacitor wrapper or standalone mobile webview
const isNativeApp =
  typeof (window as any).Capacitor !== 'undefined' ||
  window.location.protocol === 'capacitor:' ||
  (window.location.protocol === 'https:' && window.location.hostname === 'localhost' && !window.location.port)

// Default IP when running APK on physical Android connected to PC on same Wi-Fi
export const DEFAULT_REMOTE_BACKEND = 'http://172.18.88.116:8000'

export function getActiveBackendUrl(): string {
  try {
    const custom = localStorage.getItem('vn_backend_url')
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '')
  } catch {}

  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '')
  }

  if (isNativeApp) {
    return DEFAULT_REMOTE_BACKEND
  }

  // Web browser development proxy
  return ''
}

export function setActiveBackendUrl(url: string): void {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem('vn_backend_url')
    } else {
      localStorage.setItem('vn_backend_url', url.trim())
    }
  } catch {}
}


// ─── Cache keys ───────────────────────────────────────────────────────────────
const CACHE = {
  alerts:       'vn_citizen_alerts',
  alertDetail:  (id: string) => `vn_citizen_alert_${id}`,
  updates:      'vn_citizen_updates',
  status:       'vn_citizen_status',
  notifications:'vn_citizen_notif',
  location:     'vn_citizen_location',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function saveCache<T>(key: string, data: T): void {
  try {
    const cached: CachedData<T> = { data, cachedAt: new Date().toISOString() }
    localStorage.setItem(key, JSON.stringify(cached))
  } catch { /* storage full or unavailable */ }
}

function loadCache<T>(key: string): CachedData<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CachedData<T>
  } catch { return null }
}

async function fetchJson<T>(url: string): Promise<T> {
  const base = getActiveBackendUrl()
  const fullUrl = `${base}${url}`
  const res = await fetch(fullUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetch citizen-facing alerts, optionally filtered by location string.
 * Falls back to cached data when offline.
 */
export async function getAlerts(location?: string): Promise<{
  alerts: CitizenAlert[]
  fromCache: boolean
  cachedAt?: string
}> {
  let url = '/api/citizen/alerts'
  if (location) url += `?location=${encodeURIComponent(location)}`

  try {
    const alerts = await fetchJson<CitizenAlert[]>(url)
    saveCache(CACHE.alerts, alerts)
    return { alerts, fromCache: false }
  } catch {
    const cached = loadCache<CitizenAlert[]>(CACHE.alerts)
    if (cached) return { alerts: cached.data, fromCache: true, cachedAt: cached.cachedAt }
    return { alerts: [], fromCache: true }
  }
}

/**
 * Fetch full detail for a single alert (includes safe shelters, emergency contacts).
 */
export async function getAlertDetail(alertId: string): Promise<CitizenAlertDetail | null> {
  try {
    const detail = await fetchJson<CitizenAlertDetail>(`/api/citizen/alerts/${alertId}`)
    saveCache(CACHE.alertDetail(alertId), detail)
    return detail
  } catch {
    const cached = loadCache<CitizenAlertDetail>(CACHE.alertDetail(alertId))
    return cached?.data ?? null
  }
}

/**
 * Fetch recent officer bulletins and updates.
 * Filtered by location if provided.
 */
export async function getUpdates(location?: string, limit = 20): Promise<{
  updates: CitizenUpdate[]
  fromCache: boolean
  cachedAt?: string
}> {
  let url = `/api/citizen/updates?limit=${limit}`
  if (location) url += `&location=${encodeURIComponent(location)}`

  try {
    const updates = await fetchJson<CitizenUpdate[]>(url)
    saveCache(CACHE.updates, updates)
    return { updates, fromCache: false }
  } catch {
    const cached = loadCache<CitizenUpdate[]>(CACHE.updates)
    if (cached) return { updates: cached.data, fromCache: true, cachedAt: cached.cachedAt }
    return { updates: [], fromCache: true }
  }
}

/**
 * Fetch the overall risk status card for the home screen.
 */
export async function getStatus(location?: string): Promise<{
  status: CitizenStatus | null
  fromCache: boolean
  cachedAt?: string
}> {
  let url = '/api/citizen/status'
  if (location) url += `?location=${encodeURIComponent(location)}`

  try {
    const status = await fetchJson<CitizenStatus>(url)
    saveCache(CACHE.status, status)
    return { status, fromCache: false }
  } catch {
    const cached = loadCache<CitizenStatus>(CACHE.status)
    if (cached) return { status: cached.data, fromCache: true, cachedAt: cached.cachedAt }
    return { status: null, fromCache: true }
  }
}

/**
 * Fetch only HIGH/CRITICAL alerts for notification polling.
 * Called every 25 seconds in background.
 */
export async function getNotifications(): Promise<CitizenAlert[]> {
  try {
    return await fetchJson<CitizenAlert[]>('/api/citizen/notifications/latest')
  } catch {
    return []
  }
}

/**
 * Save the citizen's selected location to localStorage.
 */
export function saveLocation(location: string): void {
  try { localStorage.setItem(CACHE.location, location) } catch {}
}

/**
 * Load the citizen's saved location from localStorage.
 */
export function loadLocation(): string {
  try { return localStorage.getItem(CACHE.location) ?? '' } catch { return '' }
}

/**
 * Returns the cache timestamp for the alerts cache, if available.
 */
export function getAlertsCacheTime(): string | null {
  const cached = loadCache<CitizenAlert[]>(CACHE.alerts)
  return cached?.cachedAt ?? null
}

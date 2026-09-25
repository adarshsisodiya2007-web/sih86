/**
 * useAppData.ts
 * Central data hook for the VARSHANET Citizen Mobile App.
 *
 * Responsibilities:
 *  - High-frequency 5s polling for instant officer alert dissemination.
 *  - Polls /api/citizen/alerts, /api/citizen/status, /api/citizen/updates.
 *  - Tracks online/offline state and localStorage cache.
 *  - Exposes refresh() for instant manual sync.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getAlerts,
  getUpdates,
  getStatus,
  getNotifications,
  loadLocation,
  saveLocation,
} from './api'
import { alertMatchesLocation, sortBySeverity } from './helpers'
import type { CitizenAlert, CitizenStatus, CitizenUpdate } from './types'

const POLL_INTERVAL  = 5_000   // 5 s — high-frequency polling for instant officer sync
const NOTIF_INTERVAL = 5_000   // 5 s — urgent alert polling

export interface AppData {
  allAlerts:           CitizenAlert[]
  filteredAlerts:      CitizenAlert[]
  updates:             CitizenUpdate[]
  status:              CitizenStatus | null
  notifications:       CitizenAlert[]

  isLoading:           boolean
  isOnline:            boolean
  fromCache:           boolean
  cachedAt:            string | undefined
  lastRefreshed:       Date | null

  selectedLocation:    string
  setSelectedLocation: (loc: string) => void

  refresh:             () => void
  dismissNotif:        (id: string) => void
}

export function useAppData(): AppData {
  const [allAlerts,         setAllAlerts]         = useState<CitizenAlert[]>([])
  const [filteredAlerts,    setFilteredAlerts]    = useState<CitizenAlert[]>([])
  const [updates,           setUpdates]           = useState<CitizenUpdate[]>([])
  const [status,            setStatus]            = useState<CitizenStatus | null>(null)
  const [notifications,     setNotifications]     = useState<CitizenAlert[]>([])
  const [isLoading,         setIsLoading]         = useState(true)
  const [isOnline,          setIsOnline]          = useState(navigator.onLine)
  const [fromCache,         setFromCache]         = useState(false)
  const [cachedAt,          setCachedAt]          = useState<string | undefined>()
  const [lastRefreshed,     setLastRefreshed]     = useState<Date | null>(null)
  const [selectedLocation,  _setSelectedLoc]      = useState<string>(loadLocation)

  const seenNotifIds = useRef<Set<string>>(new Set())

  // Online / offline tracking
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  refresh() }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Location update
  const setSelectedLocation = useCallback((loc: string) => {
    _setSelectedLoc(loc)
    saveLocation(loc)
  }, [])

  // Main data fetch using the backend's real location filtering
  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [alertsRes, allAlertsRes, updatesRes, statusRes] = await Promise.all([
        getAlerts(selectedLocation || undefined),
        getAlerts(), // unconstrained alerts for Area screen and Map overview
        getUpdates(selectedLocation || undefined),
        getStatus(selectedLocation || undefined),
      ])

      const sortedFiltered = sortBySeverity(alertsRes.alerts)
      setFilteredAlerts(sortedFiltered)
      setAllAlerts(sortBySeverity(allAlertsRes.alerts))
      setUpdates(updatesRes.updates)
      setStatus(statusRes.status)

      const anyFromCache = alertsRes.fromCache || updatesRes.fromCache || statusRes.fromCache
      setFromCache(anyFromCache)

      const ts = alertsRes.cachedAt ?? updatesRes.cachedAt ?? statusRes.cachedAt
      setCachedAt(ts)

      if (!anyFromCache) {
        setLastRefreshed(new Date())
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedLocation])

  // Notification polling for HIGH / CRITICAL alerts
  const pollNotifications = useCallback(async () => {
    const fresh = await getNotifications()
    const newOnes = fresh.filter(n => {
      if (seenNotifIds.current.has(n.id)) return false
      if (selectedLocation) {
        return alertMatchesLocation(n.location, selectedLocation) || n.severity === 'CRITICAL'
      }
      return true
    })

    if (newOnes.length > 0) {
      newOnes.forEach(n => seenNotifIds.current.add(n.id))
      setNotifications(prev => [...newOnes, ...prev].slice(0, 5))
      // Trigger vibration feedback if supported
      try {
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      } catch {}
    }
  }, [selectedLocation])

  // Fetch when location changes or on mount
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Periodic 5s polling for instant officer updates
  useEffect(() => {
    const dataTimer  = setInterval(fetchAll, POLL_INTERVAL)
    const notifTimer = setInterval(pollNotifications, NOTIF_INTERVAL)
    return () => {
      clearInterval(dataTimer)
      clearInterval(notifTimer)
    }
  }, [fetchAll, pollNotifications])

  const refresh = useCallback(() => {
    fetchAll()
    pollNotifications()
  }, [fetchAll, pollNotifications])

  const dismissNotif = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return {
    allAlerts,
    filteredAlerts,
    updates,
    status,
    notifications,
    isLoading,
    isOnline,
    fromCache,
    cachedAt,
    lastRefreshed,
    selectedLocation,
    setSelectedLocation,
    refresh,
    dismissNotif,
  }
}

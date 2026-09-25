/**
 * CitizenRadarMap.tsx
 * High-performance, citizen-friendly Leaflet Weather Radar Map
 * Displays city location, radar sweeps, convective storm cells, and active warning zones.
 */
import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { CitizenAlert } from '../types'

// City coordinate lookup
export const CITY_COORDS: Record<string, [number, number]> = {
  singrauli: [24.1997, 82.6645],
  rewa:      [24.5362, 81.3037],
  nagpur:    [21.1458, 79.0882],
  bhopal:    [23.2599, 77.4126],
  indore:    [22.7196, 75.8577],
  jabalpur:  [23.1815, 79.9864],
  mumbai:    [19.0760, 72.8777],
  pune:      [18.5204, 73.8567],
  kolkata:   [22.5726, 88.3639],
  delhi:     [28.6139, 77.2090],
  rewari:    [28.1920, 76.6180],
  patna:     [25.5941, 85.1376],
  dehradun:  [30.3165, 78.0322],
  siliguri:  [26.7271, 88.3953],
  jaipur:    [26.9124, 75.7873],
  hyderabad: [17.3850, 78.4867],
  ranchi:    [23.3441, 85.3096],
}

export function getCityLatLng(cityName?: string): [number, number] {
  if (!cityName) return [22.5, 79.5] // Default India center
  const clean = cityName.toLowerCase().trim()
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (clean.includes(key) || key.includes(clean)) return coords
  }
  return [22.5, 79.5]
}

interface StormCellData {
  cell_id: string
  name: string
  latitude: number
  longitude: number
  rain_rate_mmh: number
  intensity: string
  dbz_max: number
  hazards: string[]
}

interface Props {
  selectedLocation: string
  alerts: CitizenAlert[]
  onViewAlert?: (id: string) => void
  height?: string
}

export const CitizenRadarMap: React.FC<Props> = ({
  selectedLocation,
  alerts,
  onViewAlert,
  height = '240px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const initialCenter = getCityLatLng(selectedLocation)
      const initialZoom = selectedLocation ? 9 : 5

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      })

      // Base tile layer: CartoDB Dark Matter
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 18,
          subdomains: 'abcd',
        }
      ).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup
      mapInstanceRef.current = map
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        layerGroupRef.current = null
      }
    }
  }, [])

  // Switch Base Map Mode
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    const url =
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(url, { maxZoom: 18, subdomains: 'abcd' }).addTo(mapInstanceRef.current)

  }, [mapMode])

  // Center on Selected City and render alerts & cells
  useEffect(() => {
    const map = mapInstanceRef.current
    const lg = layerGroupRef.current
    if (!map || !lg) return

    lg.clearLayers()

    const cityCoords = getCityLatLng(selectedLocation)
    const zoomLevel = selectedLocation ? 9 : 6
    map.flyTo(cityCoords, zoomLevel, { duration: 1.2 })

    // 1. Citizen Location Pin
    if (selectedLocation) {
      const pingHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400 opacity-60 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_#22d3ee]"></div>
        </div>
      `
      const icon = L.divIcon({
        html: pingHtml,
        className: 'custom-ping-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker(cityCoords, { icon })
        .addTo(lg)
        .bindPopup(`<b>📍 Your Location: ${selectedLocation}</b>`, { closeButton: false })
    }

    // 2. Render Active Alert Zones
    alerts.forEach(alert => {
      const coords = getCityLatLng(alert.location)
      const isCritical = alert.severity === 'CRITICAL'
      const color = isCritical ? '#ef4444' : '#f97316'

      const circle = L.circle(coords, {
        color: color,
        fillColor: color,
        fillOpacity: 0.35,
        radius: 22000, // 22 km radius warning polygon
        weight: 2,
      }).addTo(lg)

      circle.bindPopup(`
        <div style="font-family: monospace; color: #0f172a; padding: 2px;">
          <b style="color: ${color};">🚨 ${alert.severity} WARNING</b><br/>
          <b>${alert.title}</b><br/>
          <small>📍 ${alert.location}</small><br/>
          <p style="font-size: 11px; margin: 4px 0;">${alert.message}</p>
        </div>
      `)

      if (onViewAlert) {
        circle.on('click', () => onViewAlert(alert.id))
      }
    })

    // 3. Fetch & Render Real-time Storm Convective Cells
    fetch('/api/storm-cells')
      .then(res => (res.ok ? res.json() : []))
      .then((cells: StormCellData[]) => {
        if (!mapInstanceRef.current || !lg) return
        cells.forEach(c => {
          const latlng: [number, number] = [c.latitude, c.longitude]
          const isHeavy = c.rain_rate_mmh > 40
          const cellColor = isHeavy ? '#ef4444' : c.rain_rate_mmh > 20 ? '#eab308' : '#38bdf8'

          const cellCircle = L.circle(latlng, {
            color: cellColor,
            fillColor: cellColor,
            fillOpacity: 0.25,
            radius: 18000,
            weight: 1.5,
            dashArray: '4, 4',
          }).addTo(lg)

          cellCircle.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #0f172a;">
              <b style="color: ${cellColor};">⚡ Convective Cell ${c.cell_id}</b><br/>
              <b>${c.name}</b><br/>
              Rain Rate: <b>${c.rain_rate_mmh.toFixed(1)} mm/h</b><br/>
              Max Reflectivity: <b>${c.dbz_max.toFixed(1)} dBZ</b>
            </div>
          `)
        })
      })
      .catch(() => {})
  }, [selectedLocation, alerts, onViewAlert])

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 h-auto' : ''
      }`}
      style={{ height: isExpanded ? 'calc(100% - 32px)' : height }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#060a14]" />

      {/* Top Map HUD Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-[400] pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b1329]/90 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold shadow-lg pointer-events-auto backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>DOPPLER RADAR FUSION</span>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Layer Mode Toggle */}
          <button
            onClick={() => setMapMode(m => (m === 'dark' ? 'satellite' : 'dark'))}
            className="px-2 py-1 rounded-lg bg-[#0b1329]/90 border border-slate-700 text-slate-300 hover:text-cyan-300 font-mono text-[10px] font-bold shadow backdrop-blur-md cursor-pointer"
          >
            {mapMode === 'dark' ? '🛰️ SATELLITE' : '🗺️ RADAR'}
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(e => !e)}
            className="px-2 py-1 rounded-lg bg-[#0b1329]/90 border border-slate-700 text-slate-300 hover:text-cyan-300 font-mono text-[10px] font-bold shadow backdrop-blur-md cursor-pointer"
          >
            {isExpanded ? '✕ CLOSE' : '⛶ EXPAND'}
          </button>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#0b1329]/80 border border-slate-800 text-[10px] font-mono text-slate-300 z-[400] pointer-events-none backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Alert Zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Storm Cell
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Your Area
          </span>
        </div>
        <span className="text-slate-400">{selectedLocation || 'India Grid'}</span>
      </div>
    </div>
  )
}

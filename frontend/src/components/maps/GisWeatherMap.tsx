import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useWeather } from '../../context/WeatherContext';
import {
  Layers,
  Eye,
  EyeOff,
  Zap,
  CloudRain,
  Flame,
  Wind,
  Navigation,
  Compass,
  RotateCcw,
  RotateCw,
  Sliders,
  Crosshair,
  Plus,
  Minus,
  Box,
  Satellite,
  Mountain,
  Globe
} from 'lucide-react';

interface GisWeatherMapProps {
  height?: string;
  showControls?: boolean;
}

type BaseMapType = 'satellite' | 'terrain' | 'esri' | 'dark';

const BASE_MAPS: Record<BaseMapType, { name: string; label: string; url: string; options: L.TileLayerOptions }> = {
  satellite: {
    name: 'Google Satellite',
    label: 'Google Satellite (Hybrid)',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Satellite'
    }
  },
  terrain: {
    name: 'Google Terrain',
    label: 'Google Terrain & Relief',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Terrain'
    }
  },
  esri: {
    name: 'Esri Satellite',
    label: 'Esri World Imagery HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  },
  dark: {
    name: 'Dark Radar Canvas',
    label: 'Tactical Dark GIS',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri Canvas'
    }
  }
};

export const GisWeatherMap: React.FC<GisWeatherMapProps> = ({
  height = '520px',
  showControls = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Basemap State - Defaults to high-resolution Google Satellite Hybrid
  const [baseMap, setBaseMap] = useState<BaseMapType>('satellite');
  const [showBaseMapMenu, setShowBaseMapMenu] = useState<boolean>(false);

  // 3D Perspective States (Mobile Map Style)
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [pitch, setPitch] = useState<number>(52); // Tilt angle in degrees (0° flat, 65° steep)
  const [bearing, setBearing] = useState<number>(-8); // Rotation angle in degrees (-180° to 180°)
  const [showPitchSlider, setShowPitchSlider] = useState<boolean>(false);

  const layerGroupsRef = useRef<{
    stormCells: L.LayerGroup;
    polygons: L.LayerGroup;
    trajectories: L.LayerGroup;
    lightning: L.LayerGroup;
    radarRings: L.LayerGroup;
  }>({
    stormCells: L.layerGroup(),
    polygons: L.layerGroup(),
    trajectories: L.layerGroup(),
    lightning: L.layerGroup(),
    radarRings: L.layerGroup()
  });

  const {
    stormCells,
    selectedCell,
    setSelectedCell,
    lightningFlashes,
    selectedRegion,
    regions,
    layers,
    toggleLayer,
    systemMode
  } = useWeather();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const match = regions.find(r => r.name === selectedRegion);
    const initialCenter: [number, number] = match
      ? [match.latitude, match.longitude]
      : [21.1458, 79.0882];
    const initialZoom = 7.5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Initial Base Tile Layer (Google Satellite Hybrid)
    const initialConfig = BASE_MAPS[baseMap];
    const tileLayer = L.tileLayer(initialConfig.url, initialConfig.options).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Add layer groups on top of base tiles
    layerGroupsRef.current.polygons.addTo(map);
    layerGroupsRef.current.trajectories.addTo(map);
    layerGroupsRef.current.radarRings.addTo(map);
    layerGroupsRef.current.stormCells.addTo(map);
    layerGroupsRef.current.lightning.addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer dynamically when baseMap switches
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const config = BASE_MAPS[baseMap];
    const newLayer = L.tileLayer(config.url, config.options).addTo(map);
    newLayer.bringToBack();
    baseTileLayerRef.current = newLayer;
  }, [baseMap]);

  // Invalidate map size when 3D mode or container changes to ensure smooth tile coverage
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [is3DMode, pitch, bearing]);

  // Pan / Zoom when selectedRegion changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const match = regions.find(r => r.name === selectedRegion);
    if (match) {
      mapInstanceRef.current.flyTo([match.latitude, match.longitude], 7.5, {
        duration: 1.2
      });
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [selectedRegion, regions]);

  // Render & Update Active Storm Cells, Hazard Polygons, Trajectories
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { stormCells: cellGroup, polygons: polyGroup, trajectories: trajGroup } = layerGroupsRef.current;
    cellGroup.clearLayers();
    polyGroup.clearLayers();
    trajGroup.clearLayers();

    if (!layers.stormCells && !layers.hazardPolygons && !layers.vectors) return;

    stormCells.forEach((cell) => {
      const isSelected = selectedCell?.cell_id === cell.cell_id;
      const isSevere = cell.intensity === 'severe';
      const isHigh = cell.intensity === 'high';
      const isElevated = cell.intensity === 'elevated';

      const color = isSevere ? '#ef4444' : isHigh ? '#f97316' : isElevated ? '#eab308' : '#38bdf8';
      const fillColor = isSevere ? 'rgba(239, 68, 68, 0.45)' : isHigh ? 'rgba(249, 115, 22, 0.38)' : 'rgba(234, 179, 8, 0.3)';

      // 1. Hazard Polygons
      if (layers.hazardPolygons && cell.polygon_coords.length > 0) {
        const poly = L.polygon(cell.polygon_coords as [number, number][], {
          color: color,
          weight: isSelected ? 2.8 : 1.8,
          opacity: 0.95,
          fillColor: fillColor,
          fillOpacity: 0.45,
          dashArray: isSevere ? undefined : '4, 4'
        });

        poly.on('click', () => setSelectedCell(cell));
        polyGroup.addLayer(poly);
      }

      // 2. Trajectory Movement Vectors & Future Points
      if (layers.vectors && cell.trajectory_points.length > 1) {
        const line = L.polyline(cell.trajectory_points as [number, number][], {
          color: color,
          weight: 2.5,
          dashArray: '5, 6',
          opacity: 0.85
        });
        trajGroup.addLayer(line);

        // Project +1h, +2h, +3h waypoint circles
        cell.trajectory_points.slice(1, 4).forEach((pt, idx) => {
          const ptMarker = L.circleMarker(pt as [number, number], {
            radius: 3.5,
            color: color,
            fillColor: '#0f172a',
            fillOpacity: 0.9,
            weight: 1.8
          }).bindTooltip(`+${idx + 1}H ETA: ${cell.cell_id}`, {
            direction: 'top',
            className: 'bg-slate-900 text-[10px] text-slate-100 border border-slate-700 px-1 py-0.5'
          });
          trajGroup.addLayer(ptMarker);
        });
      }

      // 3. Storm Cell Core Marker (2D Flat vs 3D Extruded Convective Column)
      if (layers.stormCells) {
        // Vertical column height calculated relative to storm echo top (e.g., 10-18 km)
        const columnHeightPx = Math.min(Math.max(Math.round(cell.echo_top_km * 2.5), 24), 48);

        const iconHtml = is3DMode ? `
          <div class="relative flex flex-col items-center justify-end cursor-pointer group" style="transform: translate3d(0, 0, 0); pointer-events: auto;">
            <!-- Floating Convective Anvil / High-Altitude Radar Core -->
            <div class="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style="margin-bottom: ${columnHeightPx}px; filter: drop-shadow(0 0 12px ${color});">
              <span class="absolute w-10 h-10 rounded-full ${isSevere ? 'bg-red-500/50 animate-ping' : 'bg-amber-500/40'}"></span>
              <div class="w-8 h-8 rounded-full flex flex-col items-center justify-center text-[10px] font-bold font-mono text-white border-2 shadow-2xl ${
                isSelected ? 'ring-4 ring-cyan-400 scale-125' : ''
              }" style="background: radial-gradient(circle, ${color} 45%, #090d16 100%); border-color: rgba(255,255,255,0.95);">
                <span>${cell.dbz_max.toFixed(0)}</span>
              </div>
              
              <!-- Floating 3D Altitude Callout -->
              <div class="absolute -top-6 whitespace-nowrap px-1.5 py-0.5 bg-slate-950/95 border border-cyan-400/80 rounded-full text-[9px] font-mono text-cyan-300 font-bold shadow-xl flex items-center space-x-1">
                <span class="text-amber-400">▲</span>
                <span>${cell.echo_top_km} km</span>
              </div>
            </div>

            <!-- Vertical 3D Convective Updraft Column -->
            <div class="w-1.5 rounded-full absolute bottom-4 opacity-90" style="height: ${columnHeightPx}px; background: linear-gradient(to top, rgba(15,23,42,0.1), ${color}); box-shadow: 0 0 12px ${color};"></div>

            <!-- Ground Footprint / Drop Shadow on Satellite Terrain -->
            <div class="w-10 h-4 rounded-full border border-dashed opacity-85" style="background: radial-gradient(ellipse, ${fillColor} 45%, transparent 80%); border-color: ${color}; transform: scaleY(0.5); box-shadow: 0 0 14px ${color};"></div>
            
            <!-- Ground Centroid Label -->
            <div class="whitespace-nowrap px-1 py-0.2 bg-slate-950/95 border border-slate-700 rounded text-[9px] font-mono text-cyan-300 font-semibold shadow-md mt-0.5">
              ${cell.cell_id}
            </div>
          </div>
        ` : `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute w-8 h-8 rounded-full ${isSevere ? 'bg-red-500/40 animate-ping' : 'bg-amber-500/30'}"></span>
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white border ${
              isSelected ? 'ring-2 ring-cyan-400 scale-125' : ''
            }" style="background-color: ${color}; border-color: rgba(255,255,255,0.9);">
              ${cell.dbz_max.toFixed(0)}
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 bg-slate-950/90 border border-slate-800 rounded text-[9px] font-mono text-cyan-300 font-semibold shadow-md">
              ${cell.cell_id}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'storm-marker',
          iconSize: is3DMode ? [40, 75] : [24, 24],
          iconAnchor: is3DMode ? [20, 65] : [12, 12]
        });

        const marker = L.marker([cell.latitude, cell.longitude], { icon: customIcon });

        const popupContent = `
          <div class="p-2.5 font-mono text-xs text-slate-100 bg-[#0b1120] rounded-lg">
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-2">
              <span class="font-bold text-cyan-400 text-sm">${cell.cell_id}: ${cell.name}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-sm" style="background-color: ${color}">
                ${cell.intensity}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-300 text-[11px]">
              <div>Max dBZ: <strong class="text-white">${cell.dbz_max} dBZ</strong></div>
              <div>VIL: <strong class="text-white">${cell.vil_kgm2} kg/m²</strong></div>
              <div>Echo Top: <strong class="text-cyan-300">${cell.echo_top_km} km</strong></div>
              <div>Speed: <strong class="text-white">${cell.speed_kmh} km/h (${cell.movement_deg}°)</strong></div>
              <div>Hail Prob: <strong class="text-amber-400">${cell.hail_prob}%</strong></div>
              <div>Cloudburst: <strong class="text-red-400">${cell.cloudburst_risk}%</strong></div>
              <div>Downburst: <strong class="text-cyan-400">${cell.wind_gust_kmh} km/h</strong></div>
              <div>ETA: <strong class="text-emerald-400">${cell.eta_minutes} min</strong></div>
            </div>
            <div class="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Confidence: ${cell.confidence}%</span>
              <span>Updated: ${cell.detected_at}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });
        marker.on('click', () => setSelectedCell(cell));
        cellGroup.addLayer(marker);
      }
    });
  }, [stormCells, selectedCell, layers, is3DMode, setSelectedCell]);

  // Render & Update Lightning Flashes
  useEffect(() => {
    const { lightning: ltgGroup } = layerGroupsRef.current;
    ltgGroup.clearLayers();

    if (!layers.lightning) return;

    lightningFlashes.forEach((flash) => {
      const isCG = flash.flash_type === 'CG';
      const color = isCG ? '#38bdf8' : '#c084fc';

      const iconHtml = is3DMode ? `
        <div class="relative flex flex-col items-center justify-end">
          <div class="w-0.5 h-6 bg-gradient-to-t from-cyan-300 via-sky-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-pulse"></div>
          <span class="w-2.5 h-2.5 rounded-full shadow-lg -mt-1" style="background-color: ${color}; box-shadow: 0 0 10px ${color};"></span>
        </div>
      ` : `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-60"></span>
          <span class="w-2 h-2 rounded-full shadow-lg" style="background-color: ${color}; box-shadow: 0 0 8px ${color};"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'lightning-marker',
        iconSize: is3DMode ? [10, 26] : [8, 8],
        iconAnchor: is3DMode ? [5, 26] : [4, 4]
      });

      const marker = L.marker([flash.latitude, flash.longitude], { icon: customIcon });
      marker.bindTooltip(
        `⚡ ${flash.flash_id} [${flash.flash_type}] ${flash.peak_current_ka} kA`,
        { direction: 'right', className: 'bg-slate-900 text-[10px] font-mono text-cyan-300 border border-slate-700' }
      );
      ltgGroup.addLayer(marker);
    });
  }, [lightningFlashes, layers.lightning, is3DMode]);

  // Render Radar Range Rings around selected region
  useEffect(() => {
    const { radarRings: ringsGroup } = layerGroupsRef.current;
    ringsGroup.clearLayers();

    if (!layers.radar) return;

    const match = regions.find(r => r.name === selectedRegion);
    if (!match) return;

    [100, 180, 250].forEach((radiusKm) => {
      const ring = L.circle([match.latitude, match.longitude], {
        radius: radiusKm * 1000,
        color: '#38bdf8',
        weight: 1.5,
        dashArray: '3, 6',
        opacity: 0.5,
        fillColor: '#0284c7',
        fillOpacity: 0.03
      });
      ringsGroup.addLayer(ring);
    });
  }, [selectedRegion, regions, layers.radar]);

  // Mobile Map Style Control Handlers
  const toggle3D = useCallback(() => {
    if (is3DMode) {
      setIs3DMode(false);
      setPitch(0);
      setBearing(0);
    } else {
      setIs3DMode(true);
      setPitch(52);
      setBearing(-8);
    }
  }, [is3DMode]);

  const resetBearing = useCallback(() => {
    setBearing(0);
  }, []);

  const handleRotate = useCallback((delta: number) => {
    setBearing(prev => {
      let next = (prev + delta) % 360;
      if (next > 180) next -= 360;
      if (next < -180) next += 360;
      return next;
    });
  }, []);

  const handleZoom = useCallback((delta: number) => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(current + delta);
  }, []);

  const centerOnSevere = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const severeCell = stormCells.find(c => c.intensity === 'severe') || stormCells[0];
    if (severeCell) {
      mapInstanceRef.current.flyTo([severeCell.latitude, severeCell.longitude], 8.5, {
        duration: 1
      });
      setSelectedCell(severeCell);
    }
  }, [stormCells, setSelectedCell]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#060911]" style={{ perspective: '1100px', perspectiveOrigin: '50% 65%' }}>
      {/* 3D Atmospheric Vanishing Horizon Haze (Active in 3D Mode) */}
      {is3DMode && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060911] via-[#060911]/85 to-transparent z-[999] flex flex-col items-center justify-start pt-2.5">
          <div className="text-[10px] font-mono tracking-wider text-cyan-400/90 uppercase flex items-center space-x-2 bg-slate-950/90 px-3 py-1 rounded-full border border-cyan-500/40 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold">3D SATELLITE PERSPECTIVE</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">TILT: {pitch}°</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">AZIMUTH: {bearing}°</span>
          </div>
        </div>
      )}

      {/* Map Inner Container (CSS 3D Transformed) */}
      {/* In 3D mode the container is oversized (180%×170%) and re-centered so that after
          CSS rotateX/rotateZ perspective, map tiles cover every corner with no black voids. */}
      <div
        className="w-full transition-all"
        style={{
          height: is3DMode ? '170%' : '100%',
          width: is3DMode ? '180%' : '100%',
          marginLeft: is3DMode ? '-40%' : '0%',
          marginTop: is3DMode ? '-18%' : '0%',
          transform: is3DMode ? `rotateX(${pitch}deg) rotateZ(${bearing}deg)` : 'none',
          transformOrigin: '50% 60%',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), margin 0.4s ease, width 0.4s ease, height 0.4s ease'
        }}
      >
        <div ref={mapContainerRef} style={{ height }} className="w-full" />
      </div>

      {/* Top Left: Operational GIS & Basemap Selector Bar */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl text-xs font-mono flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-100 font-semibold">{selectedRegion}</span>
        </div>
        <span className="text-slate-700">|</span>
        {systemMode === 'LIVE_DATA' ? (
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              LIVE DATA
            </span>
            <span className="text-slate-400">
              Meteo & Radar Mosaics Live • INSAT: <span className="text-emerald-400 font-bold">LIVE</span> • DWR: <span className="text-amber-400 font-bold">AUTH REQUIRED</span>
            </span>
          </div>
        ) : (
          <>
            <div className="text-[11px] text-slate-300">
              TRACKING: <span className="text-cyan-400 font-bold">{stormCells.length}</span> CELLS
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-[11px] text-slate-300 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{lightningFlashes.length} FLASHES</span>
            </div>
          </>
        )}
        <span className="text-slate-700">|</span>
        {/* Basemap Quick Selector */}
        <div className="flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setBaseMap('satellite')}
            title="Google Satellite Imagery with Cities and Roads"
            className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 transition-all ${
              baseMap === 'satellite'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Satellite className="w-2.5 h-2.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBaseMap('terrain')}
            title="Google Terrain & Physical Relief"
            className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 transition-all ${
              baseMap === 'terrain'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mountain className="w-2.5 h-2.5" />
            <span>Terrain</span>
          </button>
          <button
            onClick={() => setBaseMap('dark')}
            title="Dark Cartographic Canvas"
            className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 transition-all ${
              baseMap === 'dark'
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-2.5 h-2.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* FLOATING MOBILE MAP 3D & SATELLITE HUD (Right Side) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end space-y-2">
        {/* Layer Switcher Button & Dropdown */}
        {showControls && (
          <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg p-1.5 shadow-2xl flex flex-col space-y-1">
            <div className="text-[9px] font-mono uppercase text-slate-400 tracking-wider px-1 pb-1 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>GIS Layers</span>
              </span>
            </div>

            <button
              onClick={() => toggleLayer('stormCells')}
              className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layers.stormCells ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-1 mr-2">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Storms</span>
              </span>
              {layers.stormCells ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>

            <button
              onClick={() => toggleLayer('hazardPolygons')}
              className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layers.hazardPolygons ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-1 mr-2">
                <CloudRain className="w-3 h-3 text-amber-400" />
                <span>Polygons</span>
              </span>
              {layers.hazardPolygons ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>

            <button
              onClick={() => toggleLayer('lightning')}
              className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layers.lightning ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-1 mr-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>Lightning</span>
              </span>
              {layers.lightning ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>

            <button
              onClick={() => toggleLayer('vectors')}
              className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layers.vectors ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-1 mr-2">
                <Navigation className="w-3 h-3 text-blue-400" />
                <span>Vectors</span>
              </span>
              {layers.vectors ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>
          </div>
        )}

        {/* MOBILE MAP 3D FLOATING HUD WIDGET */}
        <div className="bg-slate-900/95 backdrop-blur border border-slate-800/90 rounded-xl p-2 shadow-2xl flex flex-col items-center space-y-2">
          {/* 3D / 2D Quick Toggle Pill (Just like Google Maps Mobile) */}
          <button
            onClick={toggle3D}
            title={is3DMode ? "Switch to 2D Top-Down" : "Switch to 3D Perspective"}
            className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center font-mono font-bold transition-all shadow-lg active:scale-95 ${
              is3DMode
                ? 'bg-gradient-to-tr from-cyan-600 to-sky-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <Box className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-none">{is3DMode ? '3D' : '2D'}</span>
          </button>

          {/* Interactive Rotating Compass Needle (Click resets North) */}
          <button
            onClick={resetBearing}
            title={`Bearing: ${bearing}°. Click to Reset North`}
            className="w-9 h-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition-all active:scale-95 group shadow-md"
          >
            <div
              className="relative w-5 h-5 flex items-center justify-center transition-transform duration-300"
              style={{ transform: `rotate(${-bearing}deg)` }}
            >
              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[8px] border-b-red-500 absolute top-0"></div>
              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[8px] border-t-slate-300 absolute bottom-0"></div>
              <span className="text-[7px] font-mono font-black text-red-400 absolute -top-1">N</span>
            </div>
          </button>

          {/* Basemap Switcher Icon & Flyout */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBaseMapMenu(!showBaseMapMenu);
                if (showPitchSlider) setShowPitchSlider(false);
              }}
              title="Switch Satellite / Terrain / Dark Basemap"
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                showBaseMapMenu ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <Satellite className="w-4 h-4" />
            </button>

            {/* Basemap Selection Flyout (Docked neatly to the left of the button) */}
            {showBaseMapMenu && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 z-[1010] bg-slate-900/98 backdrop-blur border border-slate-700 rounded-xl p-2.5 shadow-2xl w-60 space-y-1.5 font-mono text-xs animate-in fade-in duration-200">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center space-x-1">
                  <Satellite className="w-3 h-3 text-cyan-400" />
                  <span>Select Satellite / Base Map</span>
                </div>
                {(['satellite', 'terrain', 'esri', 'dark'] as BaseMapType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setBaseMap(type);
                      setShowBaseMapMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all ${
                      baseMap === type
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{BASE_MAPS[type].label}</span>
                    {baseMap === type && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Pitch/Tilt Slider Drawer Toggle & Panel */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPitchSlider(!showPitchSlider);
                if (showBaseMapMenu) setShowBaseMapMenu(false);
              }}
              title="Adjust 3D Tilt & Angle"
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                showPitchSlider ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Expanded 3D Pitch & Camera Angle Adjustment Panel (Docked neatly to the left) */}
            {showPitchSlider && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 z-[1010] bg-slate-900/98 backdrop-blur border border-slate-700 rounded-xl p-3 shadow-2xl w-64 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-cyan-400 flex items-center space-x-1">
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Camera Controls</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{pitch}° Pitch</span>
                </div>

                {/* Pitch (Tilt) Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Camera Pitch</span>
                    <span className="text-white">{pitch}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="65"
                    value={pitch}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPitch(val);
                      if (val > 0 && !is3DMode) setIs3DMode(true);
                      if (val === 0 && is3DMode) setIs3DMode(false);
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>0° Flat (2D)</span>
                    <span>45° Standard</span>
                    <span>65° Deep 3D</span>
                  </div>
                </div>

                {/* Quick Angle Preset Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => { setPitch(0); setIs3DMode(false); }}
                    className={`py-1 rounded text-[10px] font-semibold border ${
                      pitch === 0 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Top-Down
                  </button>
                  <button
                    onClick={() => { setPitch(42); setIs3DMode(true); }}
                    className={`py-1 rounded text-[10px] font-semibold border ${
                      pitch === 42 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Tactical 42°
                  </button>
                  <button
                    onClick={() => { setPitch(60); setIs3DMode(true); }}
                    className={`py-1 rounded text-[10px] font-semibold border ${
                      pitch === 60 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Mobile 60°
                  </button>
                </div>

                {/* Azimuth / Camera Bearing Rotation Controls */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Heading Azimuth</span>
                    <span className="text-cyan-300">{bearing}°</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleRotate(-15)}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1 text-[10px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>-15°</span>
                    </button>
                    <button
                      onClick={resetBearing}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-red-400 font-bold border border-slate-700 text-[10px]"
                    >
                      North
                    </button>
                    <button
                      onClick={() => handleRotate(15)}
                      className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1 text-[10px]"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>+15°</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zoom In / Zoom Out Controls */}
          <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden bg-slate-800/90">
            <button
              onClick={() => handleZoom(1)}
              title="Zoom In"
              className="w-9 h-8 hover:bg-slate-700 flex items-center justify-center text-slate-200 border-b border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              title="Zoom Out"
              className="w-9 h-8 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Center on Severe Cell */}
          <button
            onClick={centerOnSevere}
            title="Focus Severe Core"
            className="w-9 h-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-amber-400 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Reflectivity Color Bar (dBZ Scale) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-300 mb-1">
          <span className="font-semibold text-slate-200">RADAR REFLECTIVITY OVER SATELLITE (dBZ)</span>
          <span className="text-[9px] text-cyan-400 font-bold">HIGH-RES GIS</span>
        </div>
        <div className="flex h-2.5 rounded overflow-hidden w-full sm:w-80 shadow-inner">
          <div className="flex-1 bg-cyan-700" title="20-30 dBZ: Light Rain"></div>
          <div className="flex-1 bg-emerald-600" title="30-40 dBZ: Moderate Rain"></div>
          <div className="flex-1 bg-yellow-500" title="40-50 dBZ: Heavy Rain"></div>
          <div className="flex-1 bg-orange-500" title="50-55 dBZ: Intense Storm"></div>
          <div className="flex-1 bg-red-600" title="55-65 dBZ: Severe Convection / Hail"></div>
          <div className="flex-1 bg-purple-600" title=">65 dBZ: Severe Hail / Cloudburst Core"></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-300 mt-0.5">
          <span>20</span>
          <span>30</span>
          <span>40</span>
          <span>50</span>
          <span>55</span>
          <span>65+</span>
        </div>
      </div>
    </div>
  );
};

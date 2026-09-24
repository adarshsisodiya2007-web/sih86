import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useWeather } from '../../context/WeatherContext';
import { StormCell, HazardType } from '../../types';
import {
  Layers,
  Eye,
  EyeOff,
  Zap,
  CloudRain,
  Flame,
  Wind,
  Navigation,
  Compass
} from 'lucide-react';

interface GisWeatherMapProps {
  height?: string;
  showControls?: boolean;
}

export const GisWeatherMap: React.FC<GisWeatherMapProps> = ({
  height = '520px',
  showControls = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
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
    toggleLayer
  } = useWeather();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on selected region or Nagpur initially
    const match = regions.find(r => r.name === selectedRegion);
    const initialCenter: [number, number] = match
      ? [match.latitude, match.longitude]
      : [21.1458, 79.0882];
    const initialZoom = 7.5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false
    });

    // Dark cartographic tiles (Esri World Dark Gray Canvas - standard for operational GIS weather centers)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri',
    }).addTo(map);

    // Add layer groups
    layerGroupsRef.current.polygons.addTo(map);
    layerGroupsRef.current.trajectories.addTo(map);
    layerGroupsRef.current.radarRings.addTo(map);
    layerGroupsRef.current.stormCells.addTo(map);
    layerGroupsRef.current.lightning.addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size to guarantee tiles fit container
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

      const color = isSevere ? '#ef4444' : isHigh ? '#f97316' : isElevated ? '#eab308' : '#3b82f6';
      const fillColor = isSevere ? 'rgba(239, 68, 68, 0.35)' : isHigh ? 'rgba(249, 115, 22, 0.3)' : 'rgba(234, 179, 8, 0.25)';

      // 1. Hazard Polygons
      if (layers.hazardPolygons && cell.polygon_coords.length > 0) {
        const poly = L.polygon(cell.polygon_coords as [number, number][], {
          color: color,
          weight: isSelected ? 2.5 : 1.5,
          opacity: 0.9,
          fillColor: fillColor,
          fillOpacity: 0.4,
          dashArray: isSevere ? undefined : '4, 4'
        });

        poly.on('click', () => setSelectedCell(cell));
        polyGroup.addLayer(poly);
      }

      // 2. Trajectory Movement Vectors & Future Points
      if (layers.vectors && cell.trajectory_points.length > 1) {
        const line = L.polyline(cell.trajectory_points as [number, number][], {
          color: color,
          weight: 2,
          dashArray: '5, 6',
          opacity: 0.75
        });
        trajGroup.addLayer(line);

        // Project +1h, +2h, +3h waypoint circles
        cell.trajectory_points.slice(1, 4).forEach((pt, idx) => {
          const ptMarker = L.circleMarker(pt as [number, number], {
            radius: 3,
            color: color,
            fillColor: '#0f172a',
            fillOpacity: 0.8,
            weight: 1.5
          }).bindTooltip(`+${idx + 1}H ETA: ${cell.cell_id}`, {
            direction: 'top',
            className: 'bg-slate-900 text-[10px] text-slate-200 border border-slate-700 px-1 py-0.5'
          });
          trajGroup.addLayer(ptMarker);
        });
      }

      // 3. Storm Cell Core Marker
      if (layers.stormCells) {
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute w-8 h-8 rounded-full ${isSevere ? 'bg-red-500/30 animate-ping' : 'bg-amber-500/20'}"></span>
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white border ${
              isSelected ? 'ring-2 ring-cyan-400 scale-125' : ''
            }" style="background-color: ${color}; border-color: rgba(255,255,255,0.7);">
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
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([cell.latitude, cell.longitude], { icon: customIcon });

        const popupContent = `
          <div class="p-2 font-mono text-xs">
            <div class="flex items-center justify-between pb-1 border-b border-slate-700 mb-1.5">
              <span class="font-bold text-cyan-400">${cell.cell_id}: ${cell.name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white" style="background-color: ${color}">
                ${cell.intensity}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 text-[11px]">
              <div>Max dBZ: <strong class="text-white">${cell.dbz_max} dBZ</strong></div>
              <div>VIL: <strong class="text-white">${cell.vil_kgm2} kg/m²</strong></div>
              <div>Echo Top: <strong class="text-white">${cell.echo_top_km} km</strong></div>
              <div>Speed: <strong class="text-white">${cell.speed_kmh} km/h (${cell.movement_deg}°)</strong></div>
              <div>Hail Prob: <strong class="text-amber-400">${cell.hail_prob}%</strong></div>
              <div>Cloudburst: <strong class="text-red-400">${cell.cloudburst_risk}%</strong></div>
              <div>Downburst: <strong class="text-cyan-400">${cell.wind_gust_kmh} km/h</strong></div>
              <div>ETA: <strong class="text-emerald-400">${cell.eta_minutes} min</strong></div>
            </div>
            <div class="mt-2 text-[10px] text-slate-400 italic">
              Confidence: ${cell.confidence}% • Updated: ${cell.detected_at}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });
        marker.on('click', () => setSelectedCell(cell));
        cellGroup.addLayer(marker);
      }
    });
  }, [stormCells, selectedCell, layers, setSelectedCell]);

  // Render & Update Lightning Flashes
  useEffect(() => {
    const { lightning: ltgGroup } = layerGroupsRef.current;
    ltgGroup.clearLayers();

    if (!layers.lightning) return;

    lightningFlashes.forEach((flash) => {
      const isCG = flash.flash_type === 'CG';
      const color = isCG ? '#38bdf8' : '#c084fc';

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-60"></span>
          <span class="w-2 h-2 rounded-full shadow-lg" style="background-color: ${color}; box-shadow: 0 0 8px ${color};"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'lightning-marker',
        iconSize: [8, 8],
        iconAnchor: [4, 4]
      });

      const marker = L.marker([flash.latitude, flash.longitude], { icon: customIcon });
      marker.bindTooltip(
        `⚡ ${flash.flash_id} [${flash.flash_type}] ${flash.peak_current_ka} kA`,
        { direction: 'right', className: 'bg-slate-900 text-[10px] font-mono text-cyan-300 border border-slate-700' }
      );
      ltgGroup.addLayer(marker);
    });
  }, [lightningFlashes, layers.lightning]);

  // Render Radar Range Rings around selected region
  useEffect(() => {
    const { radarRings: ringsGroup } = layerGroupsRef.current;
    ringsGroup.clearLayers();

    if (!layers.radar) return;

    const match = regions.find(r => r.name === selectedRegion);
    if (!match) return;

    // Draw 100km, 150km, 250km radar surveillance range rings
    [100, 180, 250].forEach((radiusKm) => {
      const ring = L.circle([match.latitude, match.longitude], {
        radius: radiusKm * 1000,
        color: '#0284c7',
        weight: 1,
        dashArray: '3, 6',
        opacity: 0.35,
        fillColor: '#0369a1',
        fillOpacity: 0.02
      });
      ringsGroup.addLayer(ring);
    });
  }, [selectedRegion, regions, layers.radar]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#060911]">
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full" />

      {/* Top Left: Operational GIS Status Bar (Simulation Mode) */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl text-xs font-mono flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-200 font-semibold">{selectedRegion}</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="text-[11px] text-slate-400">
          TRACKING: <span className="text-cyan-400 font-bold">{stormCells.length}</span> DEMO CELLS
        </div>
        <span className="text-slate-600">|</span>
        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>{lightningFlashes.length} SIM FLASHES</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50">
          SIMULATED GIS
        </span>
      </div>

      {/* Top Right: Layer Switcher Toolbar */}
      {showControls && (
        <div className="absolute top-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-lg p-2 shadow-2xl flex flex-col space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider px-1 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>GIS Layers</span>
            </span>
          </div>

          <button
            onClick={() => toggleLayer('stormCells')}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
              layers.stormCells ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Storm Cells</span>
            </span>
            {layers.stormCells ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
          </button>

          <button
            onClick={() => toggleLayer('hazardPolygons')}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
              layers.hazardPolygons ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <CloudRain className="w-3 h-3 text-amber-400" />
              <span>Hazard Envelopes</span>
            </span>
            {layers.hazardPolygons ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
          </button>

          <button
            onClick={() => toggleLayer('lightning')}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
              layers.lightning ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Total Lightning</span>
            </span>
            {layers.lightning ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
          </button>

          <button
            onClick={() => toggleLayer('vectors')}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
              layers.vectors ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Navigation className="w-3 h-3 text-blue-400" />
              <span>Movement Vectors</span>
            </span>
            {layers.vectors ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
          </button>

          <button
            onClick={() => toggleLayer('radar')}
            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
              layers.radar ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Wind className="w-3 h-3 text-emerald-400" />
              <span>Radar Coverage Rings</span>
            </span>
            {layers.radar ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
          </button>
        </div>
      )}

      {/* Bottom Reflectivity Color Bar (dBZ Scale) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-xl font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="font-semibold text-slate-300">SIMULATED RADAR REFLECTIVITY SCALE (dBZ)</span>
          <span className="text-[9px] text-cyan-400">DWR PROTOTYPE SIM</span>
        </div>
        <div className="flex h-2.5 rounded overflow-hidden w-full sm:w-80 shadow-inner">
          <div className="flex-1 bg-cyan-700" title="20-30 dBZ: Light Rain"></div>
          <div className="flex-1 bg-emerald-600" title="30-40 dBZ: Moderate Rain"></div>
          <div className="flex-1 bg-yellow-500" title="40-50 dBZ: Heavy Rain"></div>
          <div className="flex-1 bg-orange-500" title="50-55 dBZ: Intense Storm"></div>
          <div className="flex-1 bg-red-600" title="55-65 dBZ: Severe Convection / Hail"></div>
          <div className="flex-1 bg-purple-600" title=">65 dBZ: Severe Hail / Cloudburst Core"></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
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

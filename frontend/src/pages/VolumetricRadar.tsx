import React, { useState, useEffect, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Box,
  Layers,
  Rotate3d,
  Sliders,
  Sparkles,
  Activity,
  Maximize2,
  Compass,
  Zap,
  Flame,
  Shield
} from 'lucide-react';

export const VolumetricRadar: React.FC = () => {
  const { stormCells, selectedCell, setSelectedCell } = useWeather();
  const [sliceAltitudeKm, setSliceAltitudeKm] = useState<number>(4.5); // 0°C Freezing level default
  const [rotationAngleDeg, setRotationAngleDeg] = useState<number>(35);
  const [tiltAngleDeg, setTiltAngleDeg] = useState<number>(25);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeCell = selectedCell || stormCells[0] || {
    cell_id: 'C-1042',
    name: 'Supercell Alpha (Nagpur NE)',
    dbz_max: 63.5,
    echo_top_km: 15.6,
    vil_kgm2: 49.0,
    cape_jkg: 2950,
    hail_prob: 82,
    cloudburst_risk: 76,
    wind_gust_kmh: 92
  };

  // Auto-rotation loop
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setRotationAngleDeg((prev) => (prev + 0.8) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isRotating]);

  // 3D Isometric / Orthographic Atmospheric Column Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Deep space dark background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const baseY = height - 90;
    const maxAltitudeKm = 18;
    const columnHeightPx = height - 160;

    // Convert angles to radians
    const radRot = (rotationAngleDeg * Math.PI) / 180;
    const radTilt = (tiltAngleDeg * Math.PI) / 180;

    // 1. Draw Ground Base Plate Grid (0 km altitude)
    const gridSize = 160;
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let x = -gridSize; x <= gridSize; x += 40) {
      const p1x = centerX + (x * Math.cos(radRot));
      const p1y = baseY + (x * Math.sin(radRot) * Math.sin(radTilt));
      ctx.beginPath();
      ctx.moveTo(p1x - (gridSize * Math.sin(radRot)), p1y + (gridSize * Math.cos(radRot) * Math.sin(radTilt)));
      ctx.lineTo(p1x + (gridSize * Math.sin(radRot)), p1y - (gridSize * Math.cos(radRot) * Math.sin(radTilt)));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Altitude Reference Axis Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 170, baseY);
    ctx.lineTo(centerX - 170, baseY - columnHeightPx);
    ctx.stroke();

    // Altitude Ticks (0, 3, 6, 9, 12, 15, 18 km)
    for (let km = 0; km <= 18; km += 3) {
      const y = baseY - (km / maxAltitudeKm) * columnHeightPx;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`${km} km`, centerX - 210, y + 3);
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(centerX - 175, y);
      ctx.lineTo(centerX + 160, y);
      ctx.stroke();
    }

    // 3. Render Atmospheric Convective Slices (from 0 to 16 km)
    const totalSlices = 18;
    for (let s = 0; s <= totalSlices; s++) {
      const altKm = (s / totalSlices) * activeCell.echo_top_km;
      const yPos = baseY - (altKm / maxAltitudeKm) * columnHeightPx;

      // Slice radius varies realistically with altitude (anvil expansion at top, narrow neck)
      let radius = 70;
      if (altKm < 3) radius = 55; // Base boundary layer
      else if (altKm <= 8) radius = 80; // Main core
      else if (altKm <= 13) radius = 110; // Expanding Anvil
      else radius = 45; // Overshooting top dome

      // Color based on dBZ at this altitude
      let fillColor = 'rgba(16, 185, 129, 0.2)'; // Green light
      if (altKm >= 3 && altKm <= 9) {
        fillColor = 'rgba(239, 68, 68, 0.45)'; // Intense Red Updraft Core (>55 dBZ)
      } else if (altKm > 9 && altKm <= 14) {
        fillColor = 'rgba(192, 132, 252, 0.35)'; // High-altitude ice anvil
      } else if (altKm > 14) {
        fillColor = 'rgba(6, 182, 212, 0.4)'; // Cirrus dome
      }

      // Draw ellipse slice rotated
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(centerX, yPos, radius, radius * 0.4 * Math.cos(radTilt), radRot, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw Updraft Core cylinder center if inside 3-8 km
      if (altKm >= 3 && altKm <= 8) {
        ctx.fillStyle = 'rgba(192, 132, 252, 0.6)';
        ctx.beginPath();
        ctx.ellipse(centerX, yPos, 28, 28 * 0.4 * Math.cos(radTilt), radRot, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Highlight User Selected Altitude Slice plane
    const userSliceY = baseY - (sliceAltitudeKm / maxAltitudeKm) * columnHeightPx;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.beginPath();
    ctx.ellipse(centerX, userSliceY, 130, 130 * 0.4 * Math.cos(radTilt), radRot, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Slice Marker Tag
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`◄ SLICE: ${sliceAltitudeKm.toFixed(1)} KM (CAPPI CROSS-SECTION)`, centerX + 138, userSliceY + 4);

    // 5. Freezing Level Marker (0°C Isotherm at 4.5 km)
    const freezingY = baseY - (4.5 / maxAltitudeKm) * columnHeightPx;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX - 160, freezingY);
    ctx.lineTo(centerX + 160, freezingY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px monospace';
    ctx.fillText('0°C FREEZING ISOTHERM (HAIL TRIGGER LEVEL)', centerX - 160, freezingY - 4);
  }, [rotationAngleDeg, tiltAngleDeg, sliceAltitudeKm, activeCell]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Box className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
              3D VOLUMETRIC ATMOSPHERIC RADAR CELL VISUALIZER
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              CAPPI / RHI DUAL-AXIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Volumetric Doppler reconstruction revealing convective core height, freezing isotherm, anvil spread, and overshooting top.
          </p>
        </div>

        {/* Cell Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Target Cell:</span>
          <select
            value={activeCell.cell_id}
            onChange={(e) => {
              const match = stormCells.find(c => c.cell_id === e.target.value);
              if (match) setSelectedCell(match);
            }}
            className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {stormCells.map((c) => (
              <option key={c.cell_id} value={c.cell_id}>
                {c.cell_id}: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left 3D Canvas, Right Altitude Controls & Dual-Pol Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): 3D Volumetric Canvas & Interactive Rotation */}
        <div className="lg:col-span-8 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Rotate3d className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                VOLUMETRIC RECONSTRUCTION: {activeCell.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  isRotating ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isRotating ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: PAUSED'}
              </button>
            </div>
          </div>

          {/* 3D Canvas Container */}
          <div className="relative flex justify-center bg-[#030712] rounded-xl border border-slate-800 p-2 overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={640}
              height={440}
              className="w-full max-w-[640px] h-[340px] sm:h-[440px] rounded-lg"
            />
            {/* Overlay 3D Angle Indicator */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-cyan-400">
              AZ: {rotationAngleDeg.toFixed(0)}° • TILT: {tiltAngleDeg}°
            </div>
          </div>

          {/* Orbit Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>MANUAL AZIMUTH ROTATION</span>
                <span className="text-cyan-400">{rotationAngleDeg.toFixed(0)}°</span>
              </div>
              <input
                type="range" min="0" max="360" step="2"
                value={rotationAngleDeg}
                onChange={(e) => {
                  setIsRotating(false);
                  setRotationAngleDeg(parseFloat(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>CAMERA ELEVATION TILT</span>
                <span className="text-cyan-400">{tiltAngleDeg}°</span>
              </div>
              <input
                type="range" min="10" max="75" step="1"
                value={tiltAngleDeg}
                onChange={(e) => setTiltAngleDeg(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Slice Analysis & Dual-Pol Readout */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Altitude Slicing Controller */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>VERTICAL SLICING (CAPPI)</span>
              </span>
              <span className="text-cyan-400 font-bold">{sliceAltitudeKm} km</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <input
                type="range" min="0.5" max="17.0" step="0.5"
                value={sliceAltitudeKm}
                onChange={(e) => setSliceAltitudeKm(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 km (Surface)</span>
                <span>4.5 km (0°C)</span>
                <span>16 km (Top)</span>
              </div>
            </div>

            {/* Quick Slices */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { label: 'Surface (1km)', val: 1.0 },
                { label: 'Hail Zone (4.5km)', val: 4.5 },
                { label: 'Anvil (12km)', val: 12.0 }
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSliceAltitudeKm(s.val)}
                  className={`p-2 rounded text-center text-[10px] font-mono cursor-pointer transition-colors border ${
                    sliceAltitudeKm === s.val
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual-Polarization Atmospheric Readout */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>DUAL-POL PARAMETERS</span>
              <span className="text-emerald-400 text-[10px]">Dual-Pol Active</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Differential Reflectivity (Z_DR):</span>
                <span className="text-cyan-400 font-bold">-0.8 dB (Hail signature)</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Specific Diff. Phase (K_DP):</span>
                <span className="text-white font-bold">4.2 °/km (Cloudburst rate)</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Correlation Coeff (ρ_HV):</span>
                <span className="text-amber-400 font-bold">0.88 (Mixed-phase hydrometeors)</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Max Echo Top Altitude:</span>
                <span className="text-purple-400 font-bold">{activeCell.echo_top_km} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

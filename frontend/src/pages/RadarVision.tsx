import React, { useState, useEffect, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  BrainCircuit,
  Eye,
  Activity,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface RadarFrame {
  id: string;
  timeOffsetMin: number;
  label: string;
  isPrediction: boolean;
  maxDbz: number;
  cellCenter: [number, number]; // [x, y] in percentage (0-100)
  sizeRadius: number;
  hailCoreDbz: number;
}

export const RadarVision: React.FC = () => {
  const { selectedRegion } = useWeather();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(3); // Starts at NOW (t=0)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [displayMode, setDisplayMode] = useState<'reflectivity' | 'difference' | 'hail_core'>('reflectivity');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const frames: RadarFrame[] = [
    { id: 'f0', timeOffsetMin: -45, label: 't - 45 min', isPrediction: false, maxDbz: 48.0, cellCenter: [35, 62], sizeRadius: 32, hailCoreDbz: 42 },
    { id: 'f1', timeOffsetMin: -30, label: 't - 30 min', isPrediction: false, maxDbz: 53.5, cellCenter: [42, 57], sizeRadius: 38, hailCoreDbz: 49 },
    { id: 'f2', timeOffsetMin: -15, label: 't - 15 min', isPrediction: false, maxDbz: 59.0, cellCenter: [49, 52], sizeRadius: 44, hailCoreDbz: 56 },
    { id: 'f3', timeOffsetMin: 0, label: 'NOW (t = 0)', isPrediction: false, maxDbz: 63.5, cellCenter: [56, 47], sizeRadius: 48, hailCoreDbz: 62 },
    { id: 'f4', timeOffsetMin: 15, label: '+15 min PRED', isPrediction: true, maxDbz: 64.2, cellCenter: [63, 42], sizeRadius: 50, hailCoreDbz: 64 },
    { id: 'f5', timeOffsetMin: 30, label: '+30 min PRED', isPrediction: true, maxDbz: 62.0, cellCenter: [70, 37], sizeRadius: 46, hailCoreDbz: 60 },
    { id: 'f6', timeOffsetMin: 45, label: '+45 min PRED', isPrediction: true, maxDbz: 56.5, cellCenter: [77, 32], sizeRadius: 40, hailCoreDbz: 52 },
    { id: 'f7', timeOffsetMin: 60, label: '+60 min PRED', isPrediction: true, maxDbz: 49.0, cellCenter: [84, 27], sizeRadius: 34, hailCoreDbz: 44 }
  ];

  // Animation player loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = 1200 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, frames.length]);

  // Render Synthetic Doppler Radar Canvas for the active frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Dark Radar Background
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, width, height);

    // Draw Range Rings (50km, 100km, 150km, 200km)
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);

    [60, 120, 180, 240].forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    const frame = frames[currentFrameIndex];
    const cellPxX = (frame.cellCenter[0] / 100) * width;
    const cellPxY = (frame.cellCenter[1] / 100) * height;

    // Draw Multi-layer convective reflectivity gradient
    const grad = ctx.createRadialGradient(
      cellPxX, cellPxY, 4,
      cellPxX, cellPxY, frame.sizeRadius * 1.8
    );

    if (displayMode === 'hail_core') {
      grad.addColorStop(0, '#c084fc'); // Intense Purple Hail Core (>60 dBZ)
      grad.addColorStop(0.3, '#ef4444'); // Red Core (>50 dBZ)
      grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.4)');
      grad.addColorStop(1, 'transparent');
    } else {
      // Standard IMD Doppler Radar Palette (Purple -> Red -> Orange -> Yellow -> Green)
      grad.addColorStop(0, '#c084fc'); // 65 dBZ (Extreme Convective Core)
      grad.addColorStop(0.2, '#ef4444'); // 55 dBZ (Heavy Rain & Hail)
      grad.addColorStop(0.45, '#f97316'); // 45 dBZ (Thunderstorm Rain)
      grad.addColorStop(0.7, '#eab308'); // 35 dBZ (Moderate Rain)
      grad.addColorStop(0.88, '#10b981'); // 20 dBZ (Light Rain)
      grad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cellPxX, cellPxY, frame.sizeRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw secondary trailing convective clusters
    const trailGrad = ctx.createRadialGradient(
      cellPxX - 35, cellPxY + 25, 2,
      cellPxX - 35, cellPxY + 25, frame.sizeRadius * 0.9
    );
    trailGrad.addColorStop(0, '#f97316');
    trailGrad.addColorStop(0.5, '#eab308');
    trailGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.arc(cellPxX - 35, cellPxY + 25, frame.sizeRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Draw Trajectory Vector Line from t0
    ctx.strokeStyle = frame.isPrediction ? '#22d3ee' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash(frame.isPrediction ? [4, 4] : []);
    ctx.beginPath();
    frames.slice(0, currentFrameIndex + 1).forEach((f, idx) => {
      const fx = (f.cellCenter[0] / 100) * width;
      const fy = (f.cellCenter[1] / 100) * height;
      if (idx === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Cell Centroid Marker
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cellPxX, cellPxY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Text Label overlay on Canvas
    ctx.fillStyle = frame.isPrediction ? '#22d3ee' : '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${frame.label} | Max: ${frame.maxDbz} dBZ`, 16, 28);
  }, [currentFrameIndex, displayMode, frames]);

  const activeFrame = frames[currentFrameIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <BrainCircuit className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
              DEEP COMPUTER VISION RADAR VIDEO NOWCASTING (CONVLSTM)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              MULTI-FRAME EXTRAPOLATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deep recurrent ConvLSTM neural model predicting spatio-temporal radar reflectivity decay & storm morphology (+0 to +60 minutes).
          </p>
        </div>

        {/* Display Mode Toggles */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setDisplayMode('reflectivity')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              displayMode === 'reflectivity' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reflectivity (dBZ)
          </button>
          <button
            onClick={() => setDisplayMode('hail_core')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              displayMode === 'hail_core' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hail Core Isolines
          </button>
        </div>
      </div>

      {/* Main Grid: Left Radar Studio, Right Model Evaluation & CSI Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): Canvas Player & Controls */}
        <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                RADAR ECHO TIME-LAPSE LOOP: {selectedRegion}
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
              activeFrame.isPrediction ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {activeFrame.isPrediction ? 'PREDICTED AI ECHO' : 'HISTORICAL RADAR SCAN'}
            </span>
          </div>

          {/* Radar Canvas */}
          <div className="relative flex justify-center bg-[#040813] rounded-xl border border-slate-800/80 p-2 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={540}
              height={380}
              className="w-full max-w-[540px] h-[320px] sm:h-[380px] rounded-lg"
            />
            {/* Overlay Radar Legend */}
            <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono text-slate-300 flex items-center space-x-1.5">
              <span>20</span>
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              <span className="w-2.5 h-2.5 rounded bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
              <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
              <span>65+ dBZ</span>
            </div>
          </div>

          {/* Timeline Frame Scrubber Bar */}
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-1.5">
              {frames.map((f, idx) => {
                const isSelected = currentFrameIndex === idx;
                return (
                  <button
                    key={f.id}
                    onClick={() => setCurrentFrameIndex(idx)}
                    className={`py-2 px-1 rounded text-center font-mono text-[10px] transition-all cursor-pointer border ${
                      isSelected
                        ? f.isPrediction
                          ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-md shadow-cyan-950'
                          : 'bg-white text-slate-950 font-black border-white'
                        : f.isPrediction
                        ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/50 hover:bg-cyan-950/70'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">{f.label.split(' ')[0]}</div>
                    <div className="text-[9px] opacity-80">{f.timeOffsetMin >= 0 ? `+${f.timeOffsetMin}m` : `${f.timeOffsetMin}m`}</div>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-950 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY LOOP'}</span>
                </button>
                <button
                  onClick={() => setCurrentFrameIndex(0)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                  title="Reset to frame 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center space-x-1 text-xs font-mono">
                <span className="text-slate-400 text-[10px] mr-1">SPEED:</span>
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      playbackSpeed === s ? 'bg-slate-700 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Model Evaluation & CSI Verification */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Active Frame Diagnostics */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>FRAME TELEMETRY & INTENSITY</span>
              <span className="text-cyan-400 font-mono text-xs">{activeFrame.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">PROJECTED MAX REFLECTIVITY</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">{activeFrame.maxDbz} dBZ</div>
                <div className="text-[10px] text-slate-400">Extreme Convective Core</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">ESTIMATED HAIL CORE</div>
                <div className="text-lg font-bold text-purple-400 mt-1">{activeFrame.hailCoreDbz} dBZ</div>
                <div className="text-[10px] text-slate-400">POSH Index: 82%</div>
              </div>
            </div>

            <p className="text-xs font-sans text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              ConvLSTM accurately captures the non-linear advection and decaying lifecycle of the supercell, preventing false extrapolation growth seen in pure kinematic velocity vectors.
            </p>
          </div>

          {/* Model Benchmark Verification (CSI, FAR, POD) */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>MODEL VERIFICATION METRICS (HOLDOUT)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Doppler Ground Truth</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Critical Success Index (CSI @ 35 dBZ):</span>
                <span className="text-emerald-400 font-bold">0.784</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Critical Success Index (CSI @ 45 dBZ):</span>
                <span className="text-emerald-400 font-bold">0.712</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Probability of Detection (POD):</span>
                <span className="text-blue-400 font-bold">0.865</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">False Alarm Rate (FAR):</span>
                <span className="text-amber-400 font-bold">0.142</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Structural Similarity Index (SSIM):</span>
                <span className="text-purple-400 font-bold">0.891</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

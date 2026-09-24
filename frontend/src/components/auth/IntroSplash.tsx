import React, { useState, useEffect } from 'react';
import { Radio, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
  durationMs?: number;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({
  onComplete,
  durationMs = 4500
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    { text: 'INITIALIZING VARSHANET RADAR FUSION ENGINE...', sub: 'Establishing Dual-Pol S-Band Doppler link' },
    { text: 'CALIBRATING INSAT-3D THERMAL IR & GLDN ARRAYS...', sub: 'TIR1 10.8µm & Cloud-to-Ground flash sync' },
    { text: 'ENGAGING 5-MODEL MACHINE LEARNING ENSEMBLE...', sub: 'Stacking Super-Ensemble active (95.8% R²)' },
    { text: 'SYSTEM ARMED • SECURE OPERATIONAL GATEWAY READY', sub: 'Hyper-local 0–6 hour nowcast grid synchronized' }
  ];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct < 28) setCurrentStep(0);
      else if (pct < 58) setCurrentStep(1);
      else if (pct < 88) setCurrentStep(2);
      else setCurrentStep(3);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        clearInterval(interval);
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [durationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] flex flex-col items-center justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Background Radial Glow & Radar Sweep */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Rotating Background Radar Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <div className="w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full border border-cyan-500/20 border-dashed animate-[spin_40s_linear_infinite]"></div>
        <div className="w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full border border-cyan-400/30"></div>
        <div className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] rounded-full border border-cyan-400/40 border-dotted"></div>
      </div>

      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-5xl z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="font-mono text-xs text-cyan-300 tracking-widest uppercase">
            OPERATIONAL BOOT SEQUENCE • SIH 2026
          </span>
        </div>
        
        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-lg"
          title="Skip intro animation"
        >
          <span>SKIP INTRO</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Hero: Animated Pulsing Logo Showcase */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 space-y-7">
        
        {/* Radar Rings & Logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer Ripple Wave 1 */}
          <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-cyan-500/30 animate-ping opacity-30"></div>
          
          {/* Outer Ripple Wave 2 */}
          <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-blue-400/40 animate-pulse"></div>

          {/* Glowing Aura */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 opacity-60 blur-2xl animate-pulse"></div>

          {/* Circular Cropped Logo Container */}
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full p-1.5 bg-[#050b18] border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.6)] flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="VARSHANET Logo"
              className="w-full h-full object-cover rounded-full transform hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Rotating Radar Sweep Needle */}
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border-t-2 border-cyan-400/80 animate-[spin_3s_linear_infinite] pointer-events-none"></div>
        </div>

        {/* Project Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
            VARSHANET
          </h1>
          <p className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold tracking-wider uppercase">
            Severe Convective Weather Intelligence System
          </p>
        </div>

        {/* Dynamic Telemetry Status Line */}
        <div className="min-h-[48px] text-center max-w-md px-4">
          <div className="text-xs sm:text-sm font-mono font-bold text-slate-100 flex items-center justify-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>{steps[currentStep].text}</span>
          </div>
          <div className="text-[11px] font-mono text-cyan-400/80 mt-1">
            {steps[currentStep].sub}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar & Telemetry Details */}
      <div className="w-full max-w-xl z-10 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>CALIBRATION SEQUENCE</span>
          </span>
          <span className="font-bold text-cyan-400">{progress}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-100 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
          <span>MINISTRY OF EARTH SCIENCES • IMD SPECIFICATION</span>
          <span>PRESS ESC TO SKIP</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  CloudLightning,
  Shield,
  Layers,
  Activity,
  Cpu,
  ArrowRight,
  Compass,
  CheckCircle,
  Globe2
} from 'lucide-react';
import { NavTab } from '../components/layout/Sidebar';

interface LandingPageProps {
  onEnter: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden p-6 sm:p-12">
      {/* Background Animated Gradient / Radar Sweep effect */}
      <div className="absolute inset-0 bg-[#070b14] -z-20"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-900/15 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-900/15 blur-[140px] -z-10 pointer-events-none"></div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-8">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>SMART INDIA HACKATHON 2026 • SIH26084</span>
        </div>

        {/* Official VARSHANET Logo Showcase */}
        <div className="flex justify-center pt-2">
          <div className="relative group">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-70 blur-xl group-hover:opacity-95 transition duration-500"></div>
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-[#060b16] border-2 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="VARSHANET Official Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white flex items-center justify-center space-x-4">
            <span>VARSHANET</span>
          </h1>
          <p className="text-xl sm:text-2xl font-mono text-cyan-400 font-semibold tracking-wide">
            Convective Weather Intelligence & 0–6 Hour Nowcasting
          </p>
          <p className="text-base sm:text-lg text-slate-300 italic max-w-2xl mx-auto pt-2">
            "Detect early. Predict locally. Warn before impact."
          </p>
        </div>

        {/* Operational Scope Banner */}
        {/* Operational Scope Banner */}
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          VARSHANET is an AI-assisted nowcasting prototype designed to fuse Doppler Weather Radar, INSAT-3D thermal IR, 
          ground lightning detection networks, and automatic weather stations to deliver hyper-local (target 1–3 km resolution) 
          simulation-based early warnings for severe thunderstorms, damaging hail, cloudbursts, and microburst downbursts.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onEnter('mission_control')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-cyan-900/40 border border-cyan-400/40 transition-all hover:scale-105 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>ENTER MISSION CONTROL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEnter('architecture')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-mono font-medium text-sm flex items-center justify-center space-x-2 border border-slate-700 transition-all hover:border-slate-600 cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>VIEW SYSTEM ARCHITECTURE</span>
          </button>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mt-12 mb-6">
        <div className="bg-[#0b1120]/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-base font-mono font-bold text-white mb-1.5">0–6 Hour Prototype Grid</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Temporal extrapolations at target 1–3 km spatial resolution powered by TITAN/SCIT-style kinematic cell 
            advection and dynamic lifecycle decaying models.
          </p>
        </div>

        <div className="bg-[#0b1120]/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-base font-mono font-bold text-white mb-1.5">Multi-Source Data Fusion</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Coherent spatial-temporal alignment of Doppler reflectivity (dBZ), VIL, cloud-top brightness 
            cooling (ΔT / Δt), and total lightning flash density.
          </p>
        </div>

        <div className="bg-[#0b1120]/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-base font-mono font-bold text-white mb-1.5">Explainable Risk Engine</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transparent physical factor attribution (POSH, Cloudburst Potential Index CPI, downburst proxy) 
            engineered for disaster management authorities.
          </p>
        </div>
      </div>

      {/* Scientific Honesty Disclaimer Footer */}
      <div className="max-w-4xl mx-auto text-center border-t border-slate-800/80 pt-4 text-[11px] font-mono text-slate-500 space-y-1">
        <p>
          <strong className="text-slate-400">Notice:</strong> VARSHANET is an AI-assisted nowcasting prototype with an explainable scoring engine. 
          Currently operating in verified simulation mode ready for direct plug-in of real Doppler radar, INSAT, and AWS feeds.
        </p>
      </div>
    </div>
  );
};

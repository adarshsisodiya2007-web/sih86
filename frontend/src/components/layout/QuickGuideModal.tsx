import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Clock,
  BrainCircuit,
  BellRing,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  // Close on Escape key press and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b1120] border-2 border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/90 overflow-hidden flex flex-col my-auto max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#0b1120]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider">
                VARSHANET Quick Guide & System Tour
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                30-second walkthrough to understand the dashboard easily
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close guide"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Summary Banner */}
          <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs font-sans text-cyan-200 leading-relaxed">
            <strong className="text-white font-mono">VARSHANET KYA HAI? </strong>
            Ye ek 0–6 ghante ka mausam early warning system hai jo <strong>badal phatne, olay girne aur aandhi</strong> aane se pehle
            hi warning deta hai taaki log aur disaster teams pehle hi safe ho sakein.
          </div>

          {/* 4 Step Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Step 1: Weather Map */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>LIVE WEATHER MAP</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Map par red/orange circles <strong>toofan ke badal</strong> hain:
              </p>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside font-sans">
                <li><strong className="text-red-400">Red Circle</strong>: Severe Storm / Olay</li>
                <li><strong className="text-orange-400">Orange Circle</strong>: Heavy Rain / Toofan</li>
                <li><strong className="text-cyan-400">Blue Arrow</strong>: Toofan kis taraf ja raha hai</li>
              </ul>
            </div>

            {/* Step 2: Nowcast Timeline & ETA */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
                <Clock className="w-3.5 h-3.5" />
                <span>0–6H TIMELINE & ETA</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Neeche di gayi timeline agle 6 ghante ka countdown dikhati hai:
              </p>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside font-sans">
                <li><strong>ETA (e.g. 14m)</strong>: Toofan kitne minute me zameen par pohchega</li>
                <li><strong>Timeline Bar</strong>: Slide karke dekhein toofan kab shant hoga</li>
              </ul>
            </div>

            {/* Step 3: AI & Machine Learning Suite */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center space-x-2 text-purple-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">3</span>
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>5-MODEL AI & ML SUITE</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                System me 5 trained AI models hain:
              </p>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside font-sans">
                <li><strong>Stacking Super-Ensemble</strong>: 95.8% R² Accuracy</li>
                <li><strong>Deep Neural Network (MLP)</strong>: 1ms Ultra-Fast Deep Learning</li>
                <li><strong>Leaderboard</strong>: Har model ka live vote side-by-side dekhein</li>
              </ul>
            </div>

            {/* Step 4: Emergency Alerts */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px]">4</span>
                <BellRing className="w-3.5 h-3.5" />
                <span>DISASTER ALERTS (CAP 1.2)</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                NDMA aur administration ke standard alerts:
              </p>
              <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside font-sans">
                <li><strong>Directives</strong>: Aam logo ke liye safe rahne ki instructions</li>
                <li><strong>Siren Alarms</strong>: High danger par automatic sound bajta hai</li>
              </ul>
            </div>
          </div>

          {/* Quick Glossary (Common Technical Terms in Plain English) */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-mono font-bold text-slate-200 uppercase tracking-wider">
              QUICK GLOSSARY: JARGON TO PLAIN ENGLISH
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <div className="text-cyan-400 font-bold text-[11px]">dBZ (Reflectivity)</div>
                <div className="text-[10px] text-slate-400 font-sans">Barish & Olay kitne ghane hain (&gt;55 = Khatarnak)</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <div className="text-cyan-400 font-bold text-[11px]">CAPE (Energy)</div>
                <div className="text-[10px] text-slate-400 font-sans">Toofan ka fuel / updraft energy</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <div className="text-cyan-400 font-bold text-[11px]">Echo Top (Height)</div>
                <div className="text-[10px] text-slate-400 font-sans">Badal aasman me kitna uncha hai (12-16 km)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span className="text-[11px] font-mono text-slate-400">
            Tip: Top-right se apni region (Nagpur, Mumbai, Kolkata) select karein.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>GOT IT, EXPLORE DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

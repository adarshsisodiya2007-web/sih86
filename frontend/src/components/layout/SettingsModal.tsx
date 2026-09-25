import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Smartphone,
  Volume2,
  VolumeX,
  ExternalLink,
  Sliders,
  Shield,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorId?: string;
  onOpenCitizenPortal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  operatorId = 'IMD-RADAR-OP-84',
  onOpenCitizenPortal
}) => {
  const {
    isAudioAlertEnabled,
    setIsAudioAlertEnabled,
    selectedRegion,
    systemMode,
    setSystemMode
  } = useWeather();

  const [activeTab, setActiveTab] = useState<'general' | 'citizen' | 'audio'>('citizen');

  // Escape key and body scroll lock
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
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b1120] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/50 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">
                Terminal & System Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure radar console preferences, audio sirens & citizen dissemination views
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`pb-3 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'citizen'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>CITIZEN ACCESS & PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>OPERATIONAL PREFERENCES</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-3 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>AUDIO & SIREN</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: CITIZEN ACCESS & PREVIEW (Main user request) */}
          {activeTab === 'citizen' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-700">
                        PUBLIC CITIZEN SAFETY PORTAL (PWA)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">1–3 km Hyper-local</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      Dedicated Citizen Weather Warning View
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Preview the simplified, jargon-free citizen interface built for farmers, panchayats, and rural communities. Features bilingual audio alerts, countdown clocks, safe shelters, and 1-tap crowdsourced ground reports.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCitizenPortal();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>OPEN CITIZEN DASHBOARD (SEPARATE VIEW)</span>
                  </button>

                  <a
                    href="#citizen_portal"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    title="Open Citizen PWA in a new browser tab"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px]">CURRENT TARGET REGION</div>
                  <div className="text-white font-bold">{selectedRegion}</div>
                  <div className="text-[10px] text-emerald-400">● Geofence Active (Cell Broadcast)</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="text-slate-400 text-[10px]">DISSEMINATION GATEWAY</div>
                  <div className="text-white font-bold">NDMA SACHET / CAP-CP v1.2</div>
                  <div className="text-[10px] text-cyan-400">SMS, WhatsApp & PWA Broadcast Ready</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL OPERATIONAL PREFERENCES */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-white">SYSTEM OPERATIONAL MODE</div>
                    <div className="text-[11px] text-slate-400">Switch between Live External Telemetry and High-Density Simulation</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    systemMode === 'LIVE_DATA' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {systemMode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <button
                    onClick={() => setSystemMode('LIVE_DATA')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                      systemMode === 'LIVE_DATA'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    LIVE DATA MODE
                  </button>
                  <button
                    onClick={() => setSystemMode('SIMULATION')}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                      systemMode === 'SIMULATION'
                        ? 'bg-amber-600/30 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    SIMULATION DEMO MODE
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold text-white">OPERATOR IDENTIFIER</div>
                  <div className="text-[11px] text-slate-400">Current authenticated forecaster terminal session</div>
                </div>
                <div className="font-mono text-xs text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  {operatorId}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & SIREN PREFERENCES */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold text-white">AUTOMATIC AUDIO WARNING CHIME</div>
                  <div className="text-[11px] text-slate-400">Play an audible warning chime when high-reflectivity severe convective cells enter sector</div>
                </div>

                <button
                  onClick={() => setIsAudioAlertEnabled(!isAudioAlertEnabled)}
                  className={`p-2 rounded-xl transition-all cursor-pointer border ${
                    isAudioAlertEnabled
                      ? 'bg-cyan-600 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {isAudioAlertEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed font-mono">
                ℹ️ Audio warnings conform to IMD / MoES Operational Alert Standards and provide localized voice announcements in regional dialects on the Citizen PWA view.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

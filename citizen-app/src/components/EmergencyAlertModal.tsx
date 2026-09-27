import React, { useState, useEffect } from 'react'
import type { CitizenAlert } from '../types'

interface Props {
  alert: CitizenAlert
  onClose: () => void
}

export const EmergencyAlertModal: React.FC<Props> = ({ alert, onClose }) => {
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false)
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)

  const stopSiren = () => {
    if (audioCtx) {
      try {
        audioCtx.close()
      } catch (_) {}
      setAudioCtx(null)
    }
    setIsSirenPlaying(false)
  }

  const toggleSiren = () => {
    if (isSirenPlaying) {
      stopSiren()
      return
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playBeep = (startTime: number, freq: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.linearRampToValueAtTime(freq * 1.6, startTime + 0.4)

        gain.gain.setValueAtTime(0.2, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7)

        osc.start(startTime)
        osc.stop(startTime + 0.7)
      }

      // Play sequence of 6 emergency warning beeps
      for (let i = 0; i < 6; i++) {
        playBeep(ctx.currentTime + i * 0.8, 660)
      }

      setAudioCtx(ctx)
      setIsSirenPlaying(true)

      // Auto-stop after 5 seconds
      setTimeout(() => {
        setIsSirenPlaying(false)
      }, 5000)
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e)
    }
  }

  // Auto-trigger siren sound and mobile vibration on mount
  useEffect(() => {
    // 1. Mobile haptic vibration pattern [vibrate, pause, vibrate, pause, long vibrate]
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800])
      } catch (_) {}
    }

    // 2. Play warning siren beeps
    toggleSiren()

    return () => {
      stopSiren()
    }
  }, [])

  const handleDismiss = () => {
    stopSiren()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 select-none"
      style={{ background: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-red-500/90 font-mono text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'linear-gradient(165deg, #1f0404 0%, #290a0a 45%, #140707 100%)' }}
      >
        {/* Animated Red Siren Top Bar */}
        <div
          className="h-2 w-full animate-pulse"
          style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171, #dc2626)' }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center space-x-3">
            {/* Pulsing Red Shield / Siren Icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
              <div className="relative w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-950 border border-red-400/50">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>VARSHANET आपातकालीन चेतावनी</span>
              </div>
              <div className="text-white font-black text-sm tracking-wide leading-tight mt-0.5">
                EMERGENCY WEATHER ALERT
              </div>
            </div>
          </div>

          {/* Close X Button */}
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-3 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Main Alert Card */}
          <div className="bg-red-950/60 border border-red-800/70 rounded-2xl p-4 shadow-inner">
            <div className="text-red-200 font-bold text-base leading-snug mb-2">
              {alert.title}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-900 text-white border border-red-700 font-bold uppercase tracking-wide">
                {alert.severity || 'HIGH'} ALERT
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700 font-semibold truncate max-w-[200px]">
                📍 {alert.location}
              </span>
              {alert.onset_minutes && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold animate-pulse">
                  ⏱ {alert.onset_minutes} मिनट में आगमन
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
              {alert.message || 'Follow official district disaster management directives immediately.'}
            </p>
          </div>

          {/* Safety Instructions Checklist */}
          {alert.safety_instructions && alert.safety_instructions.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡</span>
                <span>सुरक्षा निर्देश / Safety Instructions</span>
              </div>
              <ul className="space-y-1.5">
                {alert.safety_instructions.slice(0, 4).map((inst, i) => (
                  <li key={i} className="text-[11px] text-slate-300 font-sans leading-snug flex items-start space-x-2">
                    <span className="text-red-400 mt-0.5 shrink-0 font-mono">▶</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Road / Travel Warning if present */}
          {alert.road_status && (
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-2.5 text-[11px] font-sans text-amber-200/90 flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span className="leading-snug"><strong>Road Caution:</strong> {alert.road_status}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-950/70 border-t border-slate-800">
          {/* BIG RED SIREN BUTTON */}
          <button
            onClick={toggleSiren}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl active:scale-95 cursor-pointer ${
              isSirenPlaying
                ? 'bg-red-800 text-white border-2 border-red-400 animate-pulse shadow-red-500/50'
                : 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-red-950'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-5 h-5 fill-current ${isSirenPlaying ? 'animate-spin' : ''}`}
            >
              <path d="M11 1a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0V1zm4.22 1.61a1 1 0 0 1 1.42 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42zM21 10a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2h2zM5 11a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2h2zm1.34-6.97a1 1 0 0 1 1.41 1.42L6.34 6.86a1 1 0 1 1-1.41-1.41l1.41-1.42zM12 5a7 7 0 0 1 7 7H5a7 7 0 0 1 7-7zm-9 9h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1z" />
            </svg>
            <span>{isSirenPlaying ? 'सायरन बंद करें' : '🚨 इमरजेंसी सायरन'}</span>
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all active:scale-95 cursor-pointer text-center"
          >
            समझ लिया / Got It
          </button>
        </div>

        {/* Footer Origin Stamp */}
        <div className="bg-red-950/40 border-t border-red-900/30 px-5 py-2 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-red-400/90 uppercase tracking-wider font-semibold">
            VARSHANET Early Warning
          </span>
          <span className="font-mono text-slate-500">
            {alert.issued_at ? alert.issued_at.slice(0, 16).replace('T', ' ') : 'Live Nowcast'}
          </span>
        </div>
      </div>
    </div>
  )
}

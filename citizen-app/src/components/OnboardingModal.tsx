/**
 * OnboardingModal.tsx — Citizen onboarding and city selection
 * Uses the exact VARSHANET logo, dark theme, and typography.
 */
import React, { useState } from 'react'

const POPULAR_CITIES = [
  'Singrauli', 'Rewa', 'Nagpur', 'Bhopal',
  'Indore', 'Jabalpur', 'Kolkata', 'Mumbai',
  'Delhi', 'Patna', 'Lucknow', 'Pune'
]

interface Props {
  onComplete: (selectedCity: string) => void
}

export const OnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const [selected, setSelected] = useState<string>('Singrauli')
  const [customCity, setCustomCity] = useState<string>('')

  const handleFinish = () => {
    const finalCity = customCity.trim() || selected
    onComplete(finalCity)
  }

  const handleSkip = () => {
    onComplete('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 select-none"
      style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #060a14 50%, #040711 100%)' }}
    >
      {/* Top Tagline */}
      <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
        <span className="tracking-widest uppercase">CITIZEN EARLY WARNING SYSTEM</span>
        <button
          onClick={handleSkip}
          className="text-slate-400 hover:text-cyan-300 font-mono text-xs underline cursor-pointer"
        >
          SKIP ›
        </button>
      </div>

      {/* Hero: Logo and Project Title */}
      <div className="flex flex-col items-center text-center my-auto space-y-4">
        {/* Logo with pulsing glowing rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 animate-pulse"></div>
          <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-purple-600 via-cyan-500 to-blue-600 opacity-40 blur-xl"></div>
          <div className="relative w-24 h-24 rounded-full p-1 bg-[#050b18] border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] overflow-hidden">
            <img
              src="/logo.png"
              alt="VARSHANET Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
            VARSHANET
          </h1>
          <p className="text-xs font-mono text-cyan-300 font-semibold tracking-wider uppercase mt-1">
            Severe Convective Weather Intelligence System
          </p>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            CITIZEN SAFETY & NOWCASTING COMPANION
          </div>
        </div>

        {/* City selection card */}
        <div className="w-full max-w-sm bg-[#0b1329]/95 border border-slate-700/80 rounded-2xl p-4 text-left shadow-2xl mt-2">
          <div className="text-xs font-mono font-bold text-slate-200 mb-1">
            📍 CHOOSE YOUR CITY FOR LOCAL ALERTS
          </div>
          <div className="text-[11px] text-slate-400 mb-3">
            Officer-published alerts for this area will be prioritized for you.
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {POPULAR_CITIES.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => { setSelected(city); setCustomCity('') }}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selected === city && !customCity
                    ? 'bg-[#863bff] text-white shadow-md shadow-purple-950 border border-purple-400'
                    : 'bg-[#060a14] text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Custom city input */}
          <input
            type="text"
            placeholder="Or type other city..."
            value={customCity}
            onChange={e => setCustomCity(e.target.value)}
            className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="w-full max-w-sm mx-auto space-y-2">
        <button
          onClick={handleFinish}
          className="w-full bg-gradient-to-r from-[#863bff] to-cyan-500 text-white font-mono font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-950/60 hover:opacity-95 transition-opacity cursor-pointer tracking-wider"
        >
          ENTER CITIZEN APP →
        </button>
        <div className="text-center text-[10px] font-mono text-slate-500">
          MINISTRY OF EARTH SCIENCES • IMD COMPLIANT
        </div>
      </div>
    </div>
  )
}

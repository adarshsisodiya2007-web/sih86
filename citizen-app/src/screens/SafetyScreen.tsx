/**
 * screens/SafetyScreen.tsx
 * Citizen Safety Guidelines — live officer safety instructions + standard emergency actions.
 */
import React from 'react'
import type { CitizenAlert, CitizenStatus } from '../types'

const SAFETY_MODULES = [
  {
    category: '🌊 FLASH FLOODS & WATERLOGGING',
    tips: [
      'Seek higher ground immediately. Avoid basements and low-lying ground.',
      'Never drive or walk through moving water — 6 inches of water can stall a car or knock you down.',
      'Turn off your home electricity main switch if water threatens to enter living spaces.',
      'Stay away from power lines, submerged electrical junction boxes, and open drains.',
      'Keep your emergency grab-bag ready with essential documents, flashlight, and medications.'
    ]
  },
  {
    category: '⚡ SEVERE THUNDERSTORM & LIGHTNING',
    tips: [
      'When Thunder Roars, Go Indoors! Seek shelter in a substantial, enclosed building.',
      'Avoid open fields, hilltops, tall trees, and metal structures/poles.',
      'Unplug sensitive electronic devices before the peak of the storm.',
      'Do not take shelter under solitary trees in open fields — lightning strikes high points.',
      'If caught outside with no shelter, crouch low on the balls of your feet with hands on knees.'
    ]
  },
  {
    category: '🌀 HIGH CONVECTIVE WINDS / DOWNBURSTS',
    tips: [
      'Stay indoors away from exterior windows, glass facades, and unreinforced roofs.',
      'Secure loose outdoor items such as corrugated tin sheets, signage, and flowerpots.',
      'Avoid parking vehicles under large tree branches or unstable hoardings.',
      'If driving during intense winds, pull over safely away from flyovers and power pylons.'
    ]
  },
  {
    category: '🎒 72-HOUR EMERGENCY DISASTER KIT',
    tips: [
      'Drinking Water: Minimum 3 liters per person per day for at least 3 days.',
      'Non-perishable food, energy bars, and ready-to-eat rations.',
      'Battery-powered or hand-crank radio, high-power LED torch, and spare batteries.',
      'First-aid supplies, antiseptic liquid, chronic medications (7-day supply).',
      'Waterproof pouch for Aadhaar, voter ID, bank passbook, and property papers.',
      'Fully charged power bank and emergency mobile charging cable.'
    ]
  }
]

interface Props {
  alerts:      CitizenAlert[]
  status:      CitizenStatus | null
  onViewAlert: (id: string) => void
}

export const SafetyScreen: React.FC<Props> = ({ alerts, status, onViewAlert }) => {
  const alertsWithInstructions = alerts.filter(a => a.safety_instructions && a.safety_instructions.length > 0)
  const generalAdvisory = status?.safety_instructions ?? []

  return (
    <div className="flex-1 overflow-y-auto bg-[#040711] text-slate-100 pb-6">
      {/* ── Header ── */}
      <div className="bg-[#0b1329] border-b border-slate-800 p-4">
        <h1 className="font-mono font-black text-lg tracking-wider text-slate-100 flex items-center gap-2">
          <span>🛡️</span> SAFETY & ADVISORY
        </h1>
        <div className="text-xs font-mono text-slate-400 mt-0.5">
          OFFICIAL PROTOCOLS TO PROTECT LIFE AND PROPERTY DURING EXTREME WEATHER
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ── Live Officer-Issued Instructions ── */}
        {alertsWithInstructions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              ACTIVE WARNING DIRECTIVES ({alertsWithInstructions.length})
            </div>
            {alertsWithInstructions.map(alert => (
              <div key={alert.id} className="rounded-2xl p-4 bg-red-950/40 border border-red-600/70 shadow-lg">
                <button
                  onClick={() => onViewAlert(alert.id)}
                  className="w-full text-left font-bold text-sm text-red-300 flex items-center justify-between mb-2 cursor-pointer"
                >
                  <span>🚨 {alert.title} ({alert.location})</span>
                  <span className="font-mono text-xs text-red-400">VIEW ALERT ›</span>
                </button>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {alert.safety_instructions.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* ── General Status Advisory ── */}
        {generalAdvisory.length > 0 && (
          <section className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 shadow-lg">
            <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>📋</span> IMD NOWCASTING ADVISORY
            </h2>
            <ul className="space-y-2 text-xs text-slate-200">
              {generalAdvisory.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span className="leading-snug">{adv}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Standard Preparedness Modules ── */}
        <section className="space-y-3 pt-2">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            STANDARD DISASTER PROTOCOLS
          </h2>
          {SAFETY_MODULES.map(mod => (
            <div key={mod.category} className="rounded-2xl p-4 bg-[#0b1329] border border-slate-800/80 shadow-md">
              <h3 className="font-mono font-bold text-xs text-cyan-300 tracking-wide mb-2.5">
                {mod.category}
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {mod.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-slate-500 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

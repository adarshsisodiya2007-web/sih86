/**
 * screens/HelpScreen.tsx
 * Emergency Helplines, Citizen SOS & Official Bulletins
 */
import React from 'react'
import { timeAgo } from '../helpers'
import type { CitizenUpdate } from '../types'

const HELPLINES = [
  { label: 'National Emergency Response (All-in-One)', number: '112', icon: '🚨', primary: true },
  { label: 'State / District Disaster Mgmt (SDMA/NDMA)', number: '1077', icon: '🌊', primary: true },
  { label: 'Ambulance & Medical Emergency',            number: '108',  icon: '🚑', primary: false },
  { label: 'National Disaster Response Force (NDRF)',   number: '1073', icon: '🛡️', primary: false },
  { label: 'Central Flood Control Room',               number: '011-26701728', icon: '📞', primary: false },
  { label: 'Police Emergency Assistance',              number: '100',  icon: '👮', primary: false },
  { label: 'Fire & Rescue Services',                   number: '101',  icon: '🔥', primary: false },
]

interface Props {
  updates: CitizenUpdate[]
}

export const HelpScreen: React.FC<Props> = ({ updates }) => (
  <div className="flex-1 overflow-y-auto bg-[#040711] text-slate-100 pb-6">
    {/* ── Header ── */}
    <div className="bg-[#0b1329] border-b border-slate-800 p-4">
      <h1 className="font-mono font-black text-lg tracking-wider text-slate-100 flex items-center gap-2">
        <span>🆘</span> EMERGENCY CONTACTS
      </h1>
      <div className="text-xs font-mono text-slate-400 mt-0.5">
        DIRECT ONE-TAP ACCESS TO VERIFIED GOVERNMENT EMERGENCY RESCUE CHANNELS
      </div>
    </div>

    <div className="p-4 space-y-5">
      {/* ── Helplines List ── */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
          OFFICIAL EMERGENCY HELPLINES
        </h2>
        {HELPLINES.map(h => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
              h.primary
                ? 'bg-[#0f1d3d] border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-950/40'
                : 'bg-[#0b1329] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{h.icon}</span>
              <div>
                <div className="font-semibold text-xs text-slate-100">{h.label}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">TAP TO DIAL RESCUE</div>
              </div>
            </div>
            <div className={`font-mono font-black px-3.5 py-1.5 rounded-xl text-sm ${
              h.primary
                ? 'bg-gradient-to-r from-[#863bff] to-cyan-500 text-white shadow-md'
                : 'bg-slate-800 text-cyan-300 border border-slate-700'
            }`}>
              {h.number}
            </div>
          </a>
        ))}
      </section>

      {/* ── Official Bulletins ── */}
      {updates.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>📢</span> RECENT OFFICER DISPATCHES
          </h2>
          <div className="space-y-2">
            {updates.map(u => (
              <div key={u.id} className="bg-[#0b1329] border border-slate-800/80 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-cyan-400 font-bold">{u.category || 'BULLETIN'}</span>
                  <span className="text-slate-400">{timeAgo(u.timestamp)}</span>
                </div>
                <div className="font-bold text-xs text-slate-100">{u.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{u.summary}</div>
                {u.location && (
                  <div className="text-[10px] font-mono text-slate-500 mt-1.5">📍 Area: {u.location}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── App Identification & Official Verification ── */}
      <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/logo.png"
            alt="VARSHANET"
            className="w-10 h-10 rounded-full object-cover border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          />
          <div className="text-left font-mono">
            <div className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
              VARSHANET
            </div>
            <div className="text-[10px] text-cyan-400 font-bold">CITIZEN MOBILE APPLICATION</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed font-mono">
          Severe Convective Weather Intelligence System
          <br />
          0–6 Hour Hyper-Local Nowcasting & Early Warning
        </p>

        <div className="text-[10px] font-mono text-slate-600">
          MINISTRY OF EARTH SCIENCES • IMD SPECIFICATION
          <br />
          SMART INDIA HACKATHON 2026
        </div>
      </div>
    </div>
  </div>
)

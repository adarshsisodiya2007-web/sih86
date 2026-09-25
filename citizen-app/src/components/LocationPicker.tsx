import React, { useState } from 'react'

const PRESET_CITIES = [
  'Nagpur', 'Rewa', 'Singrauli', 'Kolkata', 'Mumbai',
  'Delhi', 'Bhopal', 'Chennai', 'Hyderabad', 'Patna',
  'Varanasi', 'Lucknow', 'Pune', 'Jaipur', 'Ranchi',
  'Dehradun', 'Indore', 'Jabalpur', 'Siliguri',
]

interface Props {
  current: string
  onSelect: (location: string) => void
  onClose: () => void
}

export const LocationPicker: React.FC<Props> = ({ current, onSelect, onClose }) => {
  const [query, setQuery] = useState('')

  const filtered = PRESET_CITIES.filter(c =>
    !query || c.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (loc: string) => { onSelect(loc); onClose() }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(4,7,17,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0b1329] border-t-2 border-[#863bff]/50 rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="VARSHANET" className="w-6 h-6 rounded-full object-cover" />
          <h2 className="font-mono font-black text-base tracking-widest text-slate-100">SELECT YOUR CITY</h2>
        </div>
        <p className="text-slate-400 text-xs mb-4 font-mono">
          You will see alerts published for your selected area.
        </p>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a city name…"
          className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 mb-3 focus:outline-none focus:border-[#863bff]"
          autoFocus
        />

        {query && !PRESET_CITIES.some(c => c.toLowerCase() === query.toLowerCase()) && (
          <button
            onClick={() => handleSelect(query)}
            className="w-full bg-[#863bff] text-white py-3 rounded-xl text-sm font-bold font-mono tracking-widest mb-3 hover:bg-[#7e14ff] transition-colors"
          >
            SEARCH "{query.toUpperCase()}"
          </button>
        )}

        <div className="overflow-y-auto grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSelect('')}
            className={`border rounded-xl py-3 text-sm font-mono font-bold col-span-2 transition-colors ${
              current === ''
                ? 'bg-[#863bff] text-white border-[#863bff]'
                : 'bg-[#060a14] text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            🌏 SHOW ALL AREAS
          </button>
          {filtered.map(city => (
            <button
              key={city}
              onClick={() => handleSelect(city)}
              className={`border rounded-xl py-3 text-sm font-mono font-semibold transition-colors ${
                current === city
                  ? 'bg-[#863bff] text-white border-[#863bff]'
                  : 'bg-[#0b1329] text-slate-300 border-slate-700 hover:border-[#863bff]/60'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

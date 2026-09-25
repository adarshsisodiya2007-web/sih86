import React from 'react'
import type { NavTab } from '../types'

const TABS = [
  { id: 'home'   as NavTab, icon: '🏠', label: 'Home'   },
  { id: 'alerts' as NavTab, icon: '⚡', label: 'Alerts' },
  { id: 'area'   as NavTab, icon: '🗺️', label: 'Area'   },
  { id: 'safety' as NavTab, icon: '🛡️', label: 'Safety' },
  { id: 'help'   as NavTab, icon: '🆘', label: 'Help'   },
]

interface Props {
  active: NavTab
  alertCount?: number
  onChange: (tab: NavTab) => void
}

export const BottomNav: React.FC<Props> = ({ active, alertCount = 0, onChange }) => (
  <nav className="flex-shrink-0 bg-[#0b1329] border-t border-slate-700/60 safe-bottom">
    <div className="flex">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${
            active === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          aria-label={tab.label}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="text-xl leading-none relative">
            {tab.icon}
            {tab.id === 'alerts' && alertCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center font-bold font-mono border border-red-900">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </span>
          <span className={`text-[10px] font-mono font-semibold tracking-wide ${
            active === tab.id ? 'text-cyan-400' : 'text-slate-500'
          }`}>
            {tab.label}
          </span>
          {active === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  </nav>
)

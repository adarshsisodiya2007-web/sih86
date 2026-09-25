import React from 'react';
import { History, Shield, CheckCircle, AlertOctagon, UserCheck, RefreshCw, FileText } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { SystemEvent } from '../../types';

export const EventDecisionTimeline: React.FC = () => {
  const { systemEvents, refreshEvents } = useWeather();

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'ALERT_PUBLISHED':
        return {
          icon: CheckCircle,
          label: 'ALERT PUBLISHED',
          color: 'bg-emerald-950 text-emerald-300 border-emerald-700'
        };
      case 'ALERT_APPROVED':
        return {
          icon: UserCheck,
          label: 'OFFICER APPROVAL',
          color: 'bg-cyan-950 text-cyan-300 border-cyan-700'
        };
      case 'ALERT_GENERATED':
        return {
          icon: AlertOctagon,
          label: 'AI NOWCAST DETECTED',
          color: 'bg-amber-950 text-amber-300 border-amber-700'
        };
      case 'REPORT_VERIFIED':
        return {
          icon: Shield,
          label: 'GROUND TRUTH VERIFIED',
          color: 'bg-indigo-950 text-indigo-300 border-indigo-700'
        };
      case 'REPORT_REJECTED':
        return {
          icon: AlertOctagon,
          label: 'REPORT DISMISSED',
          color: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      case 'ALERT_REJECTED':
        return {
          icon: AlertOctagon,
          label: 'ALERT REJECTED',
          color: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      default:
        return {
          icon: FileText,
          label: type,
          color: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            OPERATIONAL AUDIT TRAIL & DECISION TIMELINE
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400">
            {systemEvents.length} Recorded Actions
          </span>
          <button
            onClick={() => refreshEvents()}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {systemEvents.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500">
            No system events logged in this session.
          </div>
        ) : (
          systemEvents.map((evt) => {
            const badge = getEventBadge(evt.event_type);
            const Icon = badge.icon;
            const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '17:00 IST';

            return (
              <div
                key={evt.id}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3 font-mono text-xs hover:border-slate-700 transition-colors"
              >
                <div className="mt-0.5">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    <span>{badge.label}</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-medium leading-relaxed">{evt.description}</div>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1">
                    <span>Actor: <strong className="text-slate-300">{evt.actor}</strong></span>
                    <span>•</span>
                    <span>{timeStr} IST</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

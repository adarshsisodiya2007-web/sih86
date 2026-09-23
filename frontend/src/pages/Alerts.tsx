import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { Alert, SeverityLevel, HazardType } from '../types';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle,
  Volume2,
  VolumeX,
  Filter,
  Download,
  Clock,
  MapPin,
  Flame,
  CloudRain,
  CloudLightning,
  Wind
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const { alerts, acknowledgeAlert, isAudioAlertEnabled, setIsAudioAlertEnabled } = useWeather();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewCapModal, setViewCapModal] = useState<Alert | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const getSeverityStyle = (level: SeverityLevel) => {
    switch (level) {
      case 'severe':
        return {
          bg: 'bg-red-950/80',
          border: 'border-red-500/80',
          text: 'text-red-400',
          badge: 'bg-red-900/80 text-red-200 border-red-600',
          icon: <ShieldAlert className="w-5 h-5 text-red-400" />
        };
      case 'high':
        return {
          bg: 'bg-orange-950/80',
          border: 'border-orange-500/80',
          text: 'text-orange-400',
          badge: 'bg-orange-900/80 text-orange-200 border-orange-600',
          icon: <AlertTriangle className="w-5 h-5 text-orange-400" />
        };
      case 'elevated':
        return {
          bg: 'bg-yellow-950/80',
          border: 'border-yellow-500/80',
          text: 'text-yellow-400',
          badge: 'bg-yellow-900/80 text-yellow-200 border-yellow-600',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />
        };
      case 'moderate':
        return {
          bg: 'bg-blue-950/80',
          border: 'border-blue-500/80',
          text: 'text-blue-400',
          badge: 'bg-blue-900/80 text-blue-200 border-blue-600',
          icon: <Info className="w-5 h-5 text-blue-400" />
        };
      default:
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-500/80',
          text: 'text-emerald-400',
          badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-600',
          icon: <Info className="w-5 h-5 text-emerald-400" />
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-red-400 animate-pulse" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              EARLY WARNING & ALERT ENGINE (SIMULATION PROTOTYPE)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              {alerts.filter(a => a.status === 'active').length} SIMULATED ALERTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated threshold trigger prototype generating Common Alerting Protocol (CAP-CP v1.2) compliant emergency demo broadcasts.
          </p>
        </div>

        {/* Audio Siren Toggle & Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAudioAlertEnabled(!isAudioAlertEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-2 transition-colors ${
              isAudioAlertEnabled
                ? 'bg-red-950/80 text-red-300 border-red-700/80'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {isAudioAlertEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{isAudioAlertEnabled ? 'SIREN ALARM: ON' : 'SIREN ALARM: MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Severity:</span>
          {['all', 'severe', 'high', 'elevated'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded border uppercase text-[11px] transition-colors ${
                filterSeverity === sev
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Status:</span>
          {['all', 'active', 'acknowledged'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded border capitalize text-[11px] transition-colors ${
                filterStatus === st
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);

            return (
              <div
                key={alert.alert_id}
                className={`${style.bg} border ${style.border} rounded-xl p-5 shadow-2xl transition-all space-y-4 relative overflow-hidden`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                      {style.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-300">{alert.alert_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${style.badge}`}>
                          {alert.severity} ALERT
                        </span>
                        {alert.status === 'acknowledged' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-mono font-bold text-white mt-0.5">{alert.title}</h3>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-300">
                    <div className="text-amber-400 font-bold flex items-center justify-end space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Onset ETA: {alert.onset_minutes} minutes</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Issued: {alert.issued_at} • Valid Until: {alert.expires_at}
                    </div>
                  </div>
                </div>

                {/* Key Diagnostics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">AFFECTED REGION</div>
                    <div className="text-white font-bold mt-0.5 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="truncate">{alert.region}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">TRIGGER PROBABILITY</div>
                    <div className="text-amber-400 font-bold mt-0.5">{alert.probability}% (Conf: {alert.confidence}%)</div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">CO-LOCATED HAZARDS</div>
                    <div className="text-cyan-300 font-bold mt-0.5 truncate uppercase">
                      {alert.hazards.join(', ')}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">EST. IMPACT POPULATION</div>
                    <div className="text-white font-bold mt-0.5">{alert.affected_population_est.toLocaleString()} citizens</div>
                  </div>
                </div>

                {/* Recommended Public Action Instructions */}
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/90 text-xs font-sans text-slate-200 flex items-start space-x-2">
                  <strong className="text-cyan-400 font-mono shrink-0">ADVISORY INSTRUCTION:</strong>
                  <span>{alert.recommended_action}</span>
                </div>

                {/* Actions: Acknowledge & View CAP XML/JSON */}
                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <button
                    onClick={() => setViewCapModal(alert)}
                    className="text-cyan-400 hover:text-cyan-300 underline flex items-center space-x-1"
                  >
                    <span>Inspect CAP 1.2 XML/JSON Schema</span>
                  </button>

                  {alert.status === 'active' ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.alert_id)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acknowledge Warning</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Logged by Operator #4</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
            No alerts matching current filter parameters.
          </div>
        )}
      </div>

      {/* CAP Protocol Modal */}
      {viewCapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-white">
                OASIS / WMO Common Alerting Protocol (CAP-CP v1.2)
              </span>
              <button
                onClick={() => setViewCapModal(null)}
                className="text-slate-400 hover:text-white font-mono text-sm px-2 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
{`{
  "identifier": "${viewCapModal.alert_id}",
  "sender": "in.gov.varshanet.nowcast",
  "sent": "${viewCapModal.issued_at}",
  "status": "Actual",
  "msgType": "Alert",
  "scope": "Public",
  "info": {
    "category": "Met",
    "event": "${viewCapModal.title}",
    "urgency": "Immediate",
    "severity": "${viewCapModal.severity.toUpperCase()}",
    "certainty": "Observed / High Probability",
    "areaDesc": "${viewCapModal.region}",
    "headline": "${viewCapModal.title}",
    "description": "${viewCapModal.recommended_action}",
    "instruction": "Follow official state disaster guidelines.",
    "expires": "${viewCapModal.expires_at}",
    "parameter": [
      { "valueName": "Confidence", "value": "${viewCapModal.confidence}%" },
      { "valueName": "OnsetWindowMin", "value": "${viewCapModal.onset_minutes}" },
      { "valueName": "Hazards", "value": "${viewCapModal.hazards.join(', ')}" }
    ]
  }
}`}
            </pre>

            <div className="text-right">
              <button
                onClick={() => setViewCapModal(null)}
                className="px-4 py-2 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 text-xs font-mono font-bold"
              >
                Close CAP Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

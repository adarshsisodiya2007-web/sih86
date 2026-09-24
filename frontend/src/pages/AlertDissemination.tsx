import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  BellRing,
  Send,
  MessageSquare,
  Radio,
  FileCode,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Download,
  Users,
  Smartphone,
  AlertTriangle,
  Building,
  Check
} from 'lucide-react';

export const AlertDissemination: React.FC = () => {
  const { alerts, selectedRegion } = useWeather();
  const [selectedAlertId, setSelectedAlertId] = useState<string>(alerts[0]?.alert_id || 'ALT-2026-0841');
  const [targetPincode, setTargetPincode] = useState<string>('440001');
  const [targetDistrict, setTargetDistrict] = useState<string>('Nagpur Urban & East Sector');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [messageLanguage, setMessageLanguage] = useState<'english' | 'hindi' | 'marathi'>('english');
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);

  const activeAlert = alerts.find(a => a.alert_id === selectedAlertId) || alerts[0];

  // Common Alerting Protocol (CAP 1.2 / ITU-T X.1303) XML generation for NDMA / SACHET
  const capXml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>IN-NDMA-VARSHANET-${activeAlert?.alert_id || 'ALT-01'}</identifier>
  <sender>imd-nowcast@varshanet.gov.in</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <code>IMD-CONVECTIVE-NOWCAST-v2.4</code>
  <info>
    <category>Met</category>
    <event>${activeAlert?.title || 'Severe Thunderstorm Warning'}</event>
    <urgency>Immediate</urgency>
    <severity>${activeAlert?.severity === 'severe' ? 'Extreme' : 'Severe'}</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>IMD-CODE</valueName>
      <value>THUNDERSTORM_HAIL_CLOUDBURST</value>
    </eventCode>
    <headline>VARSHANET NOWCAST: ${activeAlert?.title} in ${activeAlert?.region}</headline>
    <description>Doppler Radar dual-pol reflectivity exceeds 62 dBZ with extreme thermodynamic instability (CAPE > 2800 J/kg). High probability of damaging hail (>2.5 cm), cloudburst rates, and downburst winds exceeding 85 km/h.</description>
    <instruction>${activeAlert?.recommended_action || 'Take immediate indoor shelter away from windows.'}</instruction>
    <area>
      <areaDesc>${activeAlert?.region}</areaDesc>
      <geocode>
        <valueName>PINCODE</valueName>
        <value>${targetPincode}</value>
      </geocode>
    </area>
  </info>
</alert>`;

  const messageTemplates = {
    english: `🚨 EMERGENCY WEATHER ALERT (MoES/IMD - VARSHANET)
Location: ${activeAlert?.region} (PIN: ${targetPincode})
Hazard: Severe Convective Storm with Hail & Downburst Wind
Onset ETA: Impact in ~${activeAlert?.onset_minutes || 25} minutes.
Confidence: ${activeAlert?.confidence || 94}%
Action: ${activeAlert?.recommended_action}
Stay safe. Broadcast by National Weather Nowcast Terminal.`,

    hindi: `🚨 आपातकालीन मौसम चेतावनी (पृथ्वी विज्ञान मंत्रालय / IMD - VARSHANET)
स्थान: ${activeAlert?.region} (पिन कोड: ${targetPincode})
खतरा: भीषण आंधी-तूफान, ओलावृष्टि एवं तेज हवाएं (85+ किमी/घंटा)
अनुमानित समय: ~${activeAlert?.onset_minutes || 25} मिनट में प्रभाव की संभावना।
सटीकता: ${activeAlert?.confidence || 94}%
निर्देश: ${activeAlert?.recommended_action}
सुरक्षित रहें। VARSHANET राष्ट्रीय मौसम प्रणाली द्वारा जारी।`,

    marathi: `🚨 तातडीचा हवामान इशारा (भूविज्ञान मंत्रालय / IMD - VARSHANET)
ठिकाण: ${activeAlert?.region} (पिन: ${targetPincode})
धोका: वादळी पाऊस, गारपीट व चक्री वारे (85+ किमी/तास)
अपेक्षित वेळ: ~${activeAlert?.onset_minutes || 25} मिनिटांत आगमन.
सूचना: ${activeAlert?.recommended_action}
घरातच सुरक्षित राहा. VARSHANET राष्ट्रीय यंत्रणेद्वारे प्रसारित.`
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(capXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([capXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAP-ALERT-${activeAlert?.alert_id || 'VARSHANET'}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Web Audio API Doppler Radar Siren Generator
  const toggleSiren = () => {
    if (isSirenPlaying) {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      setIsSirenPlaying(false);
    } else {
      try {
        const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioCtx) setAudioCtx(ctx);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);

        // Siren frequency modulation (wailing pattern)
        const now = ctx.currentTime;
        for (let i = 0; i < 30; i++) {
          osc.frequency.linearRampToValueAtTime(880, now + (i * 1.2) + 0.6);
          osc.frequency.linearRampToValueAtTime(440, now + ((i + 1) * 1.2));
        }

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setOscillator(osc);
        setIsSirenPlaying(true);
      } catch (e) {
        console.warn('Audio siren failed to initialize', e);
      }
    }
  };

  const handleDispatch = () => {
    setIsDispatching(true);
    setDispatchSuccess(false);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Radio className="w-6 h-6 text-red-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
              PUBLIC ALERT DISSEMINATION & COMMON ALERTING PROTOCOL (CAP)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
              NDMA SACHET COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated multi-channel early warning broadcast gateway (WhatsApp, SMS Cell-Broadcast, Web Siren, NDMA XML).
          </p>
        </div>

        {/* Siren Audio Toggle */}
        <button
          onClick={toggleSiren}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
            isSirenPlaying
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-950/80'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-red-500/60 hover:text-white'
          }`}
        >
          {isSirenPlaying ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          <span>{isSirenPlaying ? 'STOP EMERGENCY SIREN' : 'TEST AUDIBLE SIREN'}</span>
        </button>
      </div>

      {/* Grid: Left Broadcast Console, Right CAP XML & Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): Multi-Channel Broadcast Terminal */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Active Alert Selection Card */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>1. SELECT TARGET ALERT TRIGGER</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Doppler Live Link</span>
            </div>

            <div className="space-y-2">
              {alerts.map((al) => {
                const isSelected = selectedAlertId === al.alert_id;
                return (
                  <button
                    key={al.alert_id}
                    onClick={() => setSelectedAlertId(al.alert_id)}
                    className={`w-full p-3 rounded-lg border text-left font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/30 border-red-500/70 text-white shadow-md shadow-red-950/40'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center space-x-2">
                        <span className="text-red-400">[{al.alert_id}]</span>
                        <span>{al.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Region: <strong className="text-slate-200">{al.region}</strong> • ETA: {al.onset_minutes}m • Prob: {al.probability}%
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-950 text-red-400 border border-red-800">
                      {al.severity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Configuration & Recipient Target */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>2. GEO-TARGETING & AUDIENCE SCOPE</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Cell Broadcast Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Target PIN Code / Sector</label>
                <input
                  type="text"
                  value={targetPincode}
                  onChange={(e) => setTargetPincode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Target Administrative District</label>
                <input
                  type="text"
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Estimated Citizen Reach Telemetry */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Estimated Reach</div>
                <div className="text-sm font-bold text-cyan-400">1,248,500</div>
                <div className="text-[9px] text-slate-500">Citizen Mobile Nodes</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Cell Towers</div>
                <div className="text-sm font-bold text-emerald-400">142 BTS</div>
                <div className="text-[9px] text-slate-500">Geo-Fenced Perimeter</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Est. Delivery Speed</div>
                <div className="text-sm font-bold text-amber-400">&lt; 4.2 sec</div>
                <div className="text-[9px] text-slate-500">CBC High Priority</div>
              </div>
            </div>

            {/* Message Language Selection & Preview */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">PUBLIC CITIZEN MESSAGE PREVIEW</span>
                <div className="flex space-x-1">
                  {(['english', 'hindi', 'marathi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setMessageLanguage(lang)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                        messageLanguage === lang
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
                {messageTemplates[messageLanguage]}
              </div>
            </div>

            {/* Dispatch Action Button */}
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:to-orange-500 text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-xl shadow-red-950/60 border border-red-400/40 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-60"
            >
              {isDispatching ? (
                <>
                  <Radio className="w-4 h-4 animate-spin text-white" />
                  <span>TRANSMITTING EMERGENCY CELL BROADCAST VIA SACHET GATEWAY...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>TRANSMIT EMERGENCY CELL BROADCAST NOW</span>
                </>
              )}
            </button>

            {dispatchSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>BROADCAST DELIVERED SUCCESSFULLY TO 142 BTS CELL TOWERS & WHATSAPP GATEWAY!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): NDMA CAP XML & Dispatched Agencies */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* CAP XML Standard View */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  COMMON ALERTING PROTOCOL (CAP 1.2 XML)
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleCopyXml}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                  title="Copy XML"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleDownloadXml}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                  title="Download .xml"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800/90 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-[300px] leading-tight select-all">
              {capXml}
            </pre>
            <div className="text-[10px] font-mono text-slate-500">
              Standard: ITU-T X.1303 / OASIS CAP v1.2 interoperable with NDMA SACHET National Portal.
            </div>
          </div>

          {/* Connected Emergency Disaster Agencies */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>INTER-AGENCY EMERGENCY HOTLINE</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">4 Active Nodes</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">NDRF 4th Battalion (Pune Command)</div>
                  <div className="text-[10px] text-slate-400">Flash Flood & Hail Deployment Unit</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  DISPATCHED
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">State Disaster Management Authority (SDMA)</div>
                  <div className="text-[10px] text-slate-400">Regional Emergency Operation Center (SEOC)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  DISPATCHED
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Airports Authority of India (Nagpur AOCC)</div>
                  <div className="text-[10px] text-slate-400">Terminal Aerodrome Wind Shear Notification</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  DISPATCHED
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Central Railway DRM Control Office</div>
                  <div className="text-[10px] text-slate-400">Overhead Electric Traction (OHE) Squall Warning</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                  STANDBY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

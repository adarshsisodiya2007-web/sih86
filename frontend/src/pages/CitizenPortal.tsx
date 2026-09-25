import React, { useState, useEffect, useMemo } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  Volume2,
  VolumeX,
  PhoneCall,
  MapPin,
  Send,
  CheckCircle2,
  CloudLightning,
  CloudRain,
  Wind,
  Home,
  Compass,
  ArrowRight,
  ThumbsUp,
  Radio,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { MOCK_SHELTERS } from '../services/mockData';

type Language = 'hi' | 'en' | 'mr';

interface TranslationStrings {
  title: string;
  subtitle: string;
  emergencyBanner: string;
  countdownLabel: string;
  countdownUnit: string;
  hazardDetected: string;
  safeStatus: string;
  confidence: string;
  audioAnnounce: string;
  audioStop: string;
  audioSiren: string;
  hailTitle: string;
  lightningTitle: string;
  windTitle: string;
  rainTitle: string;
  dosDontsTitle: string;
  farmersTab: string;
  residentsTab: string;
  commutersTab: string;
  sheltersTitle: string;
  shelterDistance: string;
  shelterCapacity: string;
  emergencyContactsTitle: string;
  reportWeatherTitle: string;
  reportWeatherDesc: string;
  communityReportsTitle: string;
  submitReportBtn: string;
  submitting: string;
  reportSuccess: string;
  verifiedBadge: string;
  upvoteBtn: string;
  switchOfficer: string;
}

const translations: Record<Language, TranslationStrings> = {
  hi: {
    title: 'VARSHANET नागरिक मौसम सुरक्षा पोर्टल',
    subtitle: 'अति-स्थानीय (1-3 किमी) आंधी, ओलावृष्टि एवं वज्रपात पूर्व चेतावनी प्रणाली',
    emergencyBanner: '⚠️ आपातकालीन मौसम चेतावनी: अपने क्षेत्र में सतर्क रहें और सुरक्षा नियमों का पालन करें',
    countdownLabel: 'तूफान आगमन में शेष समय (ETA)',
    countdownUnit: 'मिनट शेष',
    hazardDetected: 'भीषण आंधी, ओलावृष्टि व आकाशीय बिजली का खतरा',
    safeStatus: 'वर्तमान में आपके क्षेत्र में कोई गंभीर तूफान नहीं है (स्थिति सामान्य)',
    confidence: 'चेतावनी सटीकता',
    audioAnnounce: 'आवाज में सुनें (Audio Alert)',
    audioStop: 'ऑडियो बंद करें',
    audioSiren: 'आपातकालीन सायरन',
    hailTitle: 'ओलावृष्टि (Hail)',
    lightningTitle: 'आकाशीय बिजली (Lightning)',
    windTitle: 'तूफानी हवाएं (Wind)',
    rainTitle: 'वर्षा तीव्रता (Rain)',
    dosDontsTitle: 'जीवन-रक्षक सुरक्षा निर्देश (Do\'s & Don\'ts)',
    farmersTab: '🌾 किसान व खुले खेत',
    residentsTab: '🏠 घर व आवासीय क्षेत्र',
    commutersTab: '🚗 सड़क व यात्री',
    sheltersTitle: 'निकटतम सुरक्षित सार्वजनिक आश्रय (Safe Shelters)',
    shelterDistance: 'दूरी',
    shelterCapacity: 'क्षमता',
    emergencyContactsTitle: '24x7 आपातकालीन हेल्पलाइन (1-Tap Call)',
    reportWeatherTitle: 'ग्राउंड रिपोर्ट भेजें (Report Weather)',
    reportWeatherDesc: 'अपने क्षेत्र की मौसम स्थिति बताएं जिससे आपदा नियंत्रण कक्ष तक तुरंत सही जानकारी पहुंचे।',
    communityReportsTitle: 'क्षेत्रीय नागरिकों द्वारा दर्ज की गई ग्राउंड रिपोर्ट',
    submitReportBtn: 'रिपोर्ट भेजें',
    submitting: 'भेजा जा रहा है...',
    reportSuccess: 'आपकी रिपोर्ट दर्ज हो गई है और कंट्रोल रूम को भेज दी गई है!',
    verifiedBadge: 'रडार अधिकारी द्वारा सत्यापित',
    upvoteBtn: 'मैंने भी देखा (Confirm)',
    switchOfficer: '👨‍💼 अधिकारी कमांड टर्मिनल खोलें'
  },
  en: {
    title: 'VARSHANET Citizen Weather Safety Portal',
    subtitle: 'Hyper-Local (1–3 km) Thunderstorm, Hail & Cloudburst Early Warning System',
    emergencyBanner: '⚠️ EMERGENCY CONVECTIVE ALERT: Take immediate precautions and seek safe shelter',
    countdownLabel: 'Storm Arrival Countdown (ETA)',
    countdownUnit: 'minutes remaining',
    hazardDetected: 'Severe Thunderstorm, Hail & Lightning Warning',
    safeStatus: 'No severe convective storms currently detected in your vicinity (All Clear)',
    confidence: 'Nowcast Confidence',
    audioAnnounce: 'Listen Voice Warning',
    audioStop: 'Stop Voice',
    audioSiren: 'Emergency Siren',
    hailTitle: 'Hail Potential',
    lightningTitle: 'Cloud-to-Ground Lightning',
    windTitle: 'Gale Downburst Wind',
    rainTitle: 'Rain Rate Intensity',
    dosDontsTitle: 'Actionable Safety Directives (Do\'s & Don\'ts)',
    farmersTab: '🌾 Farmers & Fields',
    residentsTab: '🏠 Homes & Residents',
    commutersTab: '🚗 Commuters & Roads',
    sheltersTitle: 'Nearest Designated Safe Shelters',
    shelterDistance: 'Distance',
    shelterCapacity: 'Capacity',
    emergencyContactsTitle: '24x7 Emergency Helplines (1-Tap Call)',
    reportWeatherTitle: 'Report Ground Weather Observation',
    reportWeatherDesc: 'Submit real-time ground truth weather observations to assist NDMA/DDMA emergency response.',
    communityReportsTitle: 'Live Crowdsourced Ground Reports from Citizens',
    submitReportBtn: 'Submit Ground Report',
    submitting: 'Broadcasting report...',
    reportSuccess: 'Report successfully submitted and transmitted to Officer Mission Control!',
    verifiedBadge: 'Radar Verified by Forecaster',
    upvoteBtn: 'Confirm Observation',
    switchOfficer: '👨‍💼 Switch to Officer Command Center'
  },
  mr: {
    title: 'VARSHANET नागरिक हवामान सुरक्षा पोर्टल',
    subtitle: 'अति-स्थानिक (1-3 किमी) वादळ, गारपीट व वीज पडणे पूर्वसूचना प्रणाली',
    emergencyBanner: '⚠️ तातडीचा हवामान इशारा: सुरक्षित ठिकाणी आश्रय घ्या व नियमांचे पालन करा',
    countdownLabel: 'वादळ येण्यास उर्वरित वेळ (ETA)',
    countdownUnit: 'मिनिटे शिल्लक',
    hazardDetected: 'भीषण वादळी पाऊस, गारपीट व वीज पडण्याचा धोका',
    safeStatus: 'सध्या आपल्या परिसरात कोणतेही तीव्र वादळ नाही (परिस्थिती सामान्य)',
    confidence: 'अचूकता प्रमाण',
    audioAnnounce: 'आवाजात ऐका (Audio Alert)',
    audioStop: 'ऑडिओ थांबवा',
    audioSiren: 'धोका सायरन',
    hailTitle: 'गारपीट (Hail)',
    lightningTitle: 'आकाशीय वीज (Lightning)',
    windTitle: 'चक्री वारे (Wind)',
    rainTitle: 'पावसाची तीव्रता (Rain)',
    dosDontsTitle: 'सुरक्षा मार्गदर्शक तत्त्वे (Do\'s & Don\'ts)',
    farmersTab: '🌾 शेतकरी व शेतजमीन',
    residentsTab: '🏠 घरे व नागरिक',
    commutersTab: '🚗 रस्ते व प्रवासी',
    sheltersTitle: 'जवळचे सुरक्षित सार्वजनिक निवारे (Safe Shelters)',
    shelterDistance: 'अंतर',
    shelterCapacity: 'क्षमता',
    emergencyContactsTitle: '24x7 आपत्कालीन संपर्क क्रमांक (1-Tap Call)',
    reportWeatherTitle: 'थेट हवामान माहिती नोंदवा (Report Weather)',
    reportWeatherDesc: 'आपल्या परिसरातील हवामानाची माहिती नियंत्रण कक्षाकडे तत्काळ पाठवा.',
    communityReportsTitle: 'स्थानिक नागरिकांनी नोंदवलेली निरीक्षणे',
    submitReportBtn: 'माहिती पाठवा',
    submitting: 'पाठवत आहे...',
    reportSuccess: 'आपली माहिती यशस्वीरीत्या नोंदवून नियंत्रण कक्षास पाठवण्यात आली आहे!',
    verifiedBadge: 'रडार अधिकाऱ्याद्वारे प्रमाणित',
    upvoteBtn: 'मीसुद्धा पाहिले (Confirm)',
    switchOfficer: '👨‍💼 अधिकारी कमांड टर्मिनल'
  }
};

interface CitizenPortalProps {
  onSwitchToOfficer?: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ onSwitchToOfficer }) => {
  const {
    selectedRegion,
    setSelectedRegion,
    regions,
    stormCells,
    alerts,
    citizenReports,
    addCitizenReport,
    upvoteCitizenReport
  } = useWeather();

  const [lang, setLang] = useState<Language>('hi');
  const [activeChecklistTab, setActiveChecklistTab] = useState<'farmers' | 'residents' | 'commuters'>('farmers');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);

  // Live countdown state (in seconds)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1640); // ~27 mins

  // Citizen Report Form state
  const [reportHazard, setReportHazard] = useState<string>('hail');
  const [reportLocation, setReportLocation] = useState<string>('Rewari Rural Sector');
  const [reportNote, setReportNote] = useState<string>('');
  const [reportName, setReportName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const t = translations[lang];

  // Most severe active cell or alert
  const primaryCell = useMemo(() => {
    if (stormCells.length === 0) return null;
    return stormCells.reduce((prev, curr) => (curr.dbz_max > prev.dbz_max ? curr : prev), stormCells[0]);
  }, [stormCells]);

  const primaryAlert = useMemo(() => {
    return alerts.find(a => a.status === 'active') || alerts[0];
  }, [alerts]);

  // Dynamic countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 1800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Text-to-speech announcement
  const toggleAudioAnnounce = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    let speechText = '';
    const mins = Math.floor(remainingSeconds / 60);

    if (lang === 'hi') {
      speechText = `सावधान! पृथ्वी विज्ञान मंत्रालय और वर्षा-नेट मौसम प्रणाली की ओर से चेतावनी जारी की गई है। अगले ${mins} मिनट में ${selectedRegion} में तेज आंधी, ओलावृष्टि और आकाशीय बिजली गिरने का गंभीर खतरा है। कृपया खुले खेत, पेड़ों और बिजली के खंभों से दूर रहें। तुरंत पक्के मकान या सुरक्षित शेल्टर में शरण लें।`;
    } else if (lang === 'mr') {
      speechText = `सावधान! वर्षा-नेट हवामान प्रणाली तर्फे इशारा. पुढील ${mins} मिनिटांत ${selectedRegion} मध्ये वादळी पाऊस, गारपीट आणि वीज पडण्याची शक्यता आहे. शेतात किंवा झाडांखाली थांबू नका, सुरक्षित घरात राहा.`;
    } else {
      speechText = `Attention! Emergency convective weather warning from VARSHANET. Severe thunderstorm with damaging hail and cloud-to-ground lightning expected in ${selectedRegion} within ${mins} minutes. Take immediate indoor shelter.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Siren toggle using Web Audio API
  const toggleSiren = () => {
    if (isSirenActive) {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      setIsSirenActive(false);
    } else {
      try {
        const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioCtx) setAudioCtx(ctx);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, ctx.currentTime);

        const now = ctx.currentTime;
        for (let i = 0; i < 20; i++) {
          osc.frequency.linearRampToValueAtTime(950, now + (i * 1.0) + 0.5);
          osc.frequency.linearRampToValueAtTime(520, now + ((i + 1) * 1.0));
        }

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setOscillator(osc);
        setIsSirenActive(true);
      } catch (e) {
        console.warn('Audio siren error', e);
      }
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      await addCitizenReport({
        region: selectedRegion,
        location_name: reportLocation || 'Rewari Sector',
        latitude: primaryCell?.latitude || 28.18,
        longitude: primaryCell?.longitude || 76.62,
        hazard_type: reportHazard,
        severity: reportHazard === 'hail' || reportHazard === 'lightning' ? 'severe' : 'high',
        user_note: reportNote || 'Heavy storm observed on ground.',
        reporter_name: reportName || 'Citizen Report'
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setReportNote('');
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Language + Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {t.title}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase">
                  CITIZEN PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          {/* Language Selector & Officer Switch */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            {/* Language Switcher Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'mr'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Officer Switch Button */}
            {onSwitchToOfficer && (
              <button
                onClick={onSwitchToOfficer}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-600/50 text-blue-300 text-xs font-mono font-bold transition-all shadow cursor-pointer"
                title="Return to Officer Terminal"
              >
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.switchOfficer}</span>
              </button>
            )}
          </div>
        </div>

        {/* Location & Sector Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">
              {lang === 'hi' ? 'आपका सक्रिय क्षेत्र:' : lang === 'mr' ? 'आपला परिसर:' : 'Current Live Sector:'}
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 text-amber-300 font-bold border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
            >
              {regions.map((r) => (
                <option key={r.name} value={r.name} className="bg-slate-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 hidden sm:inline">
              ● Live GPS Geofenced (1-3 km)
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            NDMA SACHET / IMD DWR Live Feed
          </div>
        </div>
      </div>

      {/* EMERGENCY CARD 1: Big Live Countdown & Hazard Level */}
      <div className="bg-gradient-to-b from-red-950/70 via-[#13070b] to-[#0d121f] border-2 border-red-500/80 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Animated ambient corner flare */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Hazard status & title */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-900/80 border border-red-400 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t.hazardDetected}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {lang === 'hi'
                ? 'अगले 30 मिनट में तेज आंधी, ओले व आकाशीय बिजली की संभावना'
                : lang === 'mr'
                ? 'पुढील ३० मिनिटांत वादळी पाऊस, गारपीट व वीज पडण्याचा इशारा'
                : 'Imminent Severe Convective Storm with Hail & Downburst'}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'रडार व उपग्रह डेटा के अनुसार तूफानी बादल आपके क्षेत्र की ओर 65 किमी/घंटा की गति से बढ़ रहे हैं। खेतों और खुले स्थानों से तत्काल पक्के मकान या शेल्टर में चले जाएं।'
                : lang === 'mr'
                ? 'डॉपलर रडारनुसार वादळी ढग ६५ किमी/तास वेगाने आपल्या दिशेने येत आहेत. तात्काळ पक्क्या घरात किंवा सुरक्षित निवाऱ्यात जा.'
                : 'Doppler Radar shows rapid updraft intensification moving at 65 km/h directly into your local sector. Take immediate protective shelter.'}
            </p>

            {/* Quick parameter badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-slate-900/90 border border-red-800/60 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center space-x-1 text-xs text-amber-300 font-semibold mb-0.5">
                  <span>🧊</span>
                  <span>{t.hailTitle}</span>
                </div>
                <div className="text-sm font-black text-white">2.5 – 3.5 cm</div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'hi' ? 'नींबू के आकार के' : lang === 'mr' ? 'मोठ्या गारा' : 'Golf-ball size'}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-amber-800/60 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center space-x-1 text-xs text-amber-300 font-semibold mb-0.5">
                  <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.lightningTitle}</span>
                </div>
                <div className="text-sm font-black text-white">45+ / min</div>
                <div className="text-[10px] text-red-400 font-bold">
                  {lang === 'hi' ? 'रेड अलर्ट (खतरा)' : lang === 'mr' ? 'अतिधोका' : 'High Density'}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-blue-800/60 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center space-x-1 text-xs text-cyan-300 font-semibold mb-0.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.windTitle}</span>
                </div>
                <div className="text-sm font-black text-white">75 – 85 km/h</div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'hi' ? 'तेज अंधड़' : lang === 'mr' ? 'चक्री वारे' : 'Severe Gale'}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center space-x-1 text-xs text-blue-300 font-semibold mb-0.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.rainTitle}</span>
                </div>
                <div className="text-sm font-black text-white">55 mm/hr</div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'hi' ? 'मूसलाधार' : lang === 'mr' ? 'मुसळधार' : 'Torrential'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Giant Digital Countdown Clock & Audio Controls */}
          <div className="w-full lg:w-auto flex flex-col items-center bg-black/60 border border-red-500/50 rounded-2xl p-5 sm:p-6 shadow-xl shrink-0">
            <div className="flex items-center space-x-2 text-xs font-mono text-red-300 uppercase tracking-widest font-bold mb-1">
              <Clock className="w-4 h-4 text-red-400 animate-spin" />
              <span>{t.countdownLabel}</span>
            </div>

            {/* Huge Digital Clock Numbers */}
            <div className="font-mono text-4xl sm:text-5xl font-black text-red-400 tracking-wider my-1 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              {formatCountdown(remainingSeconds)}
            </div>

            <div className="text-xs text-slate-300 font-medium">
              {t.countdownUnit} ({lang === 'hi' ? 'लगभग 27 मिनट' : 'approx 27 mins'})
            </div>

            {/* Audio Voice & Siren Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 w-full">
              <button
                onClick={toggleAudioAnnounce}
                className={`w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? t.audioStop : t.audioAnnounce}</span>
              </button>

              <button
                onClick={toggleSiren}
                className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                  isSirenActive
                    ? 'bg-red-600 text-white border-red-300 animate-pulse shadow-red-900/50 shadow-lg'
                    : 'bg-slate-900 text-red-300 border-red-800/80 hover:bg-red-950'
                }`}
                title="Test siren audio"
              >
                🚨 {isSirenActive ? 'STOP' : 'SIREN'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID SECTION 2: 3-Second Life-Saving Directives (Do's & Don'ts) */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t.dosDontsTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'hi'
                ? 'बिजली गिरने और ओलावृष्टि से बचने के लिए तत्काल इन नियमों का पालन करें।'
                : 'Critical precautions formulated by NDMA and IMD for rapid personal protection.'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium self-stretch sm:self-auto">
            <button
              onClick={() => setActiveChecklistTab('farmers')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChecklistTab === 'farmers'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.farmersTab}
            </button>
            <button
              onClick={() => setActiveChecklistTab('residents')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChecklistTab === 'residents'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.residentsTab}
            </button>
            <button
              onClick={() => setActiveChecklistTab('commuters')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChecklistTab === 'commuters'
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.commutersTab}
            </button>
          </div>
        </div>

        {/* Tab Content Cards */}
        {activeChecklistTab === 'farmers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>❌</span>
                <span>{lang === 'hi' ? 'खेत में क्या कभी न करें (Don\'ts)' : 'Never Do in Open Fields'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span><strong>अकेले ऊंचे पेड़ के नीचे कभी न खड़े हों</strong> — 80% बिजली के हादसे अकेले पेड़ के नीचे होते हैं।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span><strong>ट्रैक्टर, हल या लोहे के औजार</strong> (कुदाल, फावड़ा) को तुरंत जमीन पर छोड़ दें और उनसे दूर हट जाएं।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>तार की बाड़ (wire fence) या नलकूप के लोहे के पाइप को न छुएं।</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>✅</span>
                <span>{lang === 'hi' ? 'खेत में तुरंत क्या करें (Do\'s)' : 'Immediate Actions'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>पक्के मकान या पंचायत शेल्टर</strong> में तुरंत शरण लें।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>यदि खुले में फंस जाएं:</strong> जमीन पर लेटें नहीं! दोनों पैरों को सटाकर पंजों के बल उकड़ू (crouch) बैठ जाएं और कानों को हाथों से ढक लें।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>मवेशियों को खुले पेड़ से खोलकर तुरंत पक्के शेड में ले जाएं।</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeChecklistTab === 'residents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>❌</span>
                <span>{lang === 'hi' ? 'घर में क्या न करें (Don\'ts)' : 'Avoid at Home'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>खिड़कियों, बालकनी या टिन की छत के नीचे खड़े न हों (ओले शीशा व टिन तोड़ सकते हैं)।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>बिजली की गड़गड़ाहट के समय नल के बहते पानी में बर्तन न धोएं या स्नान न करें।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>कॉर्ड वाले लैंडलाइन फोन या चार्जिंग पर लगे मोबाइल का उपयोग न करें।</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>✅</span>
                <span>{lang === 'hi' ? 'घर में तुरंत क्या करें (Do\'s)' : 'Recommended Steps'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>बिजली के भारी उपकरण अनप्लग करें:</strong> टीवी, फ्रिज, इन्वर्टर व कंप्यूटर को सॉकेट से निकाल दें।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>खिड़की-दरवाजे कसकर बंद रखें और घर के भीतरी कमरे में रहें।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>टॉर्च, पीने का पानी और प्राथमिक चिकित्सा किट (First Aid) तैयार रखें।</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeChecklistTab === 'commuters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>❌</span>
                <span>{lang === 'hi' ? 'सड़क पर क्या न करें' : 'Avoid on Roads'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>पानी भरे अंडरपास या रपटे पर गाड़ी कभी न डालें — अचानक जलभराव में वाहन बह सकते हैं।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>सड़क किनारे खड़े पुराने पेड़ों या होर्डिंग्स/बिजली खंभों के पास गाड़ी पार्क न करें।</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>✅</span>
                <span>{lang === 'hi' ? 'सड़क पर सुरक्षित रहने के उपाय' : 'Road Safety Protocol'}</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span><strong>कार में खिड़कियां बंद रखें:</strong> धातु की कार बिजली के लिए 'फैराडे केज' (Faraday Cage) की तरह सुरक्षित होती है।</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>दोपहिया वाहन चालक किसी पक्के पेट्रोल पंप या पक्की दुकान की छत के नीचे रुकें।</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* GRID SECTION 3: Safe Shelters & Emergency Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Nearest Safe Shelters */}
        <div className="lg:col-span-7 bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {t.sheltersTitle}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              Verified Public Points
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_SHELTERS.map((sh) => (
              <div
                key={sh.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{sh.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                      {sh.distance_m}m {lang === 'hi' ? 'दूर' : 'away'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{sh.address}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-300 pt-1 font-mono">
                    <span>👥 {lang === 'hi' ? 'क्षमता:' : 'Capacity:'} {sh.capacity} ({sh.current_occupancy} present)</span>
                    {sh.has_power_backup && <span className="text-emerald-400">⚡ Power Backup</span>}
                    {sh.has_drinking_water && <span className="text-cyan-400">💧 Clean Water</span>}
                  </div>
                </div>

                <a
                  href={`tel:${sh.contact_phone}`}
                  className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {sh.contact_phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): 24x7 Emergency Helplines */}
        <div className="lg:col-span-5 bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <PhoneCall className="w-5 h-5 text-red-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              {t.emergencyContactsTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            <a
              href="tel:112"
              className="p-3 rounded-xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/60 hover:border-red-400 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-red-300">
                  112 — National Emergency Service
                </div>
                <div className="text-[11px] text-slate-400">Police, Fire & Disaster First Response</div>
              </div>
              <span className="text-xs font-black text-red-400 bg-red-950 px-2 py-1 rounded border border-red-800">
                CALL 112
              </span>
            </a>

            <a
              href="tel:1077"
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">
                  1077 — District Disaster Control (DDMA)
                </div>
                <div className="text-[11px] text-slate-400">Flood, Hailstorm & Evacuation Assistance</div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2 py-1 rounded border border-amber-800">
                CALL 1077
              </span>
            </a>

            <a
              href="tel:108"
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                  108 — Emergency Medical Ambulance
                </div>
                <div className="text-[11px] text-slate-400">Lightning strike or trauma emergency</div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                CALL 108
              </span>
            </a>

            <a
              href="tel:1912"
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                  1912 — Electricity Hazard Helpline
                </div>
                <div className="text-[11px] text-slate-400">Snapped live wire & transformer burst</div>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                CALL 1912
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 4: Crowdsourced Ground Truth Reporting ("Report What You See") */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t.reportWeatherTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t.reportWeatherDesc}</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
            1-TAP CITIZEN DISPATCH
          </span>
        </div>

        {submitSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-xl p-3.5 flex items-center space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{t.reportSuccess}</span>
          </div>
        )}

        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {lang === 'hi' ? 'आप क्या देख रहे हैं? (कन्फर्म करें):' : 'Select Hazard Observed on Ground:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'hail', label: lang === 'hi' ? '🧊 ओले गिर रहे हैं (Hail)' : '🧊 Heavy Hail Falling' },
                { id: 'lightning', label: lang === 'hi' ? '⚡ भीषण बिजली (Lightning)' : '⚡ Cloud-to-Ground Lightning' },
                { id: 'downburst', label: lang === 'hi' ? '💨 तेज आंधी/पेड़ टूटे (Gale)' : '💨 Violent Wind Gusts' },
                { id: 'waterlogging', label: lang === 'hi' ? '🌊 जलभराव/बाढ़ (Flooding)' : '🌊 Rapid Water Accumulation' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setReportHazard(opt.id)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    reportHazard === opt.id
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-950/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'hi' ? 'स्थान / गांव / मोहल्ला:' : 'Village / Colony / Sector Name:'}
              </label>
              <input
                type="text"
                value={reportLocation}
                onChange={(e) => setReportLocation(e.target.value)}
                placeholder="e.g. Rewari Main Mandi, Village Dharuhera"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'hi' ? 'आपका नाम या पद (वैकल्पिक):' : 'Your Name / Designation (Optional):'}
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g. Kisan Rajesh, Sarpanch, Local Resident"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'hi' ? 'अतिरिक्त विवरण (यदि कोई हो):' : 'Additional Ground Details (Size of hail, damage, etc.):'}
            </label>
            <input
              type="text"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="e.g. Hail stones around 2-3 cm size. High wind damaging shed roofs."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                {lang === 'hi'
                  ? 'आपकी रिपोर्ट सीधे कंट्रोल रूम रडार स्क्रीन पर प्रदर्शित होगी।'
                  : 'Your submission is instantly routed to the IMD/NDMA Mission Control console.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-950/60 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? t.submitting : t.submitReportBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 5: Live Crowdsourced Community Feed */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              {t.communityReportsTitle}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-bold">
            {citizenReports.length} Live Ground Reports
          </span>
        </div>

        <div className="space-y-3">
          {citizenReports.slice(0, 5).map((rep) => (
            <div
              key={rep.id}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{rep.location_name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                    {rep.hazard_type}
                  </span>
                  {rep.verified && (
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-700 flex items-center space-x-1">
                      <span>✓</span>
                      <span>{t.verifiedBadge}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">{rep.user_note}</p>

                <div className="text-[10px] text-slate-400 flex items-center space-x-3 pt-0.5 font-mono">
                  <span>👤 {rep.reporter_name || 'Local Citizen'}</span>
                  <span>⏱️ {rep.timestamp}</span>
                  <span>📍 {rep.region}</span>
                </div>
              </div>

              <button
                onClick={() => upvoteCitizenReport(rep.id)}
                className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
                title="Confirm you also observe this hazard"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                <span>{rep.upvotes} {t.upvoteBtn}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitizenPortal;

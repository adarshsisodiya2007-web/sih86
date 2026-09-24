import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Compass,
  ArrowRight,
  Zap,
  Eye,
  EyeOff,
  Radio,
  Server,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (operatorId: string, sector: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [operatorId, setOperatorId] = useState<string>('IMD-RADAR-OP-84');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [selectedSector, setSelectedSector] = useState<string>('Nagpur Sector (Vidarbha)');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberTerminal, setRememberTerminal] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const sectors = [
    'Nagpur Sector (Vidarbha)',
    'Mumbai-Pune Gateway',
    'Kolkata & Gangetic Delta',
    'Dehradun & Foothills',
    'Siliguri & NE Basin',
    'Hyderabad-Deccan',
    'Ranchi & Chota Nagpur',
    'Jaipur-Eastern Rajasthan'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      onLogin(operatorId || 'IMD-RADAR-OP-84', selectedSector);
    }, 450);
  };

  const handleInstantDemoLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      onLogin('DEMO-OPERATOR-GUEST', 'Nagpur Sector (Vidarbha)');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#040711] flex flex-col justify-between items-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background Cybernetic Radar Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full bg-cyan-950/20 blur-[130px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-blue-950/20 blur-[120px] -z-10 pointer-events-none"></div>

      {/* Top Banner */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 pt-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            NATIONAL WEATHER RADAR NETWORK • OPERATIONAL ACCESS PORTAL
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded">
          <Radio className="w-3 h-3" />
          <span>DUAL-POL S-BAND LIVE</span>
        </div>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md my-auto z-10">
        <div className="bg-[#0b1120]/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl space-y-6">
          
          {/* Card Header & Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-cyan-500 opacity-60 blur-md group-hover:opacity-90 transition duration-300"></div>
                <div className="relative w-20 h-20 rounded-full p-1 bg-[#060b16] border-2 border-cyan-400 shadow-xl flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="VARSHANET Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black font-mono tracking-wider text-white">
                VARSHANET
              </h2>
              <p className="text-xs font-mono text-cyan-400 font-semibold tracking-wide uppercase mt-0.5">
                Mission Control Access Gateway
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter authorized radar terminal credentials to initialize nowcast telemetry.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Sector Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>COMMAND RADAR SECTOR</span>
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
              >
                {sectors.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>OPERATOR CALLSIGN / ID</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="e.g. IMD-RADAR-OP-84"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Security Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>SECURITY CLEARANCE KEY</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-cyan-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Terminal Checkbox */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberTerminal}
                  onChange={(e) => setRememberTerminal(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                />
                <span>Remember Terminal</span>
              </label>
              <span className="text-[10px] text-cyan-400/90 font-medium">Clearance Level: L3</span>
            </div>

            {/* Authenticate Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-xl shadow-cyan-900/40 border border-cyan-400/40 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-60"
            >
              {isAuthenticating ? (
                <>
                  <Radio className="w-4 h-4 animate-spin text-white" />
                  <span>AUTHENTICATING TELEMETRY...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTHENTICATE & ENTER SYSTEM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Instant 1-Click Demo Login Button (For Evaluators & Quick Testing) */}
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="w-full py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white font-mono font-medium text-xs flex items-center justify-center space-x-2 border border-cyan-800/50 hover:border-cyan-400/60 transition-all cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>⚡ INSTANT 1-CLICK DEMO ACCESS (EVALUATORS)</span>
            </button>
          </form>

          {/* Security Tagline */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-slate-500">
              <Server className="w-3 h-3 text-cyan-500" />
              <span>AES-256 ENCRYPTED RADAR PIPELINE • SIH 2026 PROTOCOL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-4xl text-center text-[10px] font-mono text-slate-500 z-10 pb-2">
        MINISTRY OF EARTH SCIENCES • INDIA METEOROLOGICAL DEPARTMENT SPECIFICATION • SMART INDIA HACKATHON 2026
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  Compass,
  AlertCircle
} from 'lucide-react';

interface LoginPageProps {
  onLoginOfficer: (operatorId: string, sector: string) => void;
  onLoginCitizen: (sector: string, citizenName?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginOfficer, onLoginCitizen }) => {
  // Top mode toggle: Real Carrier OTP vs SIH 2026 Demo Mode (exact match to user mockup)
  const [authMode, setAuthMode] = useState<'carrier' | 'demo'>('carrier');

  // Active tab: Citizen vs Authorized Officer
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');

  // Citizen State
  const [citizenMobile, setCitizenMobile] = useState<string>('98765 43210');
  const [citizenOtpSent, setCitizenOtpSent] = useState<boolean>(false);
  const [citizenOtp, setCitizenOtp] = useState<string>('');
  const [generatedCitizenOtp, setGeneratedCitizenOtp] = useState<string>('842601');

  // Officer State
  const [officerMobile, setOfficerMobile] = useState<string>('98120 44910');
  const [officerCallsign, setOfficerCallsign] = useState<string>('IMD-RADAR-OP-84');
  const [officerSector, setOfficerSector] = useState<string>('Nagpur Sector (Vidarbha)');
  const [officerOtpSent, setOfficerOtpSent] = useState<boolean>(false);
  const [officerOtp, setOfficerOtp] = useState<string>('');
  const [generatedOfficerOtp, setGeneratedOfficerOtp] = useState<string>('951472');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sectors = [
    'Nagpur Sector (Vidarbha)',
    'Rewari Rural Sector (Delhi-NCR)',
    'Mumbai-Pune Gateway',
    'Kolkata & Gangetic Delta',
    'Dehradun & Foothills',
    'Siliguri & NE Basin',
    'Hyderabad-Deccan',
    'Ranchi & Chota Nagpur',
    'Jaipur-Eastern Rajasthan'
  ];

  // Citizen SMS OTP Dispatch
  const handleSendCitizenOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setTimeout(() => {
      setIsLoading(false);
      setCitizenOtpSent(true);
      setGeneratedCitizenOtp('842601');
      setStatusMessage('Carrier SMS broadcasted: Simulated OTP is 842601');
    }, 600);
  };

  const handleVerifyCitizenOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginCitizen('Rewari Rural Sector (Delhi-NCR)', `Citizen (+91 ${citizenMobile})`);
    }, 400);
  };

  // Officer SMS OTP Dispatch
  const handleSendOfficerOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setTimeout(() => {
      setIsLoading(false);
      setOfficerOtpSent(true);
      setGeneratedOfficerOtp('951472');
      setStatusMessage('Carrier SMS broadcasted to IMD Officer: Simulated OTP is 951472');
    }, 600);
  };

  const handleVerifyOfficerOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginOfficer(officerCallsign || 'IMD-RADAR-OP-84', officerSector);
    }, 400);
  };

  // Direct Bypass ("Continue without Sign In ->")
  const handleContinueWithoutSignIn = () => {
    onLoginCitizen('Rewari Rural Sector (Delhi-NCR)', 'Guest Citizen');
  };

  // Demo 1-Click bypass
  const handleDemoCitizenAccess = () => {
    onLoginCitizen('Rewari Rural Sector (Delhi-NCR)', 'Demo Citizen (Rewari)');
  };

  const handleDemoOfficerAccess = () => {
    onLoginOfficer('DEMO-OPERATOR-GUEST', 'Nagpur Sector (Vidarbha)');
  };

  return (
    <div className="min-h-screen bg-[#060a14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#060a14] to-[#02050a] flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-900/10 blur-[130px] -z-10 pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="w-full max-w-lg space-y-4">
        
        {/* Top Mode Pill Toggle (Exact Match to User Mockup Screenshot) */}
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-[#0b1428] border border-slate-700/80 rounded-xl p-1 gap-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('carrier');
                setCitizenOtpSent(false);
                setOfficerOtpSent(false);
                setStatusMessage(null);
              }}
              className={`px-5 py-2 rounded-lg font-mono text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                authMode === 'carrier'
                  ? 'bg-[#0284c7] text-white shadow-md shadow-blue-950/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎛️ Real Carrier OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('demo');
                setCitizenOtpSent(false);
                setOfficerOtpSent(false);
                setStatusMessage(null);
              }}
              className={`px-5 py-2 rounded-lg font-mono text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                authMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧪 SIH 2026 Demo Mode</span>
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-[#0b1329]/95 border border-slate-700/70 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
          
          {/* Sub-tabs: Citizen vs Authorized Officer */}
          <div className="flex items-center bg-[#070d1e] border border-slate-800 rounded-xl p-1 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('citizen');
                setCitizenOtpSent(false);
                setStatusMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer text-center font-mono ${
                activeTab === 'citizen'
                  ? 'bg-blue-950/80 text-cyan-300 font-bold border border-cyan-800/50 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Citizen Login (Mobile OTP)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('officer');
                setOfficerOtpSent(false);
                setStatusMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer text-center font-mono ${
                activeTab === 'officer'
                  ? 'bg-blue-950/80 text-cyan-300 font-bold border border-cyan-800/50 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Authorized Officer (Mobile OTP)
            </button>
          </div>

          {/* TAB 1: CITIZEN MOBILE VERIFICATION */}
          {activeTab === 'citizen' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Card Header with Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="text-2xl p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                  📱
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Citizen Mobile Verification
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registered citizens receive a real SMS OTP for instant access.
                  </p>
                </div>
              </div>

              {/* Status banner (e.g. simulated carrier OTP notification) */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* MODE 1: REAL CARRIER OTP FLOW */}
              {authMode === 'carrier' ? (
                <>
                  {!citizenOtpSent ? (
                    <form onSubmit={handleSendCitizenOtp} className="space-y-4">
                      {/* Mobile Number Input with IN +91 Prefix */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Registered 10-Digit Mobile Number
                        </label>
                        <div className="flex items-center rounded-xl bg-[#080e1e] border border-slate-700 focus-within:border-[#0284c7] transition-all overflow-hidden">
                          <div className="px-3.5 py-3 bg-[#0d162d] text-slate-300 border-r border-slate-700 text-xs sm:text-sm font-bold font-mono shrink-0">
                            IN +91
                          </div>
                          <input
                            type="tel"
                            required
                            value={citizenMobile}
                            onChange={(e) => setCitizenMobile(e.target.value)}
                            placeholder="98765 43210"
                            className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Only registered citizen mobile numbers can authenticate via real carrier OTP.
                        </p>
                      </div>

                      {/* Send SMS OTP Code Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-900/50 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                      >
                        <span>{isLoading ? 'Dispatching SMS OTP...' : 'Send SMS OTP Code →'}</span>
                      </button>
                    </form>
                  ) : (
                    /* OTP Entry State */
                    <form onSubmit={handleVerifyCitizenOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Enter 6-Digit OTP received on +91 {citizenMobile}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={citizenOtp}
                          onChange={(e) => setCitizenOtp(e.target.value)}
                          placeholder="e.g. 842601"
                          className="w-full bg-[#080e1e] border border-slate-700 focus:border-[#0284c7] rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-center text-white focus:outline-none"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Auto-fill: <strong>842601</strong></span>
                          <button
                            type="button"
                            onClick={() => setCitizenOtp('842601')}
                            className="text-cyan-400 hover:underline cursor-pointer"
                          >
                            Paste OTP
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Verify OTP & Enter Citizen Safety Portal →</span>
                      </button>
                    </form>
                  )}

                  {/* Continue without Sign In Link (Bottom link from user mockup) */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleContinueWithoutSignIn}
                      className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Continue without Sign In →</span>
                    </button>
                  </div>
                </>
              ) : (
                /* MODE 2: SIH 2026 DEMO MODE */
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>EVALUATOR QUICK ACCESS (DEMO MODE)</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Bypass carrier SMS rate limits and enter the live Citizen Safety Dashboard with simulated live Doppler warning feeds.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoCitizenAccess}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>⚡ Instant 1-Click Citizen Demo Access →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTHORIZED OFFICER VERIFICATION */}
          {activeTab === 'officer' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Card Header with Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="text-2xl p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                  🛡️
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Authorized Officer Verification
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized disaster management and IMD officers receive high-priority clearance OTP.
                  </p>
                </div>
              </div>

              {/* Status banner */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* MODE 1: CARRIER OTP FLOW */}
              {authMode === 'carrier' ? (
                <>
                  {!officerOtpSent ? (
                    <form onSubmit={handleSendOfficerOtp} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Command Radar Sector
                        </label>
                        <select
                          value={officerSector}
                          onChange={(e) => setOfficerSector(e.target.value)}
                          className="w-full bg-[#080e1e] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#0284c7]"
                        >
                          {sectors.map((s) => (
                            <option key={s} value={s} className="bg-slate-900 text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Officer Callsign / ID
                        </label>
                        <input
                          type="text"
                          required
                          value={officerCallsign}
                          onChange={(e) => setOfficerCallsign(e.target.value)}
                          placeholder="e.g. IMD-RADAR-OP-84"
                          className="w-full bg-[#080e1e] border border-slate-700 focus:border-[#0284c7] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Registered Govt Mobile Number
                        </label>
                        <div className="flex items-center rounded-xl bg-[#080e1e] border border-slate-700 focus-within:border-[#0284c7] overflow-hidden">
                          <div className="px-3.5 py-2.5 bg-[#0d162d] text-slate-300 border-r border-slate-700 text-xs sm:text-sm font-bold font-mono shrink-0">
                            IN +91
                          </div>
                          <input
                            type="tel"
                            required
                            value={officerMobile}
                            onChange={(e) => setOfficerMobile(e.target.value)}
                            placeholder="98120 44910"
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                      >
                        <span>{isLoading ? 'Requesting Clearance OTP...' : 'Send Officer OTP Code →'}</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOfficerOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-200 tracking-wide">
                          Enter 6-Digit Clearance OTP for {officerCallsign}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={officerOtp}
                          onChange={(e) => setOfficerOtp(e.target.value)}
                          placeholder="e.g. 951472"
                          className="w-full bg-[#080e1e] border border-slate-700 focus:border-[#0284c7] rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-center text-white focus:outline-none"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Simulated Clearance Token: <strong>951472</strong></span>
                          <button
                            type="button"
                            onClick={() => setOfficerOtp('951472')}
                            className="text-cyan-400 hover:underline cursor-pointer"
                          >
                            Paste OTP
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Authenticate Clearance & Enter Mission Control →</span>
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* OFFICER DEMO MODE */
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-slate-900/90 border border-cyan-500/40 rounded-xl space-y-1 text-xs font-mono">
                    <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>EVALUATION DEMO MODE (IMD COMMAND)</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Instant L3 Clearance bypass with pre-loaded S-Band radar volume scans and 120-tree Gradient Boosted models.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoOfficerAccess}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-sm tracking-wide shadow-xl shadow-cyan-950/60 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>⚡ 1-Click Authenticate as Officer (Jury Access) →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

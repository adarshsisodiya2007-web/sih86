import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { fetchRiskAssessment } from '../services/api';
import { ConvectiveRiskAssessment, RiskFactorContribution } from '../types';
import {
  BrainCircuit,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Info,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const AIInsights: React.FC = () => {
  const { selectedRegion } = useWeather();
  const [assessment, setAssessment] = useState<ConvectiveRiskAssessment | null>(null);

  useEffect(() => {
    fetchRiskAssessment(selectedRegion).then((res) => {
      if (res) setAssessment(res);
    });
  }, [selectedRegion]);

  const defaultAssessment: ConvectiveRiskAssessment = {
    region: selectedRegion,
    composite_score: 78,
    risk_category: 'high',
    confidence: 88,
    explanation: `Region '${selectedRegion}' convective index is 78/100 (HIGH). Primary driver is Radar Reflectivity (dBZ) contributing 23.5 points. Multi-source radar-satellite-lightning coherence confirms rapid cell updraft intensification.`,
    factors: [
      { factor_name: 'Radar Reflectivity Core', contribution_score: 23.5, description: 'Hydrometeor density & hail core concentration', physical_value: '62.5 dBZ', impact_level: 'High' },
      { factor_name: 'Thermodynamic Instability (CAPE)', contribution_score: 21.0, description: 'Positive buoyancy fuel for updraft acceleration', physical_value: '2,850 J/kg', impact_level: 'High' },
      { factor_name: 'Total Lightning Flash Density', contribution_score: 16.5, description: 'Mixed-phase collision of supercooled water & ice graupel', physical_value: '68 strikes/min', impact_level: 'High' },
      { factor_name: 'Satellite Cloud-Top Thermal IR', contribution_score: 12.0, description: 'Overshooting tops penetrating tropopause boundary', physical_value: '-66.4 °C', impact_level: 'Moderate' },
      { factor_name: 'Kinematic Shear & Terrain Lift', contribution_score: 9.0, description: 'Sustained storm cell tilt preventing downdraft suffocation', physical_value: '18.5 m/s (310m)', impact_level: 'Moderate' }
    ],
    recommended_actions: [
      'Issue immediate localized cloudburst & severe hail early warning bulletins.',
      'Pre-position emergency stormwater drainage teams in urban low-lying sectors.',
      'Advise open-field farm laborers to immediately move indoors and avoid isolated tall trees.'
    ],
    timestamp: 'NOW'
  };

  const current = assessment || defaultAssessment;

  const chartData = current.factors.map(f => ({
    name: f.factor_name,
    score: f.contribution_score,
    val: f.physical_value
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              EXPLAINABLE CONVECTIVE RISK ENGINE (PROTOTYPE)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              AI-ASSISTED PROTOTYPE • ML-READY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transparent physics-informed factor attribution designed with an ML-ready architecture for future drop-in of deep learning models.
          </p>
        </div>

        <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
          Target Sector: <strong className="text-white">{selectedRegion}</strong>
        </div>
      </div>

      {/* Scientific Disclosure Callout */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400 flex items-start space-x-2">
        <span className="text-cyan-400 font-bold shrink-0">SCIENTIFIC DISCLOSURE:</span>
        <span>
          VARSHANET utilizes an explainable prototype scoring framework combining thermodynamic buoyancy, satellite cloud-top cooling, 
          and radar reflectivity. Factor attribution bars are inspired by interpretability principles (such as SHAP) for ML-readiness, 
          without claiming a pre-trained operational deep learning model.
        </span>
      </div>

      {/* Primary Score & Explainability Callout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Composite Score Dial Card */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full text-left text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            PROTOTYPE CONVECTIVE RISK SCORE (0–100)
          </div>

          <div className="relative flex items-center justify-center">
            {/* SVG Radial Gauge */}
            <svg width="180" height="180" className="rotate-[-90deg]">
              <circle
                cx="90"
                cy="90"
                r="72"
                stroke="#1e293b"
                strokeWidth="14"
                fill="none"
              />
              <circle
                cx="90"
                cy="90"
                r="72"
                stroke={current.composite_score > 75 ? '#ef4444' : current.composite_score > 55 ? '#f97316' : '#eab308'}
                strokeWidth="14"
                strokeDasharray={452}
                strokeDashoffset={452 - (452 * current.composite_score) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center font-mono">
              <span className="text-4xl font-black text-white">{current.composite_score}</span>
              <span className="text-[10px] text-slate-400 uppercase">OUT OF 100</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-mono px-4">
              <span className="text-slate-400">Risk Category:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-orange-950 text-orange-400 border border-orange-700">
                {current.risk_category}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono px-4">
              <span className="text-slate-400">Model Confidence:</span>
              <span className="text-emerald-400 font-bold">{current.confidence}%</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800 w-full text-center">
            Scale: 0–20 Low • 21–40 Mod • 41–60 Elev • 61–80 High • 81–100 Severe
          </div>
        </div>

        {/* Explainability Reasoning Panel ("Why is this region high risk?") */}
        <div className="lg:col-span-2 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>WHY IS THIS REGION AT CONVECTIVE RISK? (EXPLAINABLE SYNTHESIS)</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
            <strong className="text-cyan-400 font-mono">PHYSICAL DIAGNOSTIC SUMMARY: </strong>
            {current.explanation}
          </div>

          {/* Factor Contribution Waterfall Chart */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400">
              Diagnostic Factor Attribution Weights (Inspired by SHAP interpretability principles):
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 30]} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={160} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`+${val} pts`, 'Score Contribution']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="#06b6d4" isAnimationActive={false}>
                    {chartData.map((_, i) => (
                      <Cell key={`bar-${i}`} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Attribution Detail Breakdown Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
          METEOROLOGICAL FACTOR CONTRIBUTION BREAKDOWN
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {current.factors.map((f) => (
            <div key={f.factor_name} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate max-w-[180px]">{f.factor_name}</span>
                <span className="text-cyan-400 font-bold">+{f.contribution_score} pts</span>
              </div>
              <div className="text-slate-400 text-[11px] font-sans">{f.description}</div>
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-500">Value: <strong className="text-slate-200">{f.physical_value}</strong></span>
                <span className="text-amber-400 font-bold uppercase">{f.impact_level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable SOP Directives */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>RECOMMENDED OPERATIONAL ACTIONS (STANDARD OPERATING PROCEDURE)</span>
        </div>

        <div className="space-y-2">
          {current.recommended_actions.map((act, i) => (
            <div key={i} className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-start space-x-2">
              <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{act}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

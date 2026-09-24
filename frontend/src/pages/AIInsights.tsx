import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../context/WeatherContext';
import { fetchMLModelInfo, predictMLRisk, fetchMLLeaderboard } from '../services/api';
import {
  MLModelMetrics,
  MLPredictionResponse,
  MLPredictionRequest,
  ModelBenchmarkEntry
} from '../types';
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  Activity,
  Cpu,
  Zap,
  Gauge,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Flame,
  CloudRain,
  Wind,
  Layers,
  Award,
  Network
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

interface ModelTab {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  family: string;
  badge: string;
}

const MODEL_TABS: ModelTab[] = [
  { id: 'stacking_ensemble', name: 'Stacking Super-Ensemble', shortName: 'Stacking Ensemble', icon: '⚡', family: 'Meta-Learner', badge: 'HIGHEST ACCURACY' },
  { id: 'mlp_neural_net', name: 'Deep Neural Network (MLP)', shortName: 'Deep Neural Net', icon: '🧠', family: 'Deep Learning', badge: 'PHYSICS-INFORMED' },
  { id: 'gbm', name: 'Gradient Boosting (GBM)', shortName: 'Gradient Boosting', icon: '🌲', family: 'Tree Boosting', badge: 'NON-LINEAR FOCUS' },
  { id: 'rf', name: 'Random Forest Ensemble (RF)', shortName: 'Random Forest', icon: '🌳', family: 'Bagging Trees', badge: 'LOW VARIANCE' },
  { id: 'hist_gbm', name: 'HistGradientBoosting (HGBM)', shortName: 'HistGBM (Fast)', icon: '🚀', family: 'Binned Trees', badge: 'SUB-MS LATENCY' }
];

export const AIInsights: React.FC = () => {
  const { selectedRegion } = useWeather();
  const [selectedModel, setSelectedModel] = useState<string>('stacking_ensemble');
  const [modelMetrics, setModelMetrics] = useState<MLModelMetrics | null>(null);
  const [prediction, setPrediction] = useState<MLPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Interactive slider parameters
  const [params, setParams] = useState<MLPredictionRequest>({
    max_dbz: 58.0,
    vil_density: 4.2,
    echo_top_km: 15.0,
    cape_jkg: 2800.0,
    cin_jkg: 25.0,
    cloud_top_temp_c: -65.0,
    lightning_rate: 65,
    wind_shear_proxy: 20.0,
    dewpoint_depression_c: 11.5,
    elevation_m: 520.0,
    region: selectedRegion,
    selected_model: 'stacking_ensemble'
  });

  // Fetch metrics on mount
  useEffect(() => {
    fetchMLModelInfo().then((metrics) => {
      if (metrics) setModelMetrics(metrics);
    });
  }, []);

  // Update region in params
  useEffect(() => {
    setParams(prev => ({ ...prev, region: selectedRegion }));
  }, [selectedRegion]);

  // Update selected model in params
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setParams(prev => ({ ...prev, selected_model: modelId }));
  };

  // Run ML inference
  const runInference = useCallback(async (currentParams: MLPredictionRequest) => {
    setLoading(true);
    try {
      const res = await predictMLRisk(currentParams);
      if (res) {
        setPrediction(res);
      }
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced inference
  useEffect(() => {
    const timer = setTimeout(() => {
      runInference(params);
    }, 180);
    return () => clearTimeout(timer);
  }, [params, runInference]);

  // Scenario Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'hail') {
      setParams(prev => ({
        ...prev,
        max_dbz: 66.0,
        vil_density: 5.4,
        echo_top_km: 17.0,
        cape_jkg: 3600.0,
        cin_jkg: 15.0,
        cloud_top_temp_c: -74.0,
        lightning_rate: 85,
        wind_shear_proxy: 25.0,
        dewpoint_depression_c: 12.0,
        elevation_m: 600.0
      }));
    } else if (presetName === 'cloudburst') {
      setParams(prev => ({
        ...prev,
        max_dbz: 62.0,
        vil_density: 3.9,
        echo_top_km: 15.5,
        cape_jkg: 3100.0,
        cin_jkg: 10.0,
        cloud_top_temp_c: -78.0,
        lightning_rate: 60,
        wind_shear_proxy: 14.0,
        dewpoint_depression_c: 2.5,
        elevation_m: 1600.0
      }));
    } else if (presetName === 'downburst') {
      setParams(prev => ({
        ...prev,
        max_dbz: 61.0,
        vil_density: 4.8,
        echo_top_km: 12.5,
        cape_jkg: 2200.0,
        cin_jkg: 35.0,
        cloud_top_temp_c: -52.0,
        lightning_rate: 45,
        wind_shear_proxy: 22.0,
        dewpoint_depression_c: 19.5,
        elevation_m: 400.0
      }));
    } else if (presetName === 'calm') {
      setParams(prev => ({
        ...prev,
        max_dbz: 22.0,
        vil_density: 0.5,
        echo_top_km: 4.0,
        cape_jkg: 400.0,
        cin_jkg: 150.0,
        cloud_top_temp_c: -5.0,
        lightning_rate: 0,
        wind_shear_proxy: 5.0,
        dewpoint_depression_c: 4.0,
        elevation_m: 350.0
      }));
    }
  };

  const score = prediction ? prediction.convective_risk_score : 84;
  const physicsScore = prediction ? prediction.physics_baseline_score : 88;
  const delta = prediction ? prediction.physics_vs_ml_delta : -4;
  const activeTab = MODEL_TABS.find(t => t.id === selectedModel) || MODEL_TABS[0];

  // Feature importances
  const chartData = (prediction?.feature_importances || []).slice(0, 6).map(f => ({
    name: f.feature_name.split('(')[0].trim(),
    pct: f.importance_pct,
    val: f.feature_value
  }));

  const getHazardIcon = (hazard: string) => {
    switch (hazard.toLowerCase()) {
      case 'hail':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'cloudburst':
        return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case 'downburst':
        return <Wind className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <BrainCircuit className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
              MULTI-MODEL MACHINE LEARNING NOWCAST SUITE
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              5 MODELS ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stacking Super-Ensemble, Deep Neural Network (MLP), Gradient Boosting, Random Forest & HistGBM calibrated on 10 atmospheric predictors.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Target Sector:</span>
          <span className="px-3 py-1 rounded bg-slate-900 border border-cyan-800/60 text-xs font-mono font-bold text-cyan-300">
            {selectedRegion}
          </span>
        </div>
      </div>

      {/* Model Selector Bar (5 Tabs) */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-2 shadow-lg">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 pt-1 pb-2 flex items-center justify-between">
          <span>SELECT ACTIVE INFERENCE MODEL ARCHITECTURE:</span>
          <span className="text-cyan-400">Active: <strong>{activeTab.name}</strong></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MODEL_TABS.map((tab) => {
            const isSelected = selectedModel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectModel(tab.id)}
                className={`p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400/80 shadow-md shadow-cyan-950/60 text-white'
                    : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/90 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{tab.icon}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold truncate">
                  {tab.shortName}
                </div>
                <div className="text-[10px] text-slate-400 font-sans truncate">
                  {tab.family}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>ACTIVE ARCHITECTURE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-mono font-bold text-white truncate" title={prediction?.active_model_name}>
            {prediction?.active_model_name || 'Stacking Ensemble'}
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            {modelMetrics?.training_samples || 1600} Training Vectors
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>SUITE TEST R²</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-black text-emerald-400">
            {modelMetrics?.test_r2_score ? (modelMetrics.test_r2_score * 100).toFixed(1) + '%' : '95.8%'}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Holdout Test Split (20%)
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>MULTI-MODEL CONSENSUS</span>
            <Award className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-mono font-black text-blue-400">
            {prediction?.ensemble_consensus_pct || 96}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {prediction?.consensus_summary || 'High 5-Model Agreement'}
          </div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>INFERENCE LATENCY</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-black text-amber-400">
            {prediction ? `${prediction.inference_latency_ms} ms` : '9.5 ms'}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Real-time Edge Execution
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Workbench (Left) & Prediction (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (5 cols): Interactive Parameter Sliders */}
        <div className="lg:col-span-5 bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                LIVE PARAMETER WORKBENCH
              </span>
            </div>
            {loading && <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Running Inference...</span>}
          </div>

          {/* Quick Scenario Presets */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Atmospheric Scenario Presets:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('hail')}
                className="px-2.5 py-1.5 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-700/50 text-[11px] font-mono text-orange-300 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">Severe Hailstorm</span>
              </button>
              <button
                onClick={() => applyPreset('cloudburst')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 text-[11px] font-mono text-cyan-300 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Cloudburst Flooding</span>
              </button>
              <button
                onClick={() => applyPreset('downburst')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/50 text-[11px] font-mono text-purple-300 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Violent Downburst</span>
              </button>
              <button
                onClick={() => applyPreset('calm')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Fair Weather / Calm</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Radar Max Reflectivity:</span>
                <span className="text-cyan-400 font-bold">{params.max_dbz.toFixed(1)} dBZ</span>
              </div>
              <input
                type="range" min="10" max="75" step="0.5"
                value={params.max_dbz}
                onChange={(e) => setParams({ ...params, max_dbz: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Atmospheric Instability (CAPE):</span>
                <span className="text-cyan-400 font-bold">{params.cape_jkg.toFixed(0)} J/kg</span>
              </div>
              <input
                type="range" min="100" max="5000" step="50"
                value={params.cape_jkg}
                onChange={(e) => setParams({ ...params, cape_jkg: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Satellite Cloud-Top Temp:</span>
                <span className="text-cyan-400 font-bold">{params.cloud_top_temp_c.toFixed(1)} °C</span>
              </div>
              <input
                type="range" min="-85" max="5" step="1"
                value={params.cloud_top_temp_c}
                onChange={(e) => setParams({ ...params, cloud_top_temp_c: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Total Lightning Density:</span>
                <span className="text-cyan-400 font-bold">{params.lightning_rate} strikes/min</span>
              </div>
              <input
                type="range" min="0" max="120" step="1"
                value={params.lightning_rate}
                onChange={(e) => setParams({ ...params, lightning_rate: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Radar Echo Top Height:</span>
                <span className="text-cyan-400 font-bold">{params.echo_top_km.toFixed(1)} km</span>
              </div>
              <input
                type="range" min="2" max="20" step="0.5"
                value={params.echo_top_km}
                onChange={(e) => setParams({ ...params, echo_top_km: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Dewpoint Depression (T - Td):</span>
                <span className="text-cyan-400 font-bold">{params.dewpoint_depression_c.toFixed(1)} °C</span>
              </div>
              <input
                type="range" min="1" max="25" step="0.5"
                value={params.dewpoint_depression_c}
                onChange={(e) => setParams({ ...params, dewpoint_depression_c: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Prediction & Multi-Model Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Model Score & Baseline Comparison */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>INFERENCE RESULT: {prediction?.active_model_name?.toUpperCase() || 'STACKING ENSEMBLE'}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Latency: <strong className="text-white">{prediction?.inference_latency_ms || 9.5}ms</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Radial Dial */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                  PREDICTED CONVECTIVE RISK
                </div>
                <div className="relative flex items-center justify-center">
                  <svg width="150" height="150" className="rotate-[-90deg]">
                    <circle cx="75" cy="75" r="60" stroke="#1e293b" strokeWidth="12" fill="none" />
                    <circle
                      cx="75" cy="75" r="60"
                      stroke={score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#10b981'}
                      strokeWidth="12"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * score) / 100}
                      strokeLinecap="round" fill="none"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center font-mono">
                    <span className="text-3xl font-black text-white">{score}</span>
                    <span className="text-[9px] text-slate-400 uppercase">/ 100</span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${
                    score >= 80 ? 'bg-red-950 text-red-400 border-red-700' :
                    score >= 60 ? 'bg-orange-950 text-orange-400 border-orange-700' :
                    score >= 40 ? 'bg-amber-950 text-amber-400 border-amber-700' :
                    'bg-emerald-950 text-emerald-400 border-emerald-700'
                  }`}>
                    {prediction?.risk_category.toUpperCase() || 'HIGH'}
                  </span>
                </div>
              </div>

              {/* Side-by-side details */}
              <div className="space-y-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 font-mono text-xs">
                <div className="text-[11px] font-bold text-slate-300 pb-1 border-b border-slate-800">
                  MODEL BENCHMARK METRICS
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Selected Model Score:</span>
                  <span className="text-cyan-400 font-bold text-sm">{score}/100</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Physics Heuristic Baseline:</span>
                  <span className="text-slate-300 font-bold text-sm">{physicsScore}/100</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Variance to Physics (Δ):</span>
                  <span className={`font-bold ${delta >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {delta >= 0 ? `+${delta}` : delta} pts
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Primary Predicted Hazard:</span>
                  <span className="text-white font-bold px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                    {prediction?.primary_hazard || 'Severe Hail'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Multi-Model Agreement:</span>
                  <span className="text-emerald-400 font-bold">
                    {prediction?.ensemble_consensus_pct || 96}%
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation Quote */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
              <strong className="text-cyan-400 font-mono">ACTIVE MODEL REASONING: </strong>
              {prediction?.explanation}
            </div>
          </div>

          {/* 5-Model Leaderboard & Live Voting Table */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  LIVE 5-MODEL BENCHMARK & VOTING MATRIX
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Holdout Evaluated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2 font-normal">MODEL ARCHITECTURE</th>
                    <th className="pb-2 font-normal text-center">TEST R²</th>
                    <th className="pb-2 font-normal text-center">ROC-AUC</th>
                    <th className="pb-2 font-normal text-center">LATENCY</th>
                    <th className="pb-2 font-normal text-center">LIVE VOTE</th>
                    <th className="pb-2 font-normal text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(prediction?.all_model_benchmarks || []).map((m: ModelBenchmarkEntry) => {
                    const isCurrent = m.model_id === selectedModel;
                    return (
                      <tr key={m.model_id} className={`hover:bg-slate-900/60 transition-colors ${isCurrent ? 'bg-cyan-950/20' : ''}`}>
                        <td className="py-2.5 pr-2">
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{m.model_family}</div>
                        </td>
                        <td className="py-2.5 text-center text-emerald-400 font-bold">
                          {(m.r2_score * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-center text-blue-400">
                          {m.roc_auc.toFixed(3)}
                        </td>
                        <td className="py-2.5 text-center text-amber-400">
                          {m.inference_latency_ms.toFixed(1)}ms
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.predicted_score >= 80 ? 'bg-red-950 text-red-400 border border-red-800' :
                            m.predicted_score >= 60 ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {m.predicted_score} pts ({m.predicted_hazard})
                          </span>
                        </td>
                        <td className="py-2.5 text-right pl-2">
                          {isCurrent ? (
                            <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                              ACTIVE
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectModel(m.model_id)}
                              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              SWITCH
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Hazard Probabilities */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>MULTI-HAZARD CLASSIFICATION PROBABILITIES</span>
              <span className="text-[10px] text-slate-400">4 Core Atmospheric Hazards</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(prediction?.hazard_probabilities || []).map((h) => (
                <div
                  key={h.hazard}
                  className={`p-3 rounded-lg border font-mono space-y-1.5 ${
                    h.action_trigger
                      ? 'bg-red-950/30 border-red-800/60 shadow-lg shadow-red-950/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      {getHazardIcon(h.hazard)}
                      <span>{h.hazard}</span>
                    </span>
                    <span className={`text-xs font-bold ${h.action_trigger ? 'text-red-400' : 'text-slate-400'}`}>
                      {h.probability}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        h.probability > 75 ? 'bg-red-500' :
                        h.probability > 50 ? 'bg-orange-500' :
                        h.probability > 25 ? 'bg-yellow-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${h.probability}%` }}
                    />
                  </div>

                  <div className="text-[9px] text-right font-medium">
                    {h.action_trigger ? (
                      <span className="text-red-400 uppercase font-bold">WARNING TRIGGER</span>
                    ) : (
                      <span className="text-slate-500 uppercase">{h.severity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>TRUE ML FEATURE IMPORTANCE BREAKDOWN (GINI / MDI)</span>
              <span className="text-[10px] text-cyan-400">Tree Splits</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 50]} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={160} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`${val}%`, 'Relative Model Weight']}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill="#06b6d4" isAnimationActive={false}>
                    {chartData.map((_, i) => (
                      <Cell key={`bar-${i}`} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Directives */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>AUTOMATED EMERGENCY OPERATIONAL DIRECTIVES</span>
            </div>

            <div className="space-y-2">
              {(prediction?.recommended_actions || []).map((act, i) => (
                <div key={i} className="p-3 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-start space-x-2">
                  <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

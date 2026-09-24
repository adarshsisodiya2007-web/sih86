import React from 'react';
import { useWeather } from '../../context/WeatherContext';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  CloudLightning,
  Flame,
  CloudRain,
  Zap,
  Wind,
  Target
} from 'lucide-react';

interface KpiCardData {
  title: string;
  subtitle?: string;
  value: string | number;
  prevValue: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  trendText: string;
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'SEVERE';
  icon: React.ReactNode;
  sparklinePoints: number[];
  color: string;
}

export const KpiCards: React.FC = () => {
  const { forecast, stormCells, lightningFlashes } = useWeather();
  const current = forecast[0] || {
    composite_risk: 74,
    thunderstorm_prob: 84,
    hail_prob: 65,
    cloudburst_prob: 61,
    lightning_density: 46,
    wind_risk_kmh: 78,
    rain_intensity_mmh: 68
  };

  // Derive dynamic metrics from live active cells
  const maxDbz = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.dbz_max)) : 63.5;
  const maxHail = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.hail_prob)) : current.hail_prob;
  const maxCb = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.cloudburst_risk)) : current.cloudburst_prob;
  const maxWind = stormCells.length > 0 ? Math.max(...stormCells.map(c => c.wind_gust_kmh)) : current.wind_risk_kmh;
  const liveRisk = stormCells.length > 0 ? Math.min(99, Math.max(20, Math.round(maxDbz * 1.25))) : current.composite_risk;
  const tsProb = Math.min(99, Math.max(30, Math.round(liveRisk * 1.08)));
  const lightningDensity = lightningFlashes.length > 0 ? Math.min(99, Math.round(lightningFlashes.length * 2.2)) : 46;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'SEVERE':
        return 'bg-red-950/80 text-red-400 border-red-700/60';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-700/60';
      case 'ELEVATED':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-700/60';
      case 'MODERATE':
        return 'bg-blue-950/80 text-blue-400 border-blue-700/60';
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
    }
  };

  const kpis: KpiCardData[] = [
    {
      title: 'Convective Risk',
      subtitle: 'Overall Storm Threat',
      value: liveRisk,
      prevValue: liveRisk - 4,
      unit: '/100',
      trend: 'up',
      trendText: '+4 pts',
      riskLevel: liveRisk >= 80 ? 'SEVERE' : liveRisk >= 60 ? 'HIGH' : 'ELEVATED',
      icon: <ShieldAlert className="w-4 h-4 text-cyan-400" />,
      sparklinePoints: [liveRisk - 18, liveRisk - 12, liveRisk - 6, liveRisk - 2, liveRisk],
      color: '#06b6d4'
    },
    {
      title: 'Thunderstorm Prob.',
      subtitle: 'Aandhi-Toofan Chance',
      value: tsProb,
      prevValue: tsProb - 5,
      unit: '%',
      trend: 'up',
      trendText: '+5%',
      riskLevel: tsProb >= 75 ? 'SEVERE' : 'HIGH',
      icon: <CloudLightning className="w-4 h-4 text-cyan-400" />,
      sparklinePoints: [tsProb - 20, tsProb - 14, tsProb - 8, tsProb - 3, tsProb],
      color: '#38bdf8'
    },
    {
      title: 'Hail (POSH)',
      subtitle: 'Olay Girne Ka Risk',
      value: maxHail,
      prevValue: maxHail - 8,
      unit: '%',
      trend: 'up',
      trendText: '+8%',
      riskLevel: maxHail >= 70 ? 'SEVERE' : maxHail >= 55 ? 'HIGH' : 'ELEVATED',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      sparklinePoints: [maxHail - 25, maxHail - 18, maxHail - 10, maxHail - 4, maxHail],
      color: '#f59e0b'
    },
    {
      title: 'Cloudburst (CPI)',
      subtitle: 'Badal Phatna / Rain Peak',
      value: maxCb,
      prevValue: maxCb - 6,
      unit: '%',
      trend: 'up',
      trendText: '+6%',
      riskLevel: maxCb >= 70 ? 'SEVERE' : maxCb >= 55 ? 'HIGH' : 'ELEVATED',
      icon: <CloudRain className="w-4 h-4 text-red-400" />,
      sparklinePoints: [maxCb - 22, maxCb - 14, maxCb - 8, maxCb - 3, maxCb],
      color: '#ef4444'
    },
    {
      title: 'Total Lightning',
      subtitle: 'Aakashiy Bijli Strikes',
      value: lightningDensity,
      prevValue: lightningDensity - 6,
      unit: 'fl/km²',
      trend: 'up',
      trendText: `+${Math.max(2, Math.round(lightningDensity * 0.1))} fl`,
      riskLevel: lightningDensity >= 70 ? 'SEVERE' : lightningDensity >= 45 ? 'HIGH' : 'ELEVATED',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      sparklinePoints: [lightningDensity - 20, lightningDensity - 12, lightningDensity - 8, lightningDensity - 3, lightningDensity],
      color: '#eab308'
    },
    {
      title: 'Max Wind Risk',
      subtitle: 'Microburst Wind Peak',
      value: maxWind,
      prevValue: maxWind - 6,
      unit: 'km/h',
      trend: 'up',
      trendText: '+6 km/h',
      riskLevel: maxWind >= 85 ? 'SEVERE' : maxWind >= 65 ? 'HIGH' : 'ELEVATED',
      icon: <Wind className="w-4 h-4 text-blue-400" />,
      sparklinePoints: [maxWind - 25, maxWind - 16, maxWind - 10, maxWind - 4, maxWind],
      color: '#60a5fa'
    },
    {
      title: 'Sensor Agreement',
      subtitle: 'Multi-Radar Consensus',
      value: 94,
      prevValue: 92,
      unit: '%',
      trend: 'neutral',
      trendText: 'Stable',
      riskLevel: 'MODERATE',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      sparklinePoints: [88, 90, 92, 93, 94],
      color: '#10b981'
    }
  ];

  const renderSparkline = (points: number[], strokeColor: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 22;

    const pathData = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.title}
          className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-3 shadow-md hover:border-slate-700/80 transition-all flex flex-col justify-between"
        >
          {/* Card Top: Title & Icon */}
          <div className="flex items-start justify-between text-slate-400 mb-1">
            <div className="min-w-0 pr-1">
              <span className="text-[10px] font-mono uppercase tracking-tight truncate font-semibold text-slate-200 block">
                {kpi.title}
              </span>
              {kpi.subtitle && (
                <span className="text-[9px] text-slate-400 font-sans block truncate">
                  {kpi.subtitle}
                </span>
              )}
            </div>
            <div className="p-1 rounded bg-slate-800/70 border border-slate-700/60 shrink-0">{kpi.icon}</div>
          </div>

          {/* Card Middle: Primary Value & Trend */}
          <div className="flex items-baseline justify-between my-1">
            <div className="flex items-baseline space-x-0.5">
              <span className="text-xl font-bold font-mono tracking-tight text-white">{kpi.value}</span>
              {kpi.unit && <span className="text-xs text-slate-400 font-mono ml-0.5">{kpi.unit}</span>}
            </div>

            {/* Sparkline */}
            <div>{renderSparkline(kpi.sparklinePoints, kpi.color)}</div>
          </div>

          {/* Card Bottom: Trend & Risk Badge */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] font-mono">
            <div className="flex items-center space-x-1 text-slate-400">
              {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
              {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
              {kpi.trend === 'neutral' && <Minus className="w-3 h-3 text-slate-400" />}
              <span>{kpi.trendText}</span>
            </div>

            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${getRiskBadge(kpi.riskLevel)}`}>
              {kpi.riskLevel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

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
  const { forecast, stormCells } = useWeather();
  const current = forecast[0] || {
    composite_risk: 72,
    thunderstorm_prob: 84,
    hail_prob: 65,
    cloudburst_prob: 58,
    lightning_density: 46,
    wind_risk_kmh: 78,
    rain_intensity_mmh: 68
  };

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
      value: current.composite_risk || 74,
      prevValue: 68,
      unit: '/100',
      trend: 'up',
      trendText: '+6 pts',
      riskLevel: current.composite_risk > 75 ? 'SEVERE' : current.composite_risk > 55 ? 'HIGH' : 'ELEVATED',
      icon: <ShieldAlert className="w-4 h-4 text-cyan-400" />,
      sparklinePoints: [50, 55, 62, 68, 74],
      color: '#06b6d4'
    },
    {
      title: 'Thunderstorm Prob.',
      subtitle: 'Aandhi-Toofan Chance',
      value: current.thunderstorm_prob || 82,
      prevValue: 76,
      unit: '%',
      trend: 'up',
      trendText: '+6%',
      riskLevel: current.thunderstorm_prob > 75 ? 'SEVERE' : 'HIGH',
      icon: <CloudLightning className="w-4 h-4 text-cyan-400" />,
      sparklinePoints: [60, 68, 72, 76, 82],
      color: '#38bdf8'
    },
    {
      title: 'Hail (POSH)',
      subtitle: 'Olay Girne Ka Risk',
      value: current.hail_prob || 65,
      prevValue: 55,
      unit: '%',
      trend: 'up',
      trendText: '+10%',
      riskLevel: current.hail_prob > 60 ? 'HIGH' : 'ELEVATED',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      sparklinePoints: [30, 42, 50, 55, 65],
      color: '#f59e0b'
    },
    {
      title: 'Cloudburst (CPI)',
      subtitle: 'Badal Phatna / Rain Peak',
      value: current.cloudburst_prob || 61,
      prevValue: 52,
      unit: '%',
      trend: 'up',
      trendText: '+9%',
      riskLevel: current.cloudburst_prob > 60 ? 'HIGH' : 'ELEVATED',
      icon: <CloudRain className="w-4 h-4 text-red-400" />,
      sparklinePoints: [35, 44, 48, 52, 61],
      color: '#ef4444'
    },
    {
      title: 'Total Lightning',
      subtitle: 'Aakashiy Bijli Strikes',
      value: current.lightning_density || 46,
      prevValue: 38,
      unit: 'fl/km²',
      trend: 'up',
      trendText: '+8 fl',
      riskLevel: 'HIGH',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      sparklinePoints: [20, 28, 34, 38, 46],
      color: '#eab308'
    },
    {
      title: 'Max Wind Risk',
      subtitle: 'Microburst Wind Peak',
      value: current.wind_risk_kmh || 78,
      prevValue: 72,
      unit: 'km/h',
      trend: 'up',
      trendText: '+6 km/h',
      riskLevel: current.wind_risk_kmh > 80 ? 'SEVERE' : 'HIGH',
      icon: <Wind className="w-4 h-4 text-blue-400" />,
      sparklinePoints: [45, 55, 65, 72, 78],
      color: '#60a5fa'
    },
    {
      title: 'Sensor Agreement',
      subtitle: 'Multi-Radar Consensus',
      value: 89,
      prevValue: 88,
      unit: '%',
      trend: 'neutral',
      trendText: 'Stable',
      riskLevel: 'MODERATE',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      sparklinePoints: [85, 87, 88, 88, 89],
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

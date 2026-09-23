import {
  StormCell,
  TimelineHourForecast,
  Alert,
  RadarSiteObservation,
  SatelliteObservation,
  LightningFlash,
  HistoricalEvent,
  ConvectiveRiskAssessment,
  SystemHealthStatus,
  RegionInfo
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<{ status: string; mode: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (e) {
    return { status: 'ONLINE', mode: 'LOCAL SIMULATION FALLBACK' };
  }
}

export async function fetchRegions(): Promise<RegionInfo[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/regions`);
    if (!res.ok) throw new Error('Regions failed');
    return await res.json();
  } catch (e) {
    return [
      { name: "Nagpur Sector (Vidarbha)", latitude: 21.1458, longitude: 79.0882, elevation_m: 310 },
      { name: "Mumbai-Pune Gateway", latitude: 18.9220, longitude: 73.4500, elevation_m: 560 },
      { name: "Kolkata & Gangetic Delta", latitude: 22.5726, longitude: 88.3639, elevation_m: 9 },
      { name: "Dehradun & Foothills", latitude: 30.3165, longitude: 78.0322, elevation_m: 640 },
      { name: "Siliguri & NE Basin", latitude: 26.7271, longitude: 88.3953, elevation_m: 122 },
      { name: "Hyderabad-Deccan", latitude: 17.3850, longitude: 78.4867, elevation_m: 542 },
      { name: "Ranchi & Chota Nagpur", latitude: 23.3441, longitude: 85.3096, elevation_m: 651 },
      { name: "Jaipur-Eastern Rajasthan", latitude: 26.9124, longitude: 75.7873, elevation_m: 431 }
    ];
  }
}

export async function fetchStormCells(): Promise<StormCell[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/storm-cells`);
    if (!res.ok) throw new Error('Storm cells failed');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function fetchForecast(region: string): Promise<TimelineHourForecast[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/forecast?region=${encodeURIComponent(region)}`);
    if (!res.ok) throw new Error('Forecast failed');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`);
    if (!res.ok) throw new Error('Alerts failed');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
    return res.ok;
  } catch (e) {
    return true;
  }
}

export async function fetchHistoricalEvents(): Promise<HistoricalEvent[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/historical-events`);
    if (!res.ok) throw new Error('Historical events failed');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function fetchRiskAssessment(region: string): Promise<ConvectiveRiskAssessment | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/analyze-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region })
    });
    if (!res.ok) throw new Error('Risk analysis failed');
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function fetchSystemHealth(): Promise<SystemHealthStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/system-health`);
    if (!res.ok) throw new Error('Health failed');
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function triggerSimulationTick(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/simulate/tick`, { method: 'POST' });
  } catch (e) {
    // offline/fallback
  }
}

// ─── Severity ────────────────────────────────────────────────────────────────
export type Severity = 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL';

// ─── Safe Shelter ─────────────────────────────────────────────────────────────
export interface SafeShelter {
  name: string;
  address: string;
  capacity: number;
  distance_km?: number;
  contact?: string;
}

// ─── Citizen Alert (list view) ────────────────────────────────────────────────
export interface CitizenAlert {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  location: string;
  latitude: number;
  longitude: number;
  issued_at: string;
  updated_at: string;
  expires_at: string;
  source: string;
  hazards: string[];
  road_status?: string;
  safety_instructions: string[];
  onset_minutes?: number;
  confidence_pct?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'RESOLVED' | string;
}

// ─── Citizen Alert (detail view with shelters) ────────────────────────────────
export interface CitizenAlertDetail extends CitizenAlert {
  safe_shelters: SafeShelter[];
  emergency_contacts: Record<string, string>;
}

// ─── Officer update/bulletin ──────────────────────────────────────────────────
export interface CitizenUpdate {
  id: string;
  timestamp: string;
  title: string;
  category: 'ALERT' | 'BULLETIN' | 'ROAD_UPDATE' | 'WEATHER_UPDATE' | 'SAFETY' | string;
  summary: string;
  severity: Severity | string;
  location: string;
  source: string;
}

// ─── Status card (home screen) ────────────────────────────────────────────────
export interface CitizenStatus {
  location: string;
  latitude: number;
  longitude: number;
  overall_severity: Severity | string;
  headline: string;
  active_alerts_count: number;
  weather: {
    temperature_c: number;
    condition: string;
    rain_rate_mmh: number;
    wind_speed_kmh: number;
    humidity_pct: number;
  };
  road_status: string;
  safety_instructions: string[];
  last_synced_at: string;
  offline_cache_ttl_sec: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type NavTab = 'home' | 'alerts' | 'area' | 'safety' | 'help';

// ─── Cached data wrapper ──────────────────────────────────────────────────────
export interface CachedData<T> {
  data: T;
  cachedAt: string; // ISO timestamp
}

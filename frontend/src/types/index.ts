export type SeverityLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export type HazardType = 'thunderstorm' | 'hail' | 'cloudburst' | 'downburst' | 'lightning';

export interface StormCell {
  cell_id: string;
  name: string;
  latitude: number;
  longitude: number;
  intensity: SeverityLevel;
  movement_deg: number;
  speed_kmh: number;
  detected_at: string;
  eta_minutes: number;
  hazards: HazardType[];
  confidence: number;
  dbz_max: number;
  vil_kgm2: number;
  echo_top_km: number;
  cape_jkg: number;
  hail_prob: number;
  cloudburst_risk: number;
  wind_gust_kmh: number;
  rain_rate_mmh: number;
  polygon_coords: [number, number][];
  trajectory_points: [number, number][];
}

export interface WeatherObservation {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  temp_c: number;
  dew_point_c: number;
  rh_percent: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  wind_dir_deg: number;
  rain_rate_mmh: number;
  cape_proxy: number;
  cin_proxy: number;
  timestamp: string;
}

export interface RadarSiteObservation {
  radar_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  range_km: number;
  max_dbz: number;
  vil_kgm2: number;
  echo_top_km: number;
  scan_time: string;
  status: string;
}

export interface SatelliteObservation {
  satellite_name: string;
  channel: string;
  cloud_top_temp_c: number;
  cooling_rate_c_15min: number;
  olr_wm2: number;
  scan_time: string;
  convective_cloud_mask: boolean;
}

export interface LightningFlash {
  flash_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  peak_current_ka: number;
  flash_type: 'CG' | 'IC';
  strike_rate_min: number;
}

export interface TimelineHourForecast {
  hour_offset: number;
  label: string;
  timestamp: string;
  thunderstorm_prob: number;
  hail_prob: number;
  cloudburst_prob: number;
  lightning_density: number;
  rain_intensity_mmh: number;
  wind_risk_kmh: number;
  composite_risk: number;
  severity: SeverityLevel;
}

export type AlertLifecycleStatus = 'DRAFT' | 'PENDING REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'EXPIRED' | 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  alert_id: string;
  title: string;
  region: string;
  severity: SeverityLevel;
  hazards: HazardType[];
  probability: number;
  onset_minutes: number;
  confidence: number;
  recommended_action: string;
  issued_at: string;
  expires_at: string;
  status: AlertLifecycleStatus;
  affected_population_est: number;
  lifecycle_status?: 'DRAFT' | 'PENDING REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'EXPIRED';
  risk_score?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  published_at?: string;
  rejection_reason?: string;
  road_status?: string;
  safety_instructions?: string[];
}

export interface SafeShelterPublic {
  name: string;
  address: string;
  capacity: number;
  distance_km?: number;
  contact?: string;
}

export interface CitizenAlertPublic {
  id: string;
  title: string;
  message: string;
  severity: 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL';
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

export interface CitizenAlertDetailPublic extends CitizenAlertPublic {
  safe_shelters: SafeShelterPublic[];
  emergency_contacts: Record<string, string>;
}

export interface CitizenUpdatePublic {
  id: string;
  timestamp: string;
  title: string;
  category: 'ALERT' | 'BULLETIN' | 'ROAD_UPDATE' | 'WEATHER_UPDATE' | 'SAFETY' | string;
  summary: string;
  severity: 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL' | string;
  location: string;
  source: string;
}

export interface CitizenStatusPublic {
  location: string;
  latitude: number;
  longitude: number;
  overall_severity: 'NORMAL' | 'WATCH' | 'HIGH' | 'CRITICAL' | string;
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

export interface SystemEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  severity?: 'normal' | 'info' | 'elevated' | 'high' | 'severe' | 'critical' | string;
  actor?: string;
  status?: string;
  region?: string;
}

export interface RiskFactorContribution {
  factor_name: string;
  contribution_score: number;
  description: string;
  physical_value: string;
  impact_level: string;
}

export interface ConvectiveRiskAssessment {
  region: string;
  composite_score: number;
  risk_category: SeverityLevel;
  confidence: number;
  explanation: string;
  factors: RiskFactorContribution[];
  recommended_actions: string[];
  timestamp: string;
}

export interface HistoricalEvent {
  event_id: string;
  name: string;
  date: string;
  region: string;
  duration_hours: number;
  max_rainfall_mm: number;
  peak_lightning_rate: number;
  observed_hazards: HazardType[];
  damage_severity: SeverityLevel;
  key_indicators: Record<string, string>;
  synoptic_summary: string;
  latitude: number;
  longitude: number;
}

export interface DataSourceStatus {
  name: string;
  source_type: string;
  status: string;
  last_update: string;
  coverage: string;
  data_quality: string;
  latency_sec: number;
  confidence_pct: number;
  note: string;
}

export interface DataSourceAuditEntry {
  source: string;
  official_provider?: string;
  type: string;
  real_connection?: boolean;
  status: string;
  auth_status?: string;
  authentication?: string;
  public_api_exists?: boolean;
  endpoint_or_protocol?: string;
  last_update: string;
  last_fetch?: string;
  latency: string;
  data_freshness: string;
  coverage: string;
  mode: string;
  is_live_external: boolean;
  data_type: string;
  data_received?: string;
  variables?: string;
  official_access_mechanism?: string;
  note: string;
}

export interface SystemHealthStatus {
  timestamp: string;
  is_simulation_mode: boolean;
  system_mode?: string;
  active_cells_count: number;
  active_alerts_count: number;
  open_meteo_status?: string;
  open_meteo_latency_sec?: number;
  rainviewer_status?: string;
  rainviewer_latency_sec?: number;
  radar_feed_status: string;
  satellite_feed_status: string;
  lightning_feed_status: string;
  stations_feed_status: string;
  forecast_engine_status: string;
  database_status: string;
  websocket_status: string;
  api_status: string;
  radar_latency_sec: number;
  satellite_latency_sec: number;
  lightning_latency_sec: number;
  nwp_latency_sec: number;
  ws_connections: number;
  telemetry_notice?: string;
}

export interface RegionInfo {
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
}

export interface MLPredictionRequest {
  max_dbz: number;
  vil_density: number;
  echo_top_km: number;
  cape_jkg: number;
  cin_jkg: number;
  cloud_top_temp_c: number;
  lightning_rate: number;
  wind_shear_proxy: number;
  dewpoint_depression_c: number;
  elevation_m: number;
  region?: string;
  selected_model?: string;
}

export interface MLFeatureImportance {
  feature_name: string;
  feature_key: string;
  importance_pct: number;
  feature_value: string;
  impact: string;
}

export interface MLHazardProbability {
  hazard: string;
  probability: number;
  severity: SeverityLevel;
  action_trigger: boolean;
}

export interface ModelBenchmarkEntry {
  model_id: string;
  name: string;
  model_family: string;
  architecture: string;
  r2_score: number;
  roc_auc: number;
  f1_score: number;
  inference_latency_ms: number;
  predicted_score: number;
  predicted_hazard: string;
  confidence_pct: number;
  is_active: boolean;
}

export interface MLModelMetrics {
  model_name: string;
  model_version: string;
  architecture: string;
  training_samples: number;
  test_r2_score: number;
  roc_auc: number;
  f1_score: number;
  inference_latency_ms: number;
  trained_at: string;
  status: string;
  models_in_suite?: ModelBenchmarkEntry[];
}

export interface FeatureProvenanceEntry {
  feature: string;
  value: any;
  source: string;
  status: string;
  unit: string;
  note: string;
}

export interface MLPredictionResponse {
  convective_risk_score: number;
  risk_category: SeverityLevel;
  confidence_pct: number;
  primary_hazard: string;
  hazard_probabilities: MLHazardProbability[];
  feature_importances: MLFeatureImportance[];
  physics_baseline_score: number;
  physics_vs_ml_delta: number;
  inference_latency_ms: number;
  model_name: string;
  active_model_id?: string;
  active_model_name?: string;
  all_model_benchmarks?: ModelBenchmarkEntry[];
  ensemble_consensus_pct?: number;
  consensus_summary?: string;
  explanation: string;
  recommended_actions: string[];
  timestamp: string;
  feature_provenance?: FeatureProvenanceEntry[];
  model_calibration_notice?: string;
}

export interface MultiModelLeaderboardResponse {
  models: ModelBenchmarkEntry[];
  training_samples: number;
  active_model_id: string;
  evaluated_at: string;
}

export interface PastHourObservation {
  hour_offset: number;
  label: string;
  timestamp: string;
  rain_mmh: number;
  cumulative_rain_mm: number;
  cape_jkg: number;
  temperature_c: number;
  dewpoint_c: number;
  dewpoint_depression_c: number;
  surface_pressure_hpa: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  soil_moisture_saturation_pct: number;
  composite_risk: number;
  severity: SeverityLevel;
}

export interface PastDaySummary {
  day_number: number;
  day_label: string;
  date: string;
  total_rainfall_mm: number;
  max_temperature_c: number;
  min_temperature_c: number;
  avg_rh_pct: number;
  peak_cape_jkg: number;
  peak_wind_gust_kmh: number;
  convective_activity: string;
}

export interface Past3DaysAntecedentResponse {
  region: string;
  timeline_mode: string;
  is_live_external: boolean;
  summary_72h: {
    total_antecedent_rainfall_mm: number;
    soil_moisture_saturation_pct: number;
    peak_past_cape_jkg: number;
    peak_gust_kmh: number;
    antecedent_risk_level: string;
    cloudburst_vulnerability_multiplier: number;
    latency_sec?: number;
    data_freshness?: string;
  };
  daily_summaries: PastDaySummary[];
  hourly_timeline: PastHourObservation[];
  provenance_note: string;
}

export interface CitizenGroundReport {
  id: string;
  timestamp: string;
  region: string;
  location_name: string;
  latitude: number;
  longitude: number;
  hazard_type: 'hail' | 'lightning' | 'cloudburst' | 'downburst' | 'waterlogging';
  severity: 'moderate' | 'high' | 'severe';
  user_note: string;
  reporter_name?: string;
  verified: boolean;
  upvotes: number;
  status?: 'SUBMITTED' | 'UNDER REVIEW' | 'VERIFIED' | 'REJECTED';
}

export interface ShelterInfo {
  id: string;
  name: string;
  type: 'school' | 'panchayat' | 'community_hall' | 'temple_hall' | 'hospital';
  distance_m: number;
  address: string;
  capacity: number;
  current_occupancy: number;
  has_power_backup: boolean;
  has_drinking_water: boolean;
  contact_phone: string;
  lat: number;
  lon: number;
}


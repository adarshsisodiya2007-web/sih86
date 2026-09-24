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
  status: 'active' | 'acknowledged' | 'resolved';
  affected_population_est: number;
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

export interface SystemHealthStatus {
  timestamp: string;
  is_simulation_mode: boolean;
  active_cells_count: number;
  active_alerts_count: number;
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
}

export interface MultiModelLeaderboardResponse {
  models: ModelBenchmarkEntry[];
  training_samples: number;
  active_model_id: string;
  evaluated_at: string;
}


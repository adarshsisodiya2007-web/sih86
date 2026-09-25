from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SeverityLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"
    HIGH = "high"
    SEVERE = "severe"

class HazardType(str, Enum):
    THUNDERSTORM = "thunderstorm"
    HAIL = "hail"
    CLOUDBURST = "cloudburst"
    DOWNBURST = "downburst"
    LIGHTNING = "lightning"

class DataSourceType(str, Enum):
    RADAR = "Doppler Weather Radar"
    SATELLITE = "INSAT-3D/3DR Satellite"
    LIGHTNING = "Ground Lightning Network"
    SURFACE_AWS = "Surface Weather Stations"
    RAINFALL_OBS = "Rainfall Gauge Observations"
    NWP = "Numerical Weather Prediction (WRF Proxy)"
    HISTORICAL = "Historical Event Archive"

class DataSourceStatus(BaseModel):
    name: str
    source_type: DataSourceType
    status: str = "SIMULATED FEED"  # SIMULATED FEED, CONNECTED, DEGRADED, OFFLINE
    last_update: str
    coverage: str
    data_quality: str
    latency_sec: int
    confidence_pct: int
    note: str = "Simulated feed layer ready for operational API integration"
    is_simulated: bool = True

class StormCell(BaseModel):
    cell_id: str
    name: str
    latitude: float
    longitude: float
    intensity: SeverityLevel
    movement_deg: float
    speed_kmh: float
    detected_at: str
    eta_minutes: int
    hazards: List[HazardType]
    confidence: int  # 0 - 100 %
    dbz_max: float  # Max reflectivity
    vil_kgm2: float  # Vertically Integrated Liquid
    echo_top_km: float  # Echo Top in km
    cape_jkg: float  # CAPE
    hail_prob: int  # 0 - 100 %
    cloudburst_risk: int  # 0 - 100 %
    wind_gust_kmh: float
    rain_rate_mmh: float
    polygon_coords: List[List[float]] = []  # [[lat, lon], ...]
    trajectory_points: List[List[float]] = []  # projected future points

class WeatherObservation(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    temp_c: float
    dew_point_c: float
    rh_percent: float
    pressure_hpa: float
    wind_speed_kmh: float
    wind_dir_deg: float
    rain_rate_mmh: float
    cape_proxy: float
    cin_proxy: float
    timestamp: str

class RadarSiteObservation(BaseModel):
    radar_id: str
    site_name: str
    latitude: float
    longitude: float
    range_km: int = 250
    max_dbz: float
    vil_kgm2: float
    echo_top_km: float
    scan_time: str
    status: str = "ONLINE"

class SatelliteObservation(BaseModel):
    satellite_name: str = "INSAT-3D (Simulated)"
    channel: str = "Thermal IR (10.8 um) & WV (6.7 um)"
    cloud_top_temp_c: float
    cooling_rate_c_15min: float  # Rapid cooling indicator
    olr_wm2: float  # Outgoing Longwave Radiation
    scan_time: str
    convective_cloud_mask: bool = True

class LightningFlash(BaseModel):
    flash_id: str
    latitude: float
    longitude: float
    timestamp: str
    peak_current_ka: float
    flash_type: str = "CG"  # Cloud-to-Ground or Intra-Cloud
    strike_rate_min: int

class TimelineHourForecast(BaseModel):
    hour_offset: int  # 0 to 6
    label: str  # "NOW", "+1H", "+2H", etc.
    timestamp: str
    thunderstorm_prob: int
    hail_prob: int
    cloudburst_prob: int
    lightning_density: int  # strikes / km^2 / hr
    rain_intensity_mmh: float
    wind_risk_kmh: float
    composite_risk: int  # 0 - 100
    severity: SeverityLevel

class PastHourObservation(BaseModel):
    hour_offset: int  # -72 to 0
    label: str  # e.g. "D-3 02:00", "D-2 14:00", "D-1 21:00", "t-1h", "NOW"
    timestamp: str  # ISO or UTC formatted time
    rain_mmh: float
    cumulative_rain_mm: float
    cape_jkg: float
    temperature_c: float
    dewpoint_c: float
    dewpoint_depression_c: float
    surface_pressure_hpa: float
    wind_speed_kmh: float
    wind_gust_kmh: float
    soil_moisture_saturation_pct: float
    composite_risk: int
    severity: SeverityLevel

class PastDaySummary(BaseModel):
    day_number: int  # 1 (3 days ago), 2 (2 days ago), 3 (yesterday)
    day_label: str  # "Day -3 (72h ago)", "Day -2 (48h ago)", "Day -1 (Yesterday)"
    date: str  # e.g. "2026-09-22"
    total_rainfall_mm: float
    max_temperature_c: float
    min_temperature_c: float
    avg_rh_pct: float
    peak_cape_jkg: float
    peak_wind_gust_kmh: float
    convective_activity: str

class Past3DaysAntecedentResponse(BaseModel):
    region: str
    timeline_mode: str = "PAST_3_DAYS_ANTECEDENT"
    is_live_external: bool = True
    summary_72h: Dict[str, Any]
    daily_summaries: List[PastDaySummary]
    hourly_timeline: List[PastHourObservation]
    provenance_note: str

class Alert(BaseModel):
    alert_id: str
    title: str
    region: str
    severity: SeverityLevel
    hazards: List[HazardType]
    probability: int
    onset_minutes: int
    confidence: int
    recommended_action: str
    issued_at: str
    expires_at: str
    status: str = "active"  # active, acknowledged, resolved, or DRAFT, PENDING REVIEW, APPROVED, PUBLISHED, REJECTED, EXPIRED
    affected_population_est: int = 150000
    lifecycle_status: Optional[str] = "PENDING REVIEW"  # DRAFT, PENDING REVIEW, APPROVED, PUBLISHED, REJECTED, EXPIRED
    risk_score: Optional[int] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    published_at: Optional[str] = None
    rejection_reason: Optional[str] = None

class AlertModifyRequest(BaseModel):
    title: Optional[str] = None
    recommended_action: Optional[str] = None
    severity: Optional[SeverityLevel] = None
    expires_at: Optional[str] = None
    onset_minutes: Optional[int] = None

class SystemEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str  # DETECTION, RISK_EVALUATION, ALERT_LIFECYCLE, OFFICER_ACTION, CITIZEN_FEEDBACK
    description: str
    severity: Optional[str] = "normal"  # normal, info, elevated, severe, critical
    status: Optional[str] = None
    region: Optional[str] = None

class RiskFactorContribution(BaseModel):
    factor_name: str
    contribution_score: float  # e.g., 0 to 30 points
    description: str
    physical_value: str
    impact_level: str  # High, Moderate, Low

class FeatureProvenanceEntry(BaseModel):
    feature: str
    value: str
    source: str
    status: str  # "REAL", "SIMULATED", "UNAVAILABLE", "REAL STATIC"
    unit: Optional[str] = None
    note: Optional[str] = None

class ConvectiveRiskAssessment(BaseModel):
    region: str
    composite_score: int  # 0 - 100
    risk_category: SeverityLevel
    confidence: int
    explanation: str
    factors: List[RiskFactorContribution]
    feature_provenance: List[FeatureProvenanceEntry] = []
    availability_status: str = "FULL"  # "FULL", "PARTIALLY AVAILABLE", "UNAVAILABLE"
    recommended_actions: List[str]
    timestamp: str

class HistoricalEvent(BaseModel):
    event_id: str
    name: str
    date: str
    region: str
    duration_hours: float
    max_rainfall_mm: float
    peak_lightning_rate: int
    observed_hazards: List[HazardType]
    damage_severity: SeverityLevel
    key_indicators: Dict[str, str]
    synoptic_summary: str
    latitude: float
    longitude: float

class SystemHealthStatus(BaseModel):
    timestamp: str
    is_simulation_mode: bool = True
    system_mode: str = "SIMULATION"  # "LIVE_DATA" or "SIMULATION"
    active_cells_count: int
    active_alerts_count: int
    open_meteo_status: str = "LIVE"
    open_meteo_latency_sec: float = 0.8
    rainviewer_status: str = "LIVE"
    rainviewer_latency_sec: float = 1.1
    radar_feed_status: str = "ADAPTER READY (NOT CONNECTED / SIMULATION AVAILABLE)"
    satellite_feed_status: str = "ADAPTER READY (NOT CONNECTED / SIMULATION AVAILABLE)"
    lightning_feed_status: str = "ADAPTER READY (NOT CONNECTED / SIMULATION AVAILABLE)"
    stations_feed_status: str = "ADAPTER READY (NOT CONNECTED / SIMULATION AVAILABLE)"
    forecast_engine_status: str = "ONLINE (PROTOTYPE)"
    database_status: str = "READY (POSTGIS SCHEMA)"
    websocket_status: str = "ONLINE"
    api_status: str = "ONLINE"
    radar_latency_sec: int = 18
    satellite_latency_sec: int = 42
    lightning_latency_sec: int = 8
    nwp_latency_sec: int = 120
    ws_connections: int = 0
    telemetry_notice: str = "Live providers (Open-Meteo, RainViewer) report real measured HTTP latencies. DWR, INSAT, and GLDN feeds operate in SIMULATION / ADAPTER-READY mode."

class MLPredictionRequest(BaseModel):
    max_dbz: Optional[float] = Field(default=None, description="Radar max reflectivity dBZ")
    vil_density: Optional[float] = Field(default=None, description="VIL density in kg/m3")
    echo_top_km: Optional[float] = Field(default=None, description="Echo top height in km")
    cape_jkg: Optional[float] = Field(default=2400.0, description="CAPE in J/kg")
    cin_jkg: Optional[float] = Field(default=35.0, description="CIN in J/kg")
    cloud_top_temp_c: Optional[float] = Field(default=None, description="Satellite cloud-top IR temp °C")
    lightning_rate: Optional[int] = Field(default=None, description="Total lightning strikes per minute")
    wind_shear_proxy: Optional[float] = Field(default=18.0, description="0-6km bulk shear m/s")
    dewpoint_depression_c: Optional[float] = Field(default=9.5, description="Sub-cloud dewpoint depression (T-Td) °C")
    elevation_m: Optional[float] = Field(default=450.0, description="Terrain elevation in meters")
    region: Optional[str] = "Nagpur Sector (Vidarbha)"
    selected_model: Optional[str] = "stacking_ensemble"
    is_live_data: Optional[bool] = False

class MLFeatureImportance(BaseModel):
    feature_name: str
    feature_key: str
    importance_pct: float
    feature_value: str
    impact: str

class MLHazardProbability(BaseModel):
    hazard: str
    probability: int
    severity: SeverityLevel
    action_trigger: bool

class ModelBenchmarkEntry(BaseModel):
    model_id: str
    name: str
    model_family: str
    architecture: str
    r2_score: float
    roc_auc: float
    f1_score: float
    inference_latency_ms: float
    predicted_score: int
    predicted_hazard: str
    confidence_pct: int
    is_active: bool

class MLModelMetrics(BaseModel):
    model_name: str
    model_version: str
    architecture: str
    training_samples: int
    test_r2_score: float
    roc_auc: float
    f1_score: float
    inference_latency_ms: float
    trained_at: str
    status: str
    models_in_suite: List[ModelBenchmarkEntry] = []

class MLPredictionResponse(BaseModel):
    convective_risk_score: int
    risk_category: SeverityLevel
    confidence_pct: int
    primary_hazard: str
    hazard_probabilities: List[MLHazardProbability]
    feature_importances: List[MLFeatureImportance]
    feature_provenance: List[FeatureProvenanceEntry] = []
    physics_baseline_score: int
    physics_vs_ml_delta: int
    inference_latency_ms: float
    model_name: str
    active_model_id: str = "stacking_ensemble"
    active_model_name: str = "Stacking Super-Ensemble"
    all_model_benchmarks: List[ModelBenchmarkEntry] = []
    ensemble_consensus_pct: int = 95
    consensus_summary: str = "High Multi-Model Agreement"
    model_calibration_notice: str = "REAL-DATA INFERENCE WITH PROTOTYPE MODEL (Calibrated Domain Distribution)"
    prediction_mode: str = "FULL_SENSOR"  # "FULL_SENSOR" or "PARTIAL_DATA"
    data_completeness_percentage: int = 100
    available_sources: List[str] = []
    missing_sources: List[str] = []
    confidence_penalty_applied: int = 0
    explanation: str
    recommended_actions: List[str]
    timestamp: str

class MultiModelLeaderboardResponse(BaseModel):
    models: List[ModelBenchmarkEntry]
    training_samples: int
    active_model_id: str
    evaluated_at: str

class NormalizedSourceStatus(str, Enum):
    LIVE = "LIVE"
    STALE = "STALE"
    OFFLINE = "OFFLINE"
    SIMULATION = "SIMULATION"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    ADAPTER_READY = "ADAPTER_READY"

class NormalizedLocation(BaseModel):
    lat: float
    lon: float
    elevation_m: Optional[float] = None
    region_name: Optional[str] = None

class NormalizedObservation(BaseModel):
    source: str
    source_type: str
    status: NormalizedSourceStatus
    timestamp: str
    location: NormalizedLocation
    variables: Dict[str, Any]
    quality: Dict[str, Any]
    metadata: Dict[str, Any]

class CitizenGroundReport(BaseModel):
    id: str
    timestamp: str
    region: str
    location_name: str
    latitude: float
    longitude: float
    hazard_type: str  # 'hail', 'lightning', 'cloudburst', 'downburst', 'waterlogging'
    severity: str     # 'moderate', 'high', 'severe'
    user_note: str
    reporter_name: Optional[str] = "Local Citizen"
    verified: bool = False
    upvotes: int = 1
    status: str = "SUBMITTED"  # SUBMITTED, UNDER REVIEW, VERIFIED, REJECTED

class CitizenReportCreate(BaseModel):
    region: str
    location_name: str
    latitude: float
    longitude: float
    hazard_type: str
    severity: str
    user_note: str
    reporter_name: Optional[str] = "Local Citizen"

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
    status: str = "active"  # active, acknowledged, resolved
    affected_population_est: int = 150000

class RiskFactorContribution(BaseModel):
    factor_name: str
    contribution_score: float  # e.g., 0 to 30 points
    description: str
    physical_value: str
    impact_level: str  # High, Moderate, Low

class ConvectiveRiskAssessment(BaseModel):
    region: str
    composite_score: int  # 0 - 100
    risk_category: SeverityLevel
    confidence: int
    explanation: str
    factors: List[RiskFactorContribution]
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
    active_cells_count: int
    active_alerts_count: int
    radar_feed_status: str = "SIMULATED FEED"
    satellite_feed_status: str = "SIMULATED FEED"
    lightning_feed_status: str = "SIMULATED FEED"
    stations_feed_status: str = "SIMULATED FEED"
    forecast_engine_status: str = "ONLINE (PROTOTYPE)"
    database_status: str = "READY (POSTGIS SCHEMA)"
    websocket_status: str = "ONLINE"
    api_status: str = "ONLINE"
    radar_latency_sec: int = 18
    satellite_latency_sec: int = 42
    lightning_latency_sec: int = 8
    nwp_latency_sec: int = 120
    ws_connections: int = 0
    telemetry_notice: str = "All feed latencies are simulated values for demonstration purposes."

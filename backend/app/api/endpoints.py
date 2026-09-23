import json
import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.models.schemas import (
    StormCell,
    TimelineHourForecast,
    Alert,
    RadarSiteObservation,
    SatelliteObservation,
    LightningFlash,
    HistoricalEvent,
    ConvectiveRiskAssessment,
    SystemHealthStatus,
    DataSourceStatus
)
from app.services.simulation import sim_engine, INDIAN_SECTORS

router = APIRouter(prefix="/api")

class RiskAnalysisRequest(BaseModel):
    region: str
    dbz: Optional[float] = 52.0
    rain_rate: Optional[float] = 45.0
    cloud_top_temp: Optional[float] = -60.0
    lightning_rate: Optional[int] = 45
    cape: Optional[float] = 2200.0
    cin: Optional[float] = 30.0
    wind_shear: Optional[float] = 18.0

@router.get("/health")
def get_health():
    return {
        "status": "ONLINE",
        "service": "VARSHANET Convective Nowcast API",
        "version": "2.4.0-sih2026",
        "mode": "SIMULATION MODE",
        "note": "AI-assisted nowcasting prototype with explainable risk engine"
    }

@router.get("/regions")
def get_available_regions():
    return [
        {"name": k, "latitude": v["lat"], "longitude": v["lon"], "elevation_m": v["elev"]}
        for k, v in INDIAN_SECTORS.items()
    ]

@router.get("/storm-cells", response_model=List[StormCell])
def get_storm_cells():
    return list(sim_engine.active_cells.values())

@router.get("/storm-cells/{cell_id}", response_model=StormCell)
def get_storm_cell_detail(cell_id: str):
    if cell_id not in sim_engine.active_cells:
        raise HTTPException(status_code=404, detail=f"Storm cell {cell_id} not found")
    return sim_engine.active_cells[cell_id]

@router.get("/forecast", response_model=List[TimelineHourForecast])
def get_forecast(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    return sim_engine.get_timeline_forecast(region)

@router.get("/hazards")
def get_hazard_summary(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    forecasts = sim_engine.get_timeline_forecast(region)
    current = forecasts[0]
    cells = list(sim_engine.active_cells.values())
    
    return {
        "region": region,
        "current_convective_risk": current.composite_risk,
        "thunderstorm": {
            "probability": current.thunderstorm_prob,
            "status": "INITIATED" if current.thunderstorm_prob > 60 else "MONITORING",
            "trend": "+12% in next 60m"
        },
        "hail": {
            "probability": current.hail_prob,
            "status": "HIGH RISK" if current.hail_prob > 60 else "ELEVATED",
            "max_expected_diameter_cm": round(min(5.5, max(0.5, current.hail_prob * 0.06)), 1)
        },
        "cloudburst": {
            "probability": current.cloudburst_prob,
            "rain_rate_mmh": current.rain_intensity_mmh,
            "status": "THRESHOLD WARNING" if current.cloudburst_prob > 70 else "WATCH"
        },
        "downburst": {
            "gust_kmh": current.wind_risk_kmh,
            "status": "SEVERE MICROBURST" if current.wind_risk_kmh > 85 else "MODERATE GUST"
        },
        "active_cells_detected": len(cells)
    }

@router.get("/lightning", response_model=List[LightningFlash])
def get_lightning_flashes():
    return sim_engine.lightning_flashes

@router.get("/radar", response_model=List[RadarSiteObservation])
def get_radar_sites():
    return sim_engine.radar_sites

@router.get("/satellite", response_model=SatelliteObservation)
def get_satellite_obs():
    return sim_engine.satellite_obs

@router.get("/alerts", response_model=List[Alert])
def get_alerts():
    return sim_engine.alerts

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            a.status = "acknowledged"
            return {"status": "success", "alert_id": alert_id, "state": "acknowledged"}
    raise HTTPException(status_code=404, detail="Alert not found")

@router.get("/historical-events", response_model=List[HistoricalEvent])
def get_historical_events():
    # Load from data/historical_events.json
    path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "historical_events.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [HistoricalEvent(**item) for item in data]
    return []

@router.post("/analyze-risk", response_model=ConvectiveRiskAssessment)
def analyze_risk(req: RiskAnalysisRequest):
    return sim_engine.get_risk_assessment(req.region)

@router.get("/data-fusion/pipeline")
def get_data_fusion_pipeline():
    return {
        "pipeline_name": "VARSHANET Multi-Source Spatial-Temporal Alignment (MSSTA)",
        "sources": sim_engine.data_sources,
        "stages": [
            {
                "stage": 1,
                "name": "Multi-Source Sensor Ingestion",
                "description": "Continuous ingestion of DWR radar volume scans, INSAT-3D TIR/WV channels, ground lightning TOA networks, and mesonet AWS",
                "status": "ACTIVE",
                "latency_sec": 12
            },
            {
                "stage": 2,
                "name": "Quality Control & Despeckling",
                "description": "Ground clutter elimination, anomalous propagation (AP) filtering, Doppler velocity dealiasing, and gauge QC",
                "status": "ACTIVE",
                "latency_sec": 3
            },
            {
                "stage": 3,
                "name": "Spatial-Temporal Alignment (1-3 km Grid)",
                "description": "Re-projection onto unified WGS84 UTM grid using nearest-neighbor Kriging and temporal synchronization",
                "status": "ACTIVE",
                "latency_sec": 5
            },
            {
                "stage": 4,
                "name": "Convective Feature Extraction",
                "description": "Computation of VIL, Echo Tops, Cloud-Top Cooling Rate, Brightness Temp Difference (BTD), and CAPE integration",
                "status": "ACTIVE",
                "latency_sec": 4
            },
            {
                "stage": 5,
                "name": "TITAN/SCIT Storm Cell Tracking & Extrapolation",
                "description": "Centroid matching, motion vector estimation, cell merging/splitting identification",
                "status": "ACTIVE",
                "latency_sec": 6
            },
            {
                "stage": 6,
                "name": "0-6h Nowcast & Hazard Probability Generation",
                "description": "POSH hail index, Cloudburst Potential Index (CPI), downburst wind gust estimate, and CAP warning generation",
                "status": "ACTIVE",
                "latency_sec": 2
            }
        ]
    }

@router.post("/simulate/tick")
def trigger_simulation_tick():
    sim_engine.tick()
    return {
        "status": "success",
        "tick_count": sim_engine.tick_count,
        "cells_updated": len(sim_engine.active_cells),
        "lightning_count": len(sim_engine.lightning_flashes)
    }

@router.post("/simulate/toggle")
def toggle_simulation():
    sim_engine.simulation_mode = not sim_engine.simulation_mode
    return {"simulation_mode": sim_engine.simulation_mode}

from app.services.live_weather_service import live_weather_service

@router.get("/system-health", response_model=SystemHealthStatus)
def get_system_health():
    return sim_engine.get_system_health()

@router.get("/live-external-feed")
def get_live_external_feed(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """
    Returns live observation feeds from Open-Meteo (WMO / ECMWF / GFS)
    and RainViewer Doppler Radar Open APIs.
    """
    open_meteo_data = live_weather_service.fetch_open_meteo_live(region)
    rainviewer_data = live_weather_service.fetch_rainviewer_radar()
    return {
        "status": "ONLINE",
        "region": region,
        "open_meteo": open_meteo_data,
        "rainviewer_radar": rainviewer_data,
        "fusion_timestamp": open_meteo_data.get("timestamp")
    }

@router.get("/integrated-apis-info")
def get_integrated_apis_info():
    """
    Returns comprehensive catalog of all active internal and external APIs integrated into VARSHANET.
    """
    return live_weather_service.get_all_integrated_apis_manifest()


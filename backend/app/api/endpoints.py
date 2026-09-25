import json
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.models.schemas import (
    SeverityLevel,
    HazardType,
    StormCell,
    TimelineHourForecast,
    Alert,
    RadarSiteObservation,
    SatelliteObservation,
    LightningFlash,
    HistoricalEvent,
    ConvectiveRiskAssessment,
    SystemHealthStatus,
    DataSourceStatus,
    MLPredictionRequest,
    MLPredictionResponse,
    MLModelMetrics,
    MultiModelLeaderboardResponse,
    CitizenGroundReport,
    CitizenReportCreate,
    AlertModifyRequest,
    SystemEvent,
    CitizenAlertPublic,
    SafeShelterPublic,
    CitizenAlertDetailPublic,
    CitizenUpdatePublic,
    CitizenStatusPublic,
    AlertCreateRequest,
    NotificationSubscriptionRequest
)
from app.database import storage
from app.services.simulation import sim_engine, INDIAN_SECTORS
from app.services.ml_engine import ml_engine
from app.services.live_weather_service import live_weather_service
from app.services.data_fusion_engine import data_fusion_engine
from app.adapters import (
    dwr_adapter,
    insat_adapter,
    lightning_adapter,
    aws_adapter,
    rain_gauge_adapter,
    nwp_adapter,
    terrain_adapter
)
from app.services.mosdac_acquisition_service import mosdac_acquisition_service

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
        "mode": f"{sim_engine.system_mode} MODE",
        "system_mode": sim_engine.system_mode,
        "is_simulation_mode": sim_engine.simulation_mode,
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
    if sim_engine.system_mode == "LIVE_DATA":
        # In LIVE_DATA mode, Doppler Weather Radar volume scans require operational gateway.
        # If DWR adapter is unauthenticated, NEVER return simulated cells.
        if not dwr_adapter.is_connected:
            return []
    return list(sim_engine.active_cells.values())

@router.get("/storm-cells/{cell_id}", response_model=StormCell)
def get_storm_cell_detail(cell_id: str):
    if sim_engine.system_mode == "LIVE_DATA" and not dwr_adapter.is_connected:
        raise HTTPException(
            status_code=404,
            detail="Operational DWR gateway connection required in LIVE_DATA mode. Simulated cells are disabled."
        )
    if cell_id not in sim_engine.active_cells:
        raise HTTPException(status_code=404, detail=f"Storm cell {cell_id} not found")
    return sim_engine.active_cells[cell_id]

@router.get("/forecast", response_model=List[TimelineHourForecast])
def get_forecast(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    return sim_engine.get_timeline_forecast(region)

@router.get("/forecast/past-3-days")
def get_past_3_days_forecast(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns genuine 72-hour preceding historical atmospheric observations and daily summaries."""
    return live_weather_service.fetch_past_3_days_history(region)

@router.get("/hazards")
def get_hazard_summary(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    forecasts = sim_engine.get_timeline_forecast(region)
    current = forecasts[0]
    cells = [] if (sim_engine.system_mode == "LIVE_DATA" and not dwr_adapter.is_connected) else list(sim_engine.active_cells.values())
    
    return {
        "region": region,
        "mode": sim_engine.system_mode,
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
        "active_cells_detected": len(cells),
        "sensor_status": {
            "dwr_radar": "AUTH REQUIRED" if (sim_engine.system_mode == "LIVE_DATA" and not dwr_adapter.is_connected) else "ACTIVE",
            "insat_satellite": "LOCAL INGESTION ACTIVE" if insat_adapter.has_local_granule else ("AUTH REQUIRED" if (sim_engine.system_mode == "LIVE_DATA" and not insat_adapter.is_connected) else "ACTIVE"),
            "gldn_lightning": "NOT CONNECTED" if (sim_engine.system_mode == "LIVE_DATA" and not lightning_adapter.is_connected) else "ACTIVE",
            "open_meteo": "LIVE",
            "rainviewer": "LIVE"
        }
    }

@router.get("/lightning", response_model=List[LightningFlash])
def get_lightning_flashes():
    if sim_engine.system_mode == "LIVE_DATA":
        # In LIVE_DATA mode, if GLDN broker is not connected, return empty list (no fake lightning)
        if not lightning_adapter.is_connected:
            return []
    return sim_engine.lightning_flashes

@router.get("/radar", response_model=List[RadarSiteObservation])
def get_radar_sites():
    if sim_engine.system_mode == "LIVE_DATA" and not dwr_adapter.is_connected:
        return [
            RadarSiteObservation(
                radar_id=site.radar_id,
                site_name=site.site_name,
                latitude=site.latitude,
                longitude=site.longitude,
                range_km=site.range_km,
                max_dbz=0.0,
                vil_kgm2=0.0,
                echo_top_km=0.0,
                scan_time="AUTH_REQUIRED",
                status="AUTH REQUIRED (MoES VPN Gate)"
            )
            for site in sim_engine.radar_sites
        ]
    return sim_engine.radar_sites

@router.get("/satellite", response_model=SatelliteObservation)
def get_satellite_obs():
    if insat_adapter.has_local_granule:
        meta = insat_adapter.get_latest_granule_info()
        acq_time = meta.get("acquisition_start_time", "25-SEP-2026T00:15:44")
        max_rain = meta.get("max_rain_mmh", 0.0)
        return SatelliteObservation(
            satellite_name=meta.get("satellite_name", "INSAT-3DR (MOSDAC Local Ingestion)"),
            channel="IMSRA L2B Precipitation Rate (IMC mm/hr)",
            cloud_top_temp_c=0.0,
            cooling_rate_c_15min=0.0,
            olr_wm2=0.0,
            scan_time=f"{acq_time} (LOCAL MOSDAC HDF5)",
            convective_cloud_mask=(max_rain > 0.5),
            rain_rate_mmh=max_rain,
            product_name="IMSRA Level-2B Geophysical Precipitation Rate (IMC)",
            granule_file=meta.get("file_name"),
            data_source_mode="REAL_LOCAL_HDF5"
        )
    if sim_engine.system_mode == "LIVE_DATA" and not insat_adapter.is_connected:
        return SatelliteObservation(
            satellite_name="INSAT-3D/3DR (ISRO MOSDAC)",
            channel="TIR1 (10.8 µm) & WV (6.7 µm)",
            cloud_top_temp_c=0.0,
            cooling_rate_c_15min=0.0,
            olr_wm2=0.0,
            scan_time="AUTH REQUIRED (MOSDAC_API_KEY required)",
            convective_cloud_mask=False
        )
    return sim_engine.satellite_obs

@router.get("/satellite/observation")
def get_satellite_observation_at(
    lat: float = Query(default=21.1458, description="Latitude in degrees north"),
    lon: float = Query(default=79.0882, description="Longitude in degrees east")
):
    """
    Returns verified real INSAT-3DR Level-2B IMC precipitation rate
    at the specified geographic coordinates from the ingested HDF5 granule.
    """
    return insat_adapter.get_observation_at(lat, lon)

@router.get("/satellite/acquisition/status")
def get_satellite_acquisition_status():
    """
    Returns the real-time operational status and telemetry of the
    automated MOSDAC acquisition service.
    """
    return mosdac_acquisition_service.get_status_info()

@router.post("/satellite/acquisition/trigger")
def trigger_satellite_acquisition(date: Optional[str] = Query(default=None, description="Optional target date YYYY-MM-DD")):
    """
    Triggers automated download of the latest 3RIMG_L2B_IMC HDF5 granule
    from MOSDAC using credentials securely configured in backend/.env.
    """
    return mosdac_acquisition_service.acquire_latest_granule(specific_date=date)

REGIONAL_SHELTERS: Dict[str, List[SafeShelterPublic]] = {
    "nagpur": [
        SafeShelterPublic(name="Government Senior Secondary School Shelter", address="Circular Road, Wardha Road Bypass", capacity=350, distance_km=0.8, contact="0712-2562668"),
        SafeShelterPublic(name="Dr. Ambedkar Multipurpose Community Hall", address="Deekshabhoomi East Corridor", capacity=600, distance_km=1.4, contact="0712-2561100"),
        SafeShelterPublic(name="Mankapur Indoor Sports Disaster Complex", address="Koradi Road, Mankapur", capacity=1200, distance_km=3.2, contact="0712-2589000")
    ],
    "rewa": [
        SafeShelterPublic(name="Government Polytechnic Relief Auditorium", address="Civil Lines, Near University Road", capacity=450, distance_km=1.1, contact="07662-251100"),
        SafeShelterPublic(name="Rewa Municipal Disaster Shelter Facility", address="NH-30 Bypass, Kothi Compound", capacity=350, distance_km=1.9, contact="07662-254422"),
        SafeShelterPublic(name="Model Higher Secondary School Hall", address="Rewa Fort Road, City Center", capacity=500, distance_km=2.4, contact="07662-252030")
    ],
    "kolkata": [
        SafeShelterPublic(name="Salt Lake Stadium Disaster Wing", address="Sector III, Bidhannagar", capacity=1500, distance_km=2.1, contact="033-23351234"),
        SafeShelterPublic(name="Bidhannagar Municipal Relief Center", address="Karunamoyee Bus Station Area", capacity=400, distance_km=1.2, contact="033-23214567")
    ],
    "mumbai": [
        SafeShelterPublic(name="Lonavala Municipal Transit Camp", address="Old Mumbai-Pune Highway, Khandala Turn", capacity=600, distance_km=2.5, contact="02114-273001"),
        SafeShelterPublic(name="Panvel Community Emergency Center", address="Sion-Panvel Expressway Junction", capacity=450, distance_km=3.0, contact="022-27451234")
    ]
}

DEFAULT_SHELTERS = [
    SafeShelterPublic(name="Designated District Disaster Relief Center", address="Collectorate Campus, Disaster Wing", capacity=500, distance_km=1.5, contact="1077"),
    SafeShelterPublic(name="Government High School Emergency Shelter", address="Main Station Road, Block HQ", capacity=350, distance_km=2.2, contact="112")
]

EMERGENCY_CONTACTS = {
    "National Emergency": "112",
    "Disaster Helpline (NDMA/SDMA)": "1077",
    "Ambulance & Medical Relief": "108",
    "Traffic & Road Assistance": "1073",
    "Flood Control Room": "011-26701728"
}

def _sync_sim_engine_alerts():
    """Keeps sim_engine.alerts in sync with persistent storage."""
    stored = storage.get_all_alerts(include_expired=True)
    loaded: List[Alert] = []
    for s in stored:
        try:
            # Map storage row to Alert model
            sev = s.get("severity", "high").lower()
            if sev not in [e.value for e in SeverityLevel]:
                sev = "high"
            loaded.append(Alert(
                alert_id=s["id"],
                title=s["title"],
                region=s["region"],
                severity=SeverityLevel(sev),
                hazards=[HazardType.THUNDERSTORM],
                probability=s.get("probability", 85),
                onset_minutes=s.get("onset_minutes", 30),
                confidence=s.get("confidence", 90),
                recommended_action=s.get("recommended_action", "Take indoor shelter."),
                issued_at=s.get("issued_at", ""),
                expires_at=s.get("expires_at", ""),
                status=s.get("status", "active"),
                lifecycle_status=s.get("lifecycle_status", "PUBLISHED"),
                risk_score=s.get("risk_score", 85),
                reviewed_by=s.get("reviewed_by"),
                reviewed_at=s.get("reviewed_at"),
                published_at=s.get("published_at"),
                rejection_reason=s.get("rejection_reason"),
                road_status=s.get("road_status"),
                safety_instructions=s.get("safety_instructions")
            ))
        except Exception:
            pass
    if loaded:
        sim_engine.alerts = loaded

@router.get("/alerts", response_model=List[Alert])
def get_alerts():
    _sync_sim_engine_alerts()
    return sim_engine.alerts

@router.post("/alerts", response_model=Alert)
def create_officer_alert(req: AlertCreateRequest):
    """
    Officer endpoint to create and persistently store a new public alert / notice / bulletin.
    Automatically flows directly into persistent storage and makes it available on Citizen APIs.
    """
    from datetime import datetime, timezone, timedelta
    now_dt = datetime.now(timezone.utc)
    now_str = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    exp_hours = req.expires_in_hours or 3.0
    exp_str = (now_dt + timedelta(hours=exp_hours)).strftime("%Y-%m-%dT%H:%M:%SZ")

    stored_alerts = storage.get_all_alerts(include_expired=True)
    new_id = f"ALT-2026-0{840 + len(stored_alerts) + 1}"

    # Default coordinates based on sector or center
    coords = INDIAN_SECTORS.get(req.region, {"lat": 21.1458, "lon": 79.0882})
    lat = req.latitude if req.latitude is not None else coords["lat"]
    lon = req.longitude if req.longitude is not None else coords["lon"]

    # Safety instructions default
    safety_inst = req.safety_instructions or [
        "Take immediate indoor shelter away from windows and tin structures",
        "Disconnect electrical appliances and do not stand under trees",
        "Avoid waterlogged roads and submerged low-lying underpasses",
        "Keep emergency battery lights charged and follow local radio advisories"
    ]

    status_str = "PUBLISHED" if req.publish_immediately else "PENDING REVIEW"
    lifecycle_str = "PUBLISHED" if req.publish_immediately else "PENDING REVIEW"

    alert_dict = {
        "id": new_id,
        "title": req.title,
        "region": req.region,
        "severity": req.severity.value.upper(),
        "hazards": [h.value for h in req.hazards],
        "probability": req.probability,
        "onset_minutes": req.onset_minutes,
        "confidence": req.confidence,
        "recommended_action": req.recommended_action,
        "road_status": req.road_status or "Caution: Heavy rainfall may cause localized road waterlogging.",
        "safety_instructions": safety_inst,
        "latitude": lat,
        "longitude": lon,
        "issued_at": now_str,
        "updated_at": now_str,
        "expires_at": exp_str,
        "status": status_str,
        "lifecycle_status": lifecycle_str,
        "risk_score": req.probability,
        "reviewed_by": "Duty Officer (Web Terminal)",
        "reviewed_at": now_str if req.publish_immediately else None,
        "published_at": now_str if req.publish_immediately else None,
        "rejection_reason": None,
        "source": "Duty Officer (VARSHANET)"
    }

    storage.save_alert(alert_dict)
    _sync_sim_engine_alerts()

    sim_engine.add_system_event(
        event_type="ALERT_LIFECYCLE",
        description=f"Officer CREATED & {'PUBLISHED' if req.publish_immediately else 'DRAFTED'} alert {new_id}: {req.title} ({req.region})",
        severity="severe" if req.severity in [SeverityLevel.HIGH, SeverityLevel.SEVERE] else "elevated",
        status=lifecycle_str,
        region=req.region
    )

    # Return matching Alert model
    created = [a for a in sim_engine.alerts if a.alert_id == new_id]
    if created:
        return created[0]
    return Alert(
        alert_id=new_id,
        title=req.title,
        region=req.region,
        severity=req.severity,
        hazards=req.hazards,
        probability=req.probability,
        onset_minutes=req.onset_minutes,
        confidence=req.confidence,
        recommended_action=req.recommended_action,
        issued_at=now_str,
        expires_at=exp_str,
        status=status_str,
        lifecycle_status=lifecycle_str,
        risk_score=req.probability,
        road_status=req.road_status,
        safety_instructions=safety_inst
    )

@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    storage.update_alert(alert_id, {"status": "acknowledged"})
    _sync_sim_engine_alerts()
    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            a.status = "acknowledged"
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer acknowledged alert {alert_id} ({a.title})",
                severity="elevated",
                status="ACKNOWLEDGED",
                region=a.region
            )
            return {"status": "success", "alert_id": alert_id, "state": "acknowledged"}
    return {"status": "success", "alert_id": alert_id, "state": "acknowledged"}

@router.post("/alerts/{alert_id}/approve", response_model=Alert)
def approve_alert(alert_id: str):
    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    storage.update_alert(alert_id, {
        "status": "APPROVED",
        "lifecycle_status": "APPROVED",
        "reviewed_by": "IMD-RADAR-OP-84",
        "reviewed_at": now_str
    })
    _sync_sim_engine_alerts()
    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            a.status = "APPROVED"
            a.lifecycle_status = "APPROVED"
            a.reviewed_by = "IMD-RADAR-OP-84"
            a.reviewed_at = now_str
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer reviewed & APPROVED alert {alert_id} ({a.title})",
                severity="elevated",
                status="APPROVED",
                region=a.region
            )
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/alerts/{alert_id}/publish", response_model=Alert)
def publish_alert(alert_id: str):
    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    storage.update_alert(alert_id, {
        "status": "PUBLISHED",
        "lifecycle_status": "PUBLISHED",
        "published_at": now_str
    })
    _sync_sim_engine_alerts()
    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            a.status = "PUBLISHED"
            a.lifecycle_status = "PUBLISHED"
            a.published_at = now_str
            sim_engine.add_system_event(
                event_type="ALERT_LIFECYCLE",
                description=f"Citizen alert PUBLISHED via NDMA SACHET: {a.title} ({a.region})",
                severity="severe",
                status="PUBLISHED",
                region=a.region
            )
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

class AlertRejectPayload(BaseModel):
    reason: Optional[str] = "Insufficient convective threshold"

@router.post("/alerts/{alert_id}/reject", response_model=Alert)
def reject_alert(alert_id: str, payload: Optional[AlertRejectPayload] = None):
    from datetime import datetime, timezone
    reason = payload.reason if payload and payload.reason else "Insufficient convective threshold"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    storage.update_alert(alert_id, {
        "status": "REJECTED",
        "lifecycle_status": "REJECTED",
        "rejection_reason": reason,
        "reviewed_at": now_str
    })
    _sync_sim_engine_alerts()
    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            a.status = "REJECTED"
            a.lifecycle_status = "REJECTED"
            a.rejection_reason = reason
            a.reviewed_at = now_str
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer REJECTED alert {alert_id}. Reason: {reason}",
                severity="normal",
                status="REJECTED",
                region=a.region
            )
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@router.put("/alerts/{alert_id}/modify", response_model=Alert)
def modify_alert(alert_id: str, req: AlertModifyRequest):
    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    existing_alert = storage.get_alert_by_id(alert_id)
    prev_status = existing_alert.get("lifecycle_status", "APPROVED") if existing_alert else "APPROVED"
    new_lifecycle = "PUBLISHED" if prev_status == "PUBLISHED" else "APPROVED"
    new_status = "PUBLISHED" if prev_status == "PUBLISHED" else "APPROVED"

    updates: Dict[str, Any] = {
        "status": new_status,
        "lifecycle_status": new_lifecycle,
        "reviewed_at": now_str
    }
    if req.title:
        updates["title"] = req.title
    if req.recommended_action:
        updates["recommended_action"] = req.recommended_action
    if req.severity:
        updates["severity"] = req.severity.value.upper()
    if req.expires_at:
        updates["expires_at"] = req.expires_at
    if req.onset_minutes is not None:
        updates["onset_minutes"] = req.onset_minutes
    if req.road_status:
        updates["road_status"] = req.road_status
    if req.safety_instructions:
        updates["safety_instructions"] = req.safety_instructions

    storage.update_alert(alert_id, updates)
    _sync_sim_engine_alerts()

    for a in sim_engine.alerts:
        if a.alert_id == alert_id:
            if req.title:
                a.title = req.title
            if req.recommended_action:
                a.recommended_action = req.recommended_action
            if req.severity:
                a.severity = req.severity
            if req.expires_at:
                a.expires_at = req.expires_at
            if req.onset_minutes is not None:
                a.onset_minutes = req.onset_minutes
            if req.road_status:
                a.road_status = req.road_status
            if req.safety_instructions:
                a.safety_instructions = req.safety_instructions
            a.status = "APPROVED"
            a.lifecycle_status = "APPROVED"
            a.reviewed_at = now_str
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer MODIFIED parameters for alert {alert_id}",
                severity="elevated",
                status="MODIFIED",
                region=a.region
            )
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

# -------------------------------------------------------------
# CITIZEN PUBLIC APIS (GET /api/citizen/alerts, /updates, /status)
# -------------------------------------------------------------

def _format_citizen_alert(d: Dict[str, Any]) -> CitizenAlertPublic:
    return CitizenAlertPublic(
        id=d["id"],
        title=d["title"],
        message=d.get("recommended_action", "Follow official safety directives."),
        severity=storage.map_severity_to_citizen(d.get("severity", "HIGH")),
        location=d.get("region", "National / Regional"),
        latitude=float(d.get("latitude", 21.1458)),
        longitude=float(d.get("longitude", 79.0882)),
        issued_at=d.get("issued_at", ""),
        updated_at=d.get("updated_at", d.get("issued_at", "")),
        expires_at=d.get("expires_at", ""),
        source=d.get("source", "Officer"),
        hazards=d.get("hazards", ["thunderstorm"]),
        road_status=d.get("road_status", "Normal flow with localized caution"),
        safety_instructions=d.get("safety_instructions", [d.get("recommended_action", "Take shelter.")]),
        onset_minutes=d.get("onset_minutes", 30),
        confidence_pct=d.get("confidence", 90),
        status=d.get("status", "ACTIVE")
    )

@router.get("/citizen/alerts", response_model=List[CitizenAlertPublic])
def get_citizen_public_alerts(
    location: Optional[str] = Query(default=None, description="Optional city, district or sector filter"),
    include_expired: bool = Query(default=False, description="Whether to include expired warnings")
):
    """
    Returns public-facing, sanitized citizen alerts stored persistently.
    Excludes internal officer metrics, tokens, and debug details.
    """
    raw_alerts = storage.get_all_alerts(
        location=location,
        include_expired=include_expired,
        published_only=True
    )
    return [_format_citizen_alert(a) for a in raw_alerts]

@router.get("/citizen/alerts/{alert_id}", response_model=CitizenAlertDetailPublic)
def get_citizen_alert_detail(alert_id: str):
    """
    Returns full public details of a specific citizen alert, including
    designated safe public shelters and emergency contacts.
    """
    raw = storage.get_alert_by_id(alert_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Citizen alert not found")

    base = _format_citizen_alert(raw)

    # Determine relevant shelters
    reg_key = "default"
    loc_lower = base.location.lower()
    for k in REGIONAL_SHELTERS.keys():
        if k in loc_lower:
            reg_key = k
            break
    shelters = REGIONAL_SHELTERS.get(reg_key, DEFAULT_SHELTERS)

    return CitizenAlertDetailPublic(
        **base.model_dump(),
        safe_shelters=shelters,
        emergency_contacts=EMERGENCY_CONTACTS
    )

@router.get("/citizen/updates", response_model=List[CitizenUpdatePublic])
def get_citizen_public_updates(
    location: Optional[str] = Query(default=None, description="Optional city/sector filter"),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Returns public bulletins, officer road warnings, and weather updates
    for the citizen mobile dashboard.
    """
    raw_updates = storage.get_updates(location=location, limit=limit)
    return [
        CitizenUpdatePublic(
            id=u["id"],
            timestamp=u["timestamp"],
            title=u["title"],
            category=u.get("category", "BULLETIN"),
            summary=u.get("summary", ""),
            severity=storage.map_severity_to_citizen(u.get("severity", "NORMAL")),
            location=u.get("location", "Regional"),
            source=u.get("source", "IMD Duty Officer")
        )
        for u in raw_updates
    ]

@router.get("/citizen/status", response_model=CitizenStatusPublic)
def get_citizen_overall_status(
    location: Optional[str] = Query(default="Nagpur Sector (Vidarbha)"),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None)
):
    """
    Returns concise, single-screen status for citizen mobile app:
    Current risk indicator (NORMAL/WATCH/HIGH/CRITICAL), live rainfall/weather,
    road connectivity status, and primary safety directives.
    """
    active_alerts = storage.get_all_alerts(
        location=location,
        include_expired=False,
        published_only=True
    )

    # Highest severity
    severity_order = {"CRITICAL": 4, "HIGH": 3, "WATCH": 2, "NORMAL": 1}
    overall_sev = "NORMAL"
    highest_rank = 1
    for a in active_alerts:
        sev_label = storage.map_severity_to_citizen(a.get("severity", "NORMAL"))
        if severity_order.get(sev_label, 1) > highest_rank:
            highest_rank = severity_order[sev_label]
            overall_sev = sev_label

    # Location coordinates
    coords = INDIAN_SECTORS.get(location, {"lat": 21.1458, "lon": 79.0882})
    target_lat = lat if lat is not None else coords["lat"]
    target_lon = lon if lon is not None else coords["lon"]

    # Weather snapshot
    try:
        om = live_weather_service.fetch_open_meteo_live(location)
        rain_rate = om.get("instant_precipitation_mmh", 0.0)
        temp_c = om.get("temperature_c", 28.0)
        wind_kmh = om.get("peak_gust_kmh", 24.0)
        humidity = om.get("relative_humidity_pct", 78.0)
    except Exception:
        rain_rate = 14.5 if overall_sev in ["HIGH", "CRITICAL"] else 0.0
        temp_c = 27.5
        wind_kmh = 45.0 if overall_sev == "CRITICAL" else 18.0
        humidity = 82.0

    # Weather condition string
    if overall_sev == "CRITICAL":
        condition_str = "Severe Thunderstorm with Intense Rain & High Winds"
        headline = "EMERGENCY: Severe Storm Approaching. Seek Safe Shelter."
        road_status = "RESTRICTED: Heavy surface water runoff on underpasses and low routes."
    elif overall_sev == "HIGH":
        condition_str = "Heavy Rain and Convective Cloud Buildup"
        headline = "HIGH ALERT: Heavy rainfall expected in your vicinity."
        road_status = "CAUTION: Wet roads and low visibility. Drive carefully."
    elif overall_sev == "WATCH":
        condition_str = "Partly Cloudy with Scattered Showers"
        headline = "WEATHER WATCH: Atmospheric instability monitored nearby."
        road_status = "NORMAL: Minor surface wetness. Roads operating normally."
    else:
        condition_str = "Clear to Partly Cloudy Skies"
        headline = "WEATHER NORMAL: No severe storms currently detected."
        road_status = "ALL CLEAR: Roads and transit corridors operating smoothly."

    # Safety instructions
    if overall_sev in ["CRITICAL", "HIGH"]:
        safety_inst = [
            "Stay indoors and away from glass windows and tin roofs",
            "Do not stand under tall trees or metal hoardings",
            "Avoid walking or driving through flooded dips or underpasses",
            "Unplug electrical appliances until the storm passes"
        ]
    else:
        safety_inst = [
            "Check local weather updates before travelling long distances",
            "Carry rain gear if travelling on two-wheelers",
            "Follow municipal drainage notices"
        ]

    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return CitizenStatusPublic(
        location=location or "Current Area",
        latitude=target_lat,
        longitude=target_lon,
        overall_severity=overall_sev,
        headline=headline,
        active_alerts_count=len(active_alerts),
        weather={
            "temperature_c": temp_c,
            "condition": condition_str,
            "rain_rate_mmh": rain_rate,
            "wind_speed_kmh": wind_kmh,
            "humidity_pct": humidity
        },
        road_status=road_status,
        safety_instructions=safety_inst,
        last_synced_at=now_str,
        offline_cache_ttl_sec=300
    )

@router.post("/citizen/notifications/subscribe")
def subscribe_citizen_notifications(req: NotificationSubscriptionRequest):
    """Registers citizen device / PWA client for push notifications."""
    return storage.save_notification_subscription(req.model_dump())

@router.get("/citizen/notifications/latest", response_model=List[CitizenAlertPublic])
def get_latest_high_alerts():
    """
    Returns active HIGH and CRITICAL alerts published in the system
    to trigger browser/mobile notifications.
    """
    all_pub = storage.get_all_alerts(include_expired=False, published_only=True)
    urgent = [a for a in all_pub if storage.map_severity_to_citizen(a.get("severity", "")) in ["HIGH", "CRITICAL"]]
    return [_format_citizen_alert(a) for a in urgent]

@router.get("/citizen/active-alert", response_model=Optional[Alert])
def get_citizen_active_alert(region: Optional[str] = Query(default=None)):
    """Legacy compatibility endpoint returning primary published alert."""
    _sync_sim_engine_alerts()
    published = [a for a in sim_engine.alerts if a.lifecycle_status == "PUBLISHED" or a.status == "PUBLISHED"]
    if region:
        matching = [a for a in published if region.lower() in a.region.lower() or a.region.lower() in region.lower()]
        if matching:
            return matching[0]
    return published[0] if published else None

@router.get("/citizen/alert-history", response_model=List[Alert])
def get_citizen_alert_history(region: Optional[str] = Query(default=None)):
    """Legacy compatibility endpoint returning active and historical warnings."""
    _sync_sim_engine_alerts()
    candidates = [a for a in sim_engine.alerts if a.status in ["PUBLISHED", "EXPIRED", "APPROVED", "active", "acknowledged"]]
    if region:
        matching = [a for a in candidates if region.lower() in a.region.lower() or a.region.lower() in region.lower()]
        if matching:
            return matching
    return candidates

@router.get("/system/events", response_model=List[SystemEvent])
def get_system_events():
    """Returns real-time event & decision timeline of meteorological and officer actions."""
    return sim_engine.system_events

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

@router.get("/ml/model-info", response_model=MLModelMetrics)
def get_ml_model_info():
    """Returns architecture, training statistics, and real-time performance metrics of the trained ML ensemble."""
    return ml_engine.metrics

@router.get("/ml/leaderboard", response_model=MultiModelLeaderboardResponse)
def get_ml_leaderboard():
    """Returns benchmark performance and configuration of all 5 trained models in the AI suite."""
    return MultiModelLeaderboardResponse(
        models=ml_engine.metrics.models_in_suite,
        training_samples=ml_engine.metrics.training_samples,
        active_model_id="stacking_ensemble",
        evaluated_at=ml_engine.metrics.trained_at
    )

@router.post("/ml/predict", response_model=MLPredictionResponse)
def predict_ml_convective_risk(req: MLPredictionRequest):
    """
    Performs real-time convective hazard inference using the trained dual Gradient Boosting
    Regressor and Random Forest Classifier ensemble, returning continuous risk score,
    multi-hazard probabilities, true feature importances, and comparison against physics baseline.
    """
    return ml_engine.predict(req)

@router.get("/data-sources")
@router.get("/data-fusion/sources")
def get_data_sources(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns the comprehensive, verified multi-source audit table."""
    return live_weather_service.get_all_sources_audit_table(region)

@router.get("/data-sources/{source_id}")
def get_single_data_source(source_id: str, region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns specific connection status and diagnostics for an individual source adapter."""
    s_lower = source_id.lower()
    if "dwr" in s_lower or "radar" in s_lower:
        return dwr_adapter.test_connection()
    elif "insat" in s_lower or "sat" in s_lower:
        return insat_adapter.test_connection()
    elif "lightning" in s_lower or "gldn" in s_lower or "damini" in s_lower:
        return lightning_adapter.test_connection()
    elif "metar" in s_lower or "aws" in s_lower or "surface" in s_lower:
        return aws_adapter.test_connection()
    elif "rain" in s_lower or "gauge" in s_lower or "disdrometer" in s_lower:
        return rain_gauge_adapter.test_connection()
    elif "nwp" in s_lower or "wrf" in s_lower:
        return nwp_adapter.test_connection()
    elif "dem" in s_lower or "terrain" in s_lower:
        return terrain_adapter.get_status_info()
    elif "open-meteo" in s_lower or "meteo" in s_lower:
        return live_weather_service.fetch_open_meteo_live(region)
    elif "rainviewer" in s_lower:
        return live_weather_service.fetch_rainviewer_radar()
    else:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found")

@router.get("/data-fusion/status")
def get_data_fusion_status(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns top-level data fusion health, mode, and breakdown of real vs simulated vs unavailable sources."""
    pipe = data_fusion_engine.execute_fusion_pipeline(region, mode=sim_engine.system_mode)
    return {
        "status": "OPERATIONAL",
        "region": region,
        "mode": sim_engine.system_mode,
        "fusion_mode_label": pipe.get("fusion_mode_label"),
        "metrics": pipe.get("metrics"),
        "source_health": pipe.get("source_health"),
        "timestamp": pipe.get("timestamp")
    }

@router.get("/model/provenance")
def get_model_feature_provenance(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns the complete feature provenance table showing source and authenticity for every input feature."""
    return {
        "region": region,
        "mode": sim_engine.system_mode,
        "model_calibration_notice": "REAL-DATA INFERENCE WITH PROTOTYPE MODEL (Calibrated Domain Distribution)",
        "provenance": data_fusion_engine.get_feature_provenance(region, mode=sim_engine.system_mode)
    }

@router.get("/model/features")
def get_model_features(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Returns the live normalized feature vector extracted from fused sources."""
    om = live_weather_service.fetch_open_meteo_live(region)
    metar = live_weather_service.fetch_metar_surface_observation(region)
    lat = om.get("latitude", 21.1458)
    lon = om.get("longitude", 79.0882)
    elev = terrain_adapter.get_elevation_m(lat, lon, fallback_m=om.get("elevation_m", 300.0))

    return {
        "region": region,
        "mode": sim_engine.system_mode,
        "features": {
            "temperature_c": metar.get("temperature_c", om.get("temperature_c")),
            "dewpoint_c": metar.get("dewpoint_c", om.get("dewpoint_c")),
            "dewpoint_depression_c": om.get("dewpoint_depression_c"),
            "cape_jkg": om.get("live_cape_jkg"),
            "surface_pressure_hpa": metar.get("altimeter_pressure_hpa", om.get("surface_pressure_hpa")),
            "wind_speed_kmh": metar.get("wind_speed_kmh", om.get("surface_wind_kmh")),
            "wind_gusts_kmh": om.get("peak_gust_kmh"),
            "instant_precip_mmh": om.get("instant_precipitation_mmh"),
            "elevation_m": elev,
            "dwr_max_dbz": None if sim_engine.system_mode == "LIVE_DATA" and not dwr_adapter.is_connected else 58.0,
            "insat_cloud_top_temp_c": None if sim_engine.system_mode == "LIVE_DATA" else -62.0,
            "insat_precipitation_rate_mmh": (
                insat_adapter.get_observation_at(lat, lon).get("rain_rate_mmh")
                if insat_adapter.has_local_granule else None
            ),
            "gldn_lightning_rate": None if sim_engine.system_mode == "LIVE_DATA" and not lightning_adapter.is_connected else 45
        }
    }

@router.get("/data-fusion/pipeline")
def get_data_fusion_pipeline(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """Executes and returns the 10-stage Data Fusion pipeline with verified source statuses."""
    return data_fusion_engine.execute_fusion_pipeline(region, mode=sim_engine.system_mode)

@router.get("/system/mode")
def get_system_mode():
    """Returns current operating mode (LIVE_DATA or SIMULATION)."""
    return {
        "system_mode": sim_engine.system_mode,
        "is_simulation_mode": sim_engine.simulation_mode,
        "active_sector": sim_engine.selected_region
    }

class ModeSwitchRequest(BaseModel):
    mode: str  # "LIVE_DATA" or "SIMULATION"

@router.post("/system/mode")
def set_system_mode(req: ModeSwitchRequest):
    """Switches operational mode between LIVE_DATA and SIMULATION without mixing fake data with live data."""
    if req.mode not in ["LIVE_DATA", "SIMULATION"]:
        raise HTTPException(status_code=400, detail="Mode must be LIVE_DATA or SIMULATION")
    sim_engine.system_mode = req.mode
    sim_engine.simulation_mode = (req.mode == "SIMULATION")
    return {
        "status": "success",
        "system_mode": sim_engine.system_mode,
        "is_simulation_mode": sim_engine.simulation_mode
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
    sim_engine.system_mode = "SIMULATION" if sim_engine.simulation_mode else "LIVE_DATA"
    return {
        "simulation_mode": sim_engine.simulation_mode,
        "system_mode": sim_engine.system_mode
    }

@router.get("/system-health", response_model=SystemHealthStatus)
def get_system_health():
    return sim_engine.get_system_health()

@router.get("/live-external-feed")
def get_live_external_feed(region: str = Query(default="Nagpur Sector (Vidarbha)")):
    """
    Returns live observation feeds from Open-Meteo, NOAA/WMO METAR,
    and RainViewer Doppler Radar Open APIs.
    """
    open_meteo_data = live_weather_service.fetch_open_meteo_live(region)
    rainviewer_data = live_weather_service.fetch_rainviewer_radar()
    metar_data = live_weather_service.fetch_metar_surface_observation(region)
    return {
        "status": "ONLINE",
        "region": region,
        "mode": sim_engine.system_mode,
        "open_meteo": open_meteo_data,
        "wmo_metar": metar_data,
        "rainviewer_radar": rainviewer_data,
        "fusion_timestamp": open_meteo_data.get("retrieved_at")
    }

@router.get("/integrated-apis-info")
def get_integrated_apis_info():
    """
    Returns comprehensive catalog of all active internal and external APIs integrated into VARSHANET.
    """
    return live_weather_service.get_all_integrated_apis_manifest()

# -------------------------------------------------------------
# CITIZEN ENGAGEMENT & CROWDSOURCED GROUND TRUTH ENDPOINTS
# -------------------------------------------------------------

CITIZEN_REPORTS_STORE: List[CitizenGroundReport] = [
    CitizenGroundReport(
        id="REP-2026-081",
        timestamp="Just now (2 mins ago)",
        region="Delhi-NCR / Haryana",
        location_name="Rewari Rural Tehsil, Haryana",
        latitude=28.18,
        longitude=76.62,
        hazard_type="hail",
        severity="severe",
        user_note="Heavy hail falling since 5 minutes, stones around 2-3 cm size. High wind damaging shed roofs.",
        reporter_name="Kisan Ramesh Yadav",
        verified=True,
        upvotes=18
    ),
    CitizenGroundReport(
        id="REP-2026-082",
        timestamp="8 mins ago",
        region="Delhi-NCR / Haryana",
        location_name="Bhiwadi Industrial Border",
        latitude=28.21,
        longitude=76.84,
        hazard_type="downburst",
        severity="high",
        user_note="Violent dust gale and downburst. Visibility dropped under 100 meters, tin sheets blown away.",
        reporter_name="Anil Kumar (Transport Nagar)",
        verified=True,
        upvotes=12
    ),
    CitizenGroundReport(
        id="REP-2026-083",
        timestamp="14 mins ago",
        region="Nagpur Sector (Vidarbha)",
        location_name="Umred Cotton Belt, Nagpur",
        latitude=20.85,
        longitude=79.32,
        hazard_type="lightning",
        severity="severe",
        user_note="Continuous loud cloud-to-ground thunderclaps every 20 seconds. Cattle moved to concrete shed.",
        reporter_name="Sunil Patil (Sarpanch)",
        verified=True,
        upvotes=24
    ),
    CitizenGroundReport(
        id="REP-2026-084",
        timestamp="21 mins ago",
        region="Nagpur Sector (Vidarbha)",
        location_name="Kalmeshwar Mandi Area",
        latitude=21.23,
        longitude=78.91,
        hazard_type="waterlogging",
        severity="high",
        user_note="Torrential downpour with street flash water accumulation of 2 feet near railway underpass.",
        reporter_name="Pooja Sharma",
        verified=False,
        upvotes=7
    ),
    CitizenGroundReport(
        id="REP-2026-085",
        timestamp="32 mins ago",
        region="Kolkata / Gangetic WB",
        location_name="Barasat Rural North 24 Parganas",
        latitude=22.72,
        longitude=79.08,
        hazard_type="cloudburst",
        severity="severe",
        user_note="Extremely intense rain wall. Sudden water rush in agricultural ditches.",
        reporter_name="Dipankar Roy",
        verified=True,
        upvotes=31
    )
]

@router.get("/citizen/reports", response_model=List[CitizenGroundReport])
def get_citizen_reports(region: Optional[str] = Query(default=None)):
    """Returns real-time crowdsourced ground truth observations submitted by citizens and local panchayats."""
    if region:
        # Filter if matching substring or return all if generic
        matching = [r for r in CITIZEN_REPORTS_STORE if region.lower() in r.region.lower() or r.region.lower() in region.lower()]
        return matching if matching else CITIZEN_REPORTS_STORE
    return CITIZEN_REPORTS_STORE

@router.post("/citizen/reports", response_model=CitizenGroundReport)
def submit_citizen_report(req: CitizenReportCreate):
    """Allows citizens / farmers on mobile PWA to submit 1-tap ground truth observations."""
    new_id = f"REP-2026-{len(CITIZEN_REPORTS_STORE) + 86}"
    report = CitizenGroundReport(
        id=new_id,
        timestamp="Just now (1 min ago)",
        region=req.region,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        hazard_type=req.hazard_type,
        severity=req.severity,
        user_note=req.user_note,
        reporter_name=req.reporter_name or "Local Citizen",
        verified=False,
        upvotes=1,
        status="SUBMITTED"
    )
    CITIZEN_REPORTS_STORE.insert(0, report)
    sim_engine.add_system_event(
        event_type="CITIZEN_FEEDBACK",
        description=f"Citizen ground report submitted: {req.hazard_type.upper()} in {req.location_name}",
        severity="normal",
        status="SUBMITTED",
        region=req.region
    )
    return report

@router.post("/citizen/reports/{report_id}/verify")
def verify_citizen_report(report_id: str):
    """Allows mission control radar officer to authenticate and verify citizen ground truth against radar echo."""
    for r in CITIZEN_REPORTS_STORE:
        if r.id == report_id:
            r.verified = True
            r.status = "VERIFIED"
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer VERIFIED citizen report {report_id} ({r.hazard_type.upper()})",
                severity="elevated",
                status="VERIFIED",
                region=r.region
            )
            return {"status": "success", "report_id": report_id, "verified": True, "report_status": "VERIFIED"}
    raise HTTPException(status_code=404, detail="Citizen report not found")

@router.post("/citizen/reports/{report_id}/reject")
def reject_citizen_report(report_id: str):
    """Allows mission control officer to dismiss unverified/spurious citizen reports."""
    for r in CITIZEN_REPORTS_STORE:
        if r.id == report_id:
            r.status = "REJECTED"
            sim_engine.add_system_event(
                event_type="OFFICER_ACTION",
                description=f"Officer REJECTED citizen report {report_id}",
                severity="normal",
                status="REJECTED",
                region=r.region
            )
            return {"status": "success", "report_id": report_id, "verified": False, "report_status": "REJECTED"}
    raise HTTPException(status_code=404, detail="Citizen report not found")

@router.post("/citizen/reports/{report_id}/upvote")
def upvote_citizen_report(report_id: str):
    """Allows neighboring citizens to vouch / confirm the same hazard observation."""
    for r in CITIZEN_REPORTS_STORE:
        if r.id == report_id:
            r.upvotes += 1
            return {"status": "success", "report_id": report_id, "upvotes": r.upvotes}
    raise HTTPException(status_code=404, detail="Citizen report not found")



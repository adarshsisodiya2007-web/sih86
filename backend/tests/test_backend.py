import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.meteorology import (
    calculate_posh,
    calculate_cloudburst_risk,
    calculate_downburst_risk,
    evaluate_convective_risk
)
from app.services.simulation import sim_engine
from app.models.schemas import SeverityLevel

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "VARSHANET" in data["service"]
    assert data["mode"] == "SIMULATION MODE"

def test_posh_calculation():
    # Severe conditions
    prob_severe, sev_severe = calculate_posh(vil_kgm2=50.0, echo_top_km=15.0, max_dbz=65.0, cape_jkg=2800.0)
    assert prob_severe >= 55
    assert sev_severe in [SeverityLevel.HIGH, SeverityLevel.SEVERE]

    # Weak conditions
    prob_weak, sev_weak = calculate_posh(vil_kgm2=10.0, echo_top_km=6.0, max_dbz=32.0, cape_jkg=400.0)
    assert prob_weak <= 25
    assert sev_weak == SeverityLevel.LOW

def test_cloudburst_calculation():
    prob_cb, sev_cb = calculate_cloudburst_risk(
        rain_rate_mmh=95.0,
        vil_kgm2=52.0,
        cloud_top_temp_c=-70.0,
        echo_top_km=15.5,
        terrain_elevation_m=1400.0
    )
    assert prob_cb >= 70
    assert sev_cb in [SeverityLevel.HIGH, SeverityLevel.SEVERE]

def test_downburst_calculation():
    prob_db, wind_gust = calculate_downburst_risk(max_dbz=60.0, vil_kgm2=45.0, dewpoint_depression_c=14.0)
    assert prob_db >= 60
    assert wind_gust > 80.0

def test_convective_risk_assessment():
    assessment = evaluate_convective_risk(
        region="Nagpur Sector",
        dbz=62.0,
        rain_rate=75.0,
        cloud_top_temp=-65.0,
        lightning_rate=60,
        cape=2800.0,
        cin=20.0,
        wind_shear_proxy=20.0,
        dewpoint_dep=10.0,
        elevation_m=310.0
    )
    assert assessment.composite_score >= 60
    assert len(assessment.factors) == 5
    assert len(assessment.recommended_actions) > 0
    assert "Nagpur Sector" in assessment.explanation

def test_storm_cells_endpoint():
    response = client.get("/api/storm-cells")
    assert response.status_code == 200
    cells = response.json()
    assert len(cells) >= 3
    assert "cell_id" in cells[0]
    assert "dbz_max" in cells[0]

def test_forecast_timeline_endpoint():
    response = client.get("/api/forecast?region=Nagpur Sector (Vidarbha)")
    assert response.status_code == 200
    timeline = response.json()
    assert len(timeline) == 7  # NOW, +1H to +6H
    assert timeline[0]["label"] == "NOW"
    assert timeline[6]["label"] == "+6H"

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 1
    first_id = alerts[0]["alert_id"]
    
    ack_res = client.post(f"/api/alerts/{first_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["state"] == "acknowledged"

def test_simulation_tick():
    initial_ticks = sim_engine.tick_count
    response = client.post("/api/simulate/tick")
    assert response.status_code == 200
    assert sim_engine.tick_count == initial_ticks + 1

def test_system_health_endpoint():
    response = client.get("/api/system-health")
    assert response.status_code == 200
    data = response.json()
    assert "SIMULATED" in data["radar_feed_status"]
    assert "SIMULATED" in data["satellite_feed_status"]
    assert data["is_simulation_mode"] is True

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

def test_ml_model_info_endpoint():
    response = client.get("/api/ml/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "Multi-Model" in data["model_name"] or "5-Model" in data["architecture"]
    assert data["training_samples"] > 1000
    assert data["test_r2_score"] >= 0.90
    assert data["roc_auc"] >= 0.90
    assert data["inference_latency_ms"] < 50.0

def test_ml_leaderboard_endpoint():
    response = client.get("/api/ml/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) == 5
    model_ids = [m["model_id"] for m in data["models"]]
    assert "stacking_ensemble" in model_ids
    assert "mlp_neural_net" in model_ids
    assert "gbm" in model_ids
    assert "rf" in model_ids
    assert "hist_gbm" in model_ids

def test_ml_predict_endpoint():
    payload = {
        "max_dbz": 62.0,
        "vil_density": 4.5,
        "echo_top_km": 15.5,
        "cape_jkg": 3100.0,
        "cin_jkg": 20.0,
        "cloud_top_temp_c": -67.0,
        "lightning_rate": 70,
        "wind_shear_proxy": 21.0,
        "dewpoint_depression_c": 11.0,
        "elevation_m": 500.0,
        "region": "Vidarbha Sector",
        "selected_model": "mlp_neural_net"
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["convective_risk_score"] <= 100
    assert data["risk_category"] in ["high", "severe"]
    assert len(data["hazard_probabilities"]) == 4
    assert len(data["feature_importances"]) == 10
    assert len(data["all_model_benchmarks"]) == 5
    assert data["ensemble_consensus_pct"] >= 60
    assert data["inference_latency_ms"] > 0
    assert data["active_model_id"] == "mlp_neural_net"

def test_open_meteo_and_rainviewer_feeds():
    from app.services.live_weather_service import live_weather_service
    om = live_weather_service.fetch_open_meteo_live("Nagpur Sector (Vidarbha)")
    assert "Open-Meteo" in om["source"]
    assert "temperature_c" in om
    assert "dewpoint_depression_c" in om
    assert "live_cape_jkg" in om
    assert "NOT VARSHANET AI PREDICTION" in om["attribution"]

    rv = live_weather_service.fetch_rainviewer_radar()
    assert "RainViewer" in rv["source"]
    assert "NOT Indian DWR" in rv["attribution"]

def test_adapters_status_contracts():
    from app.adapters import (
        dwr_adapter,
        insat_adapter,
        lightning_adapter,
        aws_adapter,
        rain_gauge_adapter,
        nwp_adapter,
        terrain_adapter
    )
    assert dwr_adapter.status == "ADAPTER READY"
    assert dwr_adapter.connection_state == "NOT CONNECTED"

    assert insat_adapter.status == "ADAPTER READY"
    assert insat_adapter.connection_state == "NOT CONNECTED"

    assert lightning_adapter.status == "ADAPTER READY"
    assert lightning_adapter.connection_state == "NOT CONNECTED"

    assert aws_adapter.status == "ADAPTER READY"
    assert aws_adapter.connection_state == "NOT CONNECTED"

    assert rain_gauge_adapter.status == "ADAPTER READY"
    assert rain_gauge_adapter.connection_state == "NOT CONNECTED"

    assert nwp_adapter.status == "NOT CONNECTED"
    assert terrain_adapter.status == "STATIC REFERENCE"

def test_data_fusion_pipeline_endpoint():
    response = client.get("/api/data-fusion/pipeline?region=Nagpur Sector (Vidarbha)")
    assert response.status_code == 200
    data = response.json()
    assert data["stages_executed"] == 10
    assert "live_observations" in data
    assert "fused_features" in data
    assert "physics_derived_indices" in data
    assert "quality_control" in data

def test_sources_audit_endpoint():
    response = client.get("/api/data-fusion/sources?region=Nagpur Sector (Vidarbha)")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) == 9
    names = [s["source"] for s in sources]
    assert "Open-Meteo" in names
    assert "RainViewer Radar" in names
    assert "Doppler Weather Radar (DWR)" in names
    assert "INSAT-3D/3DR Satellite" in names

def test_system_mode_toggle_endpoint():
    # Check default mode
    res = client.get("/api/system/mode")
    assert res.status_code == 200
    assert res.json()["system_mode"] in ["SIMULATION", "LIVE_DATA"]

    # Switch to LIVE_DATA
    res_live = client.post("/api/system/mode", json={"mode": "LIVE_DATA"})
    assert res_live.status_code == 200
    assert res_live.json()["system_mode"] == "LIVE_DATA"
    assert res_live.json()["is_simulation_mode"] is False

    # Switch back to SIMULATION
    res_sim = client.post("/api/system/mode", json={"mode": "SIMULATION"})
    assert res_sim.status_code == 200
    assert res_sim.json()["system_mode"] == "SIMULATION"
    assert res_sim.json()["is_simulation_mode"] is True

def test_past_3_days_forecast_endpoint():
    res = client.get("/api/forecast/past-3-days?region=Nagpur Sector (Vidarbha)")
    assert res.status_code == 200
    data = res.json()
    assert data["timeline_mode"] == "PAST_3_DAYS_ANTECEDENT"
    assert "summary_72h" in data
    assert "daily_summaries" in data
    assert len(data["daily_summaries"]) == 3
    assert "hourly_timeline" in data
    assert len(data["hourly_timeline"]) >= 70



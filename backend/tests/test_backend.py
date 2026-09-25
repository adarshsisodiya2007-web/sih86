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

def test_strict_live_data_isolation():
    # 1. Switch to LIVE_DATA
    res = client.post("/api/system/mode", json={"mode": "LIVE_DATA"})
    assert res.status_code == 200
    assert res.json()["system_mode"] == "LIVE_DATA"

    # 2. In LIVE_DATA mode without DWR credentials, storm cells MUST be empty (zero simulated leak)
    cells_res = client.get("/api/storm-cells")
    assert cells_res.status_code == 200
    assert len(cells_res.json()) == 0

    # 3. In LIVE_DATA mode without GLDN broker, lightning MUST be empty
    ltg_res = client.get("/api/lightning")
    assert ltg_res.status_code == 200
    assert len(ltg_res.json()) == 0

    # 4. In LIVE_DATA mode, radar site observation must reflect AUTH REQUIRED
    radar_res = client.get("/api/radar")
    assert radar_res.status_code == 200
    sites = radar_res.json()
    assert len(sites) > 0
    assert "AUTH REQUIRED" in sites[0]["status"]
    assert sites[0]["max_dbz"] == 0.0

    # 5. In LIVE_DATA mode, satellite observation must reflect AUTH REQUIRED
    sat_res = client.get("/api/satellite")
    assert sat_res.status_code == 200
    sat = sat_res.json()
    assert "AUTH REQUIRED" in sat["scan_time"]
    assert sat["convective_cloud_mask"] is False

    # 6. Switch back to SIMULATION mode
    sim_res = client.post("/api/system/mode", json={"mode": "SIMULATION"})
    assert sim_res.status_code == 200

    # In SIMULATION mode, simulated cells and lightning must be restored
    sim_cells = client.get("/api/storm-cells").json()
    assert len(sim_cells) >= 3

def test_partial_data_ml_prediction_with_priors():
    # Provide only thermodynamic sounding and surface variables (radar & satellite missing)
    partial_payload = {
        "max_dbz": None,
        "vil_density": None,
        "echo_top_km": None,
        "cape_jkg": 3200.0,
        "cin_jkg": 15.0,
        "cloud_top_temp_c": None,
        "lightning_rate": None,
        "wind_shear_proxy": 22.0,
        "dewpoint_depression_c": 12.0,
        "elevation_m": 450.0,
        "region": "Nagpur Sector (Vidarbha)"
    }
    response = client.post("/api/ml/predict", json=partial_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["prediction_mode"] == "PARTIAL_DATA"
    assert data["data_completeness_percentage"] < 100
    assert data["confidence_penalty_applied"] > 0
    assert len(data["missing_sources"]) >= 3
    assert "Doppler Weather Radar (DWR)" in data["missing_sources"]
    assert "INSAT-3D/3DR Satellite" in data["missing_sources"]
    assert 0 <= data["convective_risk_score"] <= 100
    assert "PARTIAL DATA" in data["explanation"]

def test_feature_provenance_endpoint():
    res = client.get("/api/model/provenance?region=Nagpur Sector (Vidarbha)")
    assert res.status_code == 200
    data = res.json()
    assert "provenance" in data
    assert len(data["provenance"]) >= 6
    features = [p["feature"] for p in data["provenance"]]
    assert any("Reflectivity" in f for f in features)
    assert any("CAPE" in f for f in features)

def test_adapter_diagnostics_endpoints():
    dwr_res = client.get("/api/data-sources/dwr")
    assert dwr_res.status_code == 200
    dwr_data = dwr_res.json()
    assert dwr_data["status"] == "AUTH REQUIRED"
    assert dwr_data["public_api_exists"] is False
    assert "IMD" in dwr_data["official_provider"]
    assert "api.imd.gov.in" in dwr_data["official_access_mechanism"]

    insat_res = client.get("/api/data-sources/insat")
    assert insat_res.status_code == 200
    insat_data = insat_res.json()
    assert insat_data["status"] == "AUTH REQUIRED"
    assert insat_data["public_api_exists"] is False
    assert "ISRO" in insat_data["official_provider"]
    assert "mosdac.gov.in" in insat_data["official_access_mechanism"]

    gldn_res = client.get("/api/data-sources/lightning")
    assert gldn_res.status_code == 200
    gldn_data = gldn_res.json()
    assert gldn_data["status"] == "NOT CONNECTED"
    assert gldn_data["public_api_exists"] is False
    assert "IITM" in gldn_data["official_provider"]
    assert "MoU" in gldn_data["official_access_mechanism"]

def test_no_fake_values_leak_into_live_data():
    from app.adapters import dwr_adapter, insat_adapter, lightning_adapter

    # 1. Verify unauthenticated adapters output None for all physical variables
    dwr_obs = dwr_adapter.to_normalized_observation(21.1458, 79.0882)
    assert dwr_obs.variables["max_dbz"] is None
    assert dwr_obs.variables["vil_density"] is None
    assert dwr_obs.variables["echo_top_km"] is None
    assert dwr_obs.quality["data_quality"] == "UNAVAILABLE"

    insat_obs = insat_adapter.to_normalized_observation(21.1458, 79.0882)
    assert insat_obs.variables["cloud_top_temp_c"] is None
    assert insat_obs.variables["cooling_rate_c_15min"] is None
    assert insat_obs.variables["olr_wm2"] is None
    assert insat_obs.quality["data_quality"] == "UNAVAILABLE"

    gldn_obs = lightning_adapter.to_normalized_observation(21.1458, 79.0882)
    assert gldn_obs.variables["flash_rate_per_min"] is None
    assert gldn_obs.variables["latest_strike_distance_km"] is None
    assert gldn_obs.variables["peak_current_ka"] is None
    assert gldn_obs.quality["data_quality"] == "UNAVAILABLE"

    # 2. Switch to LIVE_DATA mode
    client.post("/api/system/mode", json={"mode": "LIVE_DATA"})

    # In LIVE_DATA mode, cells and lightning must be strictly empty (zero simulated leak)
    cells = client.get("/api/storm-cells").json()
    assert len(cells) == 0

    lightning = client.get("/api/lightning").json()
    assert len(lightning) == 0

    # Model features endpoint in LIVE_DATA mode must report None for DWR, INSAT, GLDN
    features_res = client.get("/api/model/features?region=Nagpur Sector (Vidarbha)")
    assert features_res.status_code == 200
    features = features_res.json()["features"]
    assert features["dwr_max_dbz"] is None
    assert features["insat_cloud_top_temp_c"] is None
    assert features["gldn_lightning_rate"] is None

    # But real sources must be present and not None
    assert features["temperature_c"] is not None
    assert features["surface_pressure_hpa"] is not None

    # Switch back to SIMULATION mode
    client.post("/api/system/mode", json={"mode": "SIMULATION"})

def test_citizen_reports_workflow():
    # 1. Fetch initial reports
    res = client.get("/api/citizen/reports")
    assert res.status_code == 200
    initial_reports = res.json()
    assert isinstance(initial_reports, list)
    assert len(initial_reports) >= 1

    # 2. Submit new citizen report
    payload = {
        "region": "Delhi-NCR (Radar Covered)",
        "location_name": "Rewari Sector 4",
        "latitude": 28.18,
        "longitude": 76.62,
        "hazard_type": "Hail",
        "severity": "severe",
        "user_note": "Quarter-sized hail observed with strong winds",
        "reporter_name": "Citizen Sentinel"
    }
    create_res = client.post("/api/citizen/reports", json=payload)
    assert create_res.status_code == 200
    report_data = create_res.json()
    assert "id" in report_data
    report_id = report_data["id"]
    assert report_data["hazard_type"] == "Hail"
    assert report_data["verified"] is False
    assert report_data["upvotes"] == 1

    # 3. Upvote report
    upvote_res = client.post(f"/api/citizen/reports/{report_id}/upvote")
    assert upvote_res.status_code == 200
    assert upvote_res.json()["upvotes"] == 2

    # 4. Officer verifies report
    verify_res = client.post(f"/api/citizen/reports/{report_id}/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True



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

    assert insat_adapter.status in ["ADAPTER READY", "LIVE"]
    assert insat_adapter.connection_state in ["NOT CONNECTED", "LOCAL INGESTION ACTIVE"]

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

    # 5. In LIVE_DATA mode, satellite observation must reflect real local ingestion or AUTH REQUIRED
    sat_res = client.get("/api/satellite")
    assert sat_res.status_code == 200
    sat = sat_res.json()
    assert ("AUTH REQUIRED" in sat["scan_time"]) or ("LOCAL MOSDAC HDF5" in sat["scan_time"])

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
    assert insat_data["status"] in ["AUTH REQUIRED", "LIVE_INGESTION_ACTIVE"]
    assert "ISRO" in insat_data["official_provider"]

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
    assert insat_obs.quality["data_quality"] in ["UNAVAILABLE", "CALIBRATED_IMSRA_L2B"]

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

    # 5. Reject another report
    reject_res = client.post(f"/api/citizen/reports/{report_id}/reject")
    assert reject_res.status_code == 200
    assert reject_res.json()["report_status"] == "REJECTED"

def test_alert_lifecycle_approval_workflow():
    # 1. Fetch alerts
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    
    target_alert = alerts[1] # e.g. PENDING REVIEW or DRAFT
    target_id = target_alert["alert_id"]

    # 2. Modify Alert
    modify_payload = {
        "title": "UPDATED CLOUDBURST ALERT BY MET OFFICER",
        "recommended_action": "Seek reinforced higher ground immediately. Disconnect power lines.",
        "onset_minutes": 15
    }
    mod_res = client.put(f"/api/alerts/{target_id}/modify", json=modify_payload)
    assert mod_res.status_code == 200
    assert mod_res.json()["title"] == "UPDATED CLOUDBURST ALERT BY MET OFFICER"
    assert mod_res.json()["lifecycle_status"] == "APPROVED"

    # 3. Approve Alert
    app_res = client.post(f"/api/alerts/{target_id}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["lifecycle_status"] == "APPROVED"

    # 4. Publish Alert to Citizens
    pub_res = client.post(f"/api/alerts/{target_id}/publish")
    assert pub_res.status_code == 200
    assert pub_res.json()["lifecycle_status"] == "PUBLISHED"
    assert pub_res.json()["published_at"] is not None

    # 5. Citizen active alert endpoint returns the published alert
    active_citizen_res = client.get("/api/citizen/active-alert")
    assert active_citizen_res.status_code == 200
    active_alert = active_citizen_res.json()
    assert active_alert is not None
    assert active_alert["lifecycle_status"] == "PUBLISHED"

    # 6. Citizen alert history
    history_res = client.get("/api/citizen/alert-history")
    assert history_res.status_code == 200
    assert isinstance(history_res.json(), list)

    # 7. Reject Alert
    rej_res = client.post(f"/api/alerts/{target_id}/reject", json={"reason": "Storm sheared out before impact"})
    assert rej_res.status_code == 200
    assert rej_res.json()["lifecycle_status"] == "REJECTED"
    assert rej_res.json()["rejection_reason"] == "Storm sheared out before impact"

def test_system_events_timeline():
    events_res = client.get("/api/system/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert isinstance(events, list)
    assert len(events) >= 1
    first_event = events[0]
    assert "timestamp" in first_event
    assert "event_type" in first_event
    assert "description" in first_event

def test_insat_local_ingestion_pipeline():
    from app.adapters.insat_adapter import insat_adapter
    assert insat_adapter.has_local_granule is True
    assert insat_adapter.is_connected is True
    meta = insat_adapter.get_latest_granule_info()
    assert meta["available"] is True
    assert "3RIMG" in meta["file_name"]
    assert meta["satellite_name"] == "INSAT-3DR"
    assert meta["max_rain_mmh"] == 60.0

    # Query coordinate at Nagpur
    obs = insat_adapter.get_observation_at(21.1458, 79.0882)
    assert obs["is_available"] is True
    assert obs["units"] == "mm/hr"
    assert obs["satellite_name"] == "INSAT-3DR"
    assert obs["is_valid_measurement"] is True

    # Query API endpoint
    res = client.get("/api/satellite/observation?lat=21.1458&lon=79.0882")
    assert res.status_code == 200
    data = res.json()
    assert data["is_available"] is True
    assert data["units"] == "mm/hr"
    assert data["satellite_name"] == "INSAT-3DR"

def test_mosdac_acquisition_status_endpoint():
    from app.services.mosdac_acquisition_service import mosdac_acquisition_service
    res = client.get("/api/satellite/acquisition/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["dataset_id"] == "3RIMG_L2B_IMC"
    assert "official_tool" in data
    assert "download_directory" in data
    assert "password" not in str(data).lower()  # Never leak credentials

def test_mosdac_acquisition_missing_credentials_safety():
    import os
    from app.services.mosdac_acquisition_service import MOSDACAcquisitionService
    service = MOSDACAcquisitionService()
    # Ensure empty credentials
    old_user = os.environ.pop("MOSDAC_USERNAME", None)
    old_pass = os.environ.pop("MOSDAC_PASSWORD", None)
    try:
        assert service.is_configured() is False
        res = service.acquire_latest_granule()
        assert res["success"] is False
        assert res["status"] == "CREDENTIALS_REQUIRED"
        assert "MOSDAC_USERNAME" in res["error"]
    finally:
        if old_user:
            os.environ["MOSDAC_USERNAME"] = old_user
        if old_pass:
            os.environ["MOSDAC_PASSWORD"] = old_pass

def test_mosdac_acquisition_configuration_detection():
    import os
    from app.services.mosdac_acquisition_service import MOSDACAcquisitionService
    os.environ["MOSDAC_USERNAME"] = "test_mosdac_user"
    os.environ["MOSDAC_PASSWORD"] = "test_mosdac_pass"
    try:
        service = MOSDACAcquisitionService()
        assert service.is_configured() is True
        status_info = service.get_status_info()
        assert status_info["is_configured"] is True
        assert status_info["status"] == "CONFIGURED (STANDBY)"
        assert "test_mosdac_pass" not in str(status_info)  # Secret not exposed
    finally:
        os.environ.pop("MOSDAC_USERNAME", None)
        os.environ.pop("MOSDAC_PASSWORD", None)

def test_mosdac_latest_granule_selection_and_ingestion():
    from app.adapters.insat_adapter import insat_adapter
    # Check that latest granule path resolves to a valid existing .h5 file
    granule_path = insat_adapter.get_latest_granule_path()
    assert granule_path is not None
    assert granule_path.endswith(".h5") or granule_path.endswith(".hdf5")
    
    meta = insat_adapter.get_latest_granule_info()
    assert meta["available"] is True
    assert meta["file_name"].startswith("3RIMG")
    assert meta["product_type"] == "GEOPHY"

    # Verify spatial query
    obs = insat_adapter.get_observation_at(21.1458, 79.0882)
    assert obs["is_available"] is True
    assert obs["rain_rate_mmh"] is not None
    assert obs["rain_rate_mmh"] >= 0.0

def test_mosdac_no_fake_data_fallback_and_fill_handling():
    from app.adapters.insat_adapter import insat_adapter
    # Ensure that cloud_top_temp is None for L2B IMC (which is precipitation rate, not radiance)
    norm = insat_adapter.to_normalized_observation(21.1458, 79.0882)
    assert norm.variables["cloud_top_temp_c"] is None
    assert norm.variables["cooling_rate_c_15min"] is None
    assert norm.variables["olr_wm2"] is None
    # Ensure rain_rate is numeric and >= 0.0
    assert norm.variables["rain_rate_mmh"] is not None
    assert norm.variables["rain_rate_mmh"] >= 0.0





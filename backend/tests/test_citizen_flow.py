import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import storage

client = TestClient(app)

def test_citizen_alerts_endpoint():
    """Verify GET /api/citizen/alerts returns public sanitized alerts."""
    res = client.get("/api/citizen/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

    first = alerts[0]
    # Check public fields presence
    assert "id" in first
    assert "title" in first
    assert "message" in first
    assert "severity" in first
    assert first["severity"] in ["NORMAL", "WATCH", "HIGH", "CRITICAL"]
    assert "location" in first
    assert "latitude" in first
    assert "longitude" in first
    assert "road_status" in first
    assert "safety_instructions" in first
    assert isinstance(first["safety_instructions"], list)
    assert "source" in first

    # Ensure officer internal fields are stripped
    assert "reviewed_by" not in first
    assert "affected_population_est" not in first

def test_citizen_alert_detail():
    """Verify GET /api/citizen/alerts/{id} returns details with safe shelters."""
    list_res = client.get("/api/citizen/alerts")
    alerts = list_res.json()
    assert len(alerts) > 0
    target_id = alerts[0]["id"]

    res = client.get(f"/api/citizen/alerts/{target_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == target_id
    assert "safe_shelters" in detail
    assert isinstance(detail["safe_shelters"], list)
    assert len(detail["safe_shelters"]) >= 1
    assert "emergency_contacts" in detail
    assert "112" in detail["emergency_contacts"].values()

def test_citizen_updates_endpoint():
    """Verify GET /api/citizen/updates returns recent bulletins and notices."""
    res = client.get("/api/citizen/updates")
    assert res.status_code == 200
    updates = res.json()
    assert isinstance(updates, list)
    assert len(updates) >= 1
    first = updates[0]
    assert "id" in first
    assert "title" in first
    assert "category" in first
    assert "summary" in first
    assert "severity" in first
    assert "location" in first

def test_citizen_status_endpoint():
    """Verify GET /api/citizen/status returns location-based risk and weather."""
    res = client.get("/api/citizen/status?location=Nagpur Sector (Vidarbha)")
    assert res.status_code == 200
    status = res.json()
    assert status["location"] == "Nagpur Sector (Vidarbha)"
    assert status["overall_severity"] in ["NORMAL", "WATCH", "HIGH", "CRITICAL"]
    assert "headline" in status
    assert "weather" in status
    assert "temperature_c" in status["weather"]
    assert "rain_rate_mmh" in status["weather"]
    assert "road_status" in status
    assert "safety_instructions" in status

def test_officer_to_citizen_lifecycle_flow():
    """
    Complete end-to-end verification:
    A. Officer creates a test public alert from officer endpoint.
    B. Backend persistently stores it.
    C. GET /api/citizen/alerts returns it.
    D. Updating the officer alert updates the citizen data.
    E. Expired alerts are handled correctly.
    """
    # 1. Officer creates a test alert for Rewa
    new_alert_payload = {
        "title": "Severe Thunderstorm & Flash Waterlogging - Rewa",
        "region": "Rewa Sector (Vindhya)",
        "severity": "high",
        "hazards": ["thunderstorm", "hail"],
        "probability": 92,
        "onset_minutes": 20,
        "confidence": 95,
        "recommended_action": "Seek immediate indoor shelter. Avoid NH-30 bypass underpass.",
        "road_status": "RESTRICTED: NH-30 bypass submerged under 1.5 ft water; diversion via City Center.",
        "safety_instructions": [
            "Remain inside sturdy buildings",
            "Avoid travelling on NH-30 bypass",
            "Do not touch fallen wires or poles"
        ],
        "expires_in_hours": 2.5,
        "latitude": 24.53,
        "longitude": 81.30,
        "publish_immediately": True
    }

    create_res = client.post("/api/alerts", json=new_alert_payload)
    assert create_res.status_code == 200
    created_alert = create_res.json()
    alert_id = created_alert["alert_id"]
    assert "ALT-" in alert_id
    assert created_alert["title"] == new_alert_payload["title"]
    assert created_alert["status"] == "PUBLISHED"

    # 2. Check persistence in storage
    stored = storage.get_alert_by_id(alert_id)
    assert stored is not None
    assert stored["title"] == new_alert_payload["title"]

    # 3. GET /api/citizen/alerts returns it
    cit_res = client.get("/api/citizen/alerts")
    assert cit_res.status_code == 200
    cit_alerts = cit_res.json()
    matching = [a for a in cit_alerts if a["id"] == alert_id]
    assert len(matching) == 1
    cit_alert = matching[0]
    assert cit_alert["title"] == new_alert_payload["title"]
    assert cit_alert["severity"] == "HIGH"
    assert cit_alert["location"] == "Rewa Sector (Vindhya)"
    assert cit_alert["latitude"] == 24.53
    assert cit_alert["longitude"] == 81.30
    assert "NH-30" in cit_alert["road_status"]

    # 4. Filter by location
    cit_rewa = client.get("/api/citizen/alerts?location=Rewa")
    assert cit_rewa.status_code == 200
    rewa_alerts = cit_rewa.json()
    assert any(a["id"] == alert_id for a in rewa_alerts)

    # 5. Officer modifies alert parameters
    mod_payload = {
        "title": "UPDATED: Severe Thunderstorm & Flash Waterlogging - Rewa",
        "recommended_action": "High danger: Stay indoors. Flood waters receding slowly.",
        "severity": "severe",
        "road_status": "BLOCKED: NH-30 completely closed near bypass."
    }
    mod_res = client.put(f"/api/alerts/{alert_id}/modify", json=mod_payload)
    assert mod_res.status_code == 200

    # 6. Verify citizen endpoints immediately reflect modification
    cit_res_after = client.get(f"/api/citizen/alerts/{alert_id}")
    assert cit_res_after.status_code == 200
    updated_cit = cit_res_after.json()
    assert updated_cit["title"] == "UPDATED: Severe Thunderstorm & Flash Waterlogging - Rewa"
    assert updated_cit["severity"] == "CRITICAL"
    assert "completely closed" in updated_cit["road_status"]

    # 7. Expired alert handling: simulate expired alert
    past_time = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    storage.update_alert(alert_id, {"expires_at": past_time})

    # Default citizen query should exclude expired alert
    cit_active_only = client.get("/api/citizen/alerts")
    assert not any(a["id"] == alert_id for a in cit_active_only.json())

    # Include expired should return it with status EXPIRED
    cit_with_expired = client.get("/api/citizen/alerts?include_expired=true")
    matching_expired = [a for a in cit_with_expired.json() if a["id"] == alert_id]
    assert len(matching_expired) == 1
    assert matching_expired[0]["status"] == "EXPIRED"

def test_citizen_notifications():
    """Verify notification subscription and latest high alerts polling."""
    sub_res = client.post("/api/citizen/notifications/subscribe", json={
        "endpoint": "https://push.browser.test/sub-12345",
        "device_info": {"browser": "Chrome Mobile", "os": "Android"}
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "subscribed"

    latest_res = client.get("/api/citizen/notifications/latest")
    assert latest_res.status_code == 200
    assert isinstance(latest_res.json(), list)

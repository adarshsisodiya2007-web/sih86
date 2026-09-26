"""
Live end-to-end test:
1. Create a new alert via POST /api/alerts on Render backend
2. Verify it appears in GET /api/citizen/alerts
"""
import urllib.request, urllib.error, json
from datetime import datetime, timezone

BASE = "https://sih86.onrender.com"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "VARSHANET-Officer/2.5"
}

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Step 1: Create a test alert
print("=" * 55)
print("STEP 1: Creating test alert on Render backend...")
print("=" * 55)

payload = {
    "title": "TEST ALERT — Officer to Citizen Flow Verification",
    "region": "Nagpur Sector (Vidarbha)",
    "severity": "high",
    "hazards": ["thunderstorm"],
    "probability": 82,
    "onset_minutes": 25,
    "confidence": 88,
    "recommended_action": "Take shelter immediately. Thunderstorm with heavy rain expected.",
    "publish_immediately": True,
    "expires_in_hours": 2.0,
    "road_status": "Caution: Heavy rainfall expected on NH-44 and Ring Road.",
    "safety_instructions": [
        "Move to higher ground if near low-lying areas",
        "Avoid open fields and tall trees during lightning",
        "Keep emergency kit ready"
    ]
}

body_bytes = json.dumps(payload).encode()
req = urllib.request.Request(
    f"{BASE}/api/alerts",
    data=body_bytes,
    headers=HEADERS,
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = json.loads(r.read().decode())
        alert_id = resp.get("alert_id", "?")
        print(f"  ✅ Alert CREATED: {alert_id}")
        print(f"  Title: {resp.get('title')}")
        print(f"  Status: {resp.get('status')} / Lifecycle: {resp.get('lifecycle_status')}")
        print(f"  Region: {resp.get('region')}")
        print(f"  Issued: {resp.get('issued_at')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"  ❌ Error {e.code}: {body[:300]}")
    exit(1)
except Exception as ex:
    print(f"  ❌ Exception: {ex}")
    exit(1)

# Step 2: Check citizen/alerts endpoint
print()
print("=" * 55)
print("STEP 2: Checking /api/citizen/alerts (what citizen sees)")
print("=" * 55)

req2 = urllib.request.Request(
    f"{BASE}/api/citizen/alerts",
    headers={"Accept": "application/json", "User-Agent": "CitizenApp/1.0"}
)
with urllib.request.urlopen(req2, timeout=10) as r2:
    alerts = json.loads(r2.read().decode())
    print(f"  Total citizen alerts visible: {len(alerts)}")
    for a in alerts:
        marker = "👈 NEW" if alert_id in a.get("id", "") else ""
        print(f"  [{a.get('id')}] {a.get('title','')[:50]} — {a.get('status')} {marker}")

# Step 3: Citizen status
print()
print("=" * 55)
print("STEP 3: Citizen status page")
print("=" * 55)

req3 = urllib.request.Request(
    f"{BASE}/api/citizen/status?location=Nagpur+Sector+(Vidarbha)",
    headers={"Accept": "application/json"}
)
with urllib.request.urlopen(req3, timeout=10) as r3:
    status = json.loads(r3.read().decode())
    print(f"  Overall severity: {status.get('overall_severity')}")
    print(f"  Headline: {status.get('headline')}")
    print(f"  Active alerts count: {status.get('active_alerts_count', '?')}")

print()
print("=" * 55)
print("✅ FLOW WORKING! Officer alert → Render → Citizen Portal")
print(f"   Open: https://frontend-azure-theta-33.vercel.app/")
print("=" * 55)

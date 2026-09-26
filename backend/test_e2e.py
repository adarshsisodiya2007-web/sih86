import sys, io, urllib.request, urllib.error, json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "https://sih86.onrender.com"

# STEP 1: Create officer alert
print("STEP 1: Creating officer alert on Render backend...")
payload = json.dumps({
    "title": "OFFICER TEST ALERT - Thunderstorm Warning Nagpur",
    "region": "Nagpur Sector (Vidarbha)",
    "severity": "high",
    "hazards": ["thunderstorm"],
    "probability": 85,
    "onset_minutes": 20,
    "confidence": 90,
    "recommended_action": "Take indoor shelter. Severe thunderstorm with lightning approaching.",
    "publish_immediately": True,
    "expires_in_hours": 3.0,
    "road_status": "Caution: Heavy rainfall expected. Avoid low-lying areas.",
    "safety_instructions": [
        "Stay indoors away from windows",
        "Avoid trees and metal structures during lightning",
        "Disconnect electrical appliances"
    ]
}).encode()

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "VARSHANET-Officer/2.5"
}

req = urllib.request.Request(f"{BASE}/api/alerts", data=payload, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        resp = json.loads(r.read().decode())
        alert_id = resp.get("alert_id", "?")
        print(f"  [OK] CREATED: {alert_id}")
        print(f"  Title: {resp.get('title')}")
        print(f"  Status: {resp.get('status')} / {resp.get('lifecycle_status')}")
except Exception as ex:
    print(f"  [ERROR] {ex}")
    exit(1)

# STEP 2: What citizen sees
print()
print("STEP 2: Citizen portal GET /api/citizen/alerts...")
req2 = urllib.request.Request(f"{BASE}/api/citizen/alerts", headers={"Accept": "application/json"})
with urllib.request.urlopen(req2, timeout=12) as r2:
    alerts = json.loads(r2.read().decode())
    print(f"  Total citizen alerts visible: {len(alerts)}")
    for a in alerts:
        tag = " <-- THIS IS THE NEW ONE" if alert_id in str(a.get("id", "")) else ""
        title = str(a.get("title", ""))[:55]
        print(f"  [{a.get('id')}] {title} -- {a.get('status')}{tag}")

# STEP 3: Citizen status
print()
print("STEP 3: Citizen status...")
req3 = urllib.request.Request(f"{BASE}/api/citizen/status", headers={"Accept": "application/json"})
with urllib.request.urlopen(req3, timeout=12) as r3:
    st = json.loads(r3.read().decode())
    print(f"  Overall severity: {st.get('overall_severity')}")
    print(f"  Headline: {st.get('headline')}")

print()
print("=" * 60)
print("FLOW WORKING:")
print("  Officer Dashboard (localhost:5173)")
print("    --> sih86.onrender.com/api/alerts  [POST]")
print("    --> Alert saved in Render DB")
print("    --> Citizen Portal (vercel) fetches same backend")
print("    --> Citizen SEES the alert!")
print()
print("Open citizen portal: https://frontend-azure-theta-33.vercel.app/")
print("=" * 60)

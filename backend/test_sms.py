"""Test SMS API status on the live Render backend"""
import urllib.request, urllib.error, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = "https://sih86.onrender.com"
HEADERS = {"Accept": "application/json", "User-Agent": "VARSHANET-Test/1.0"}

def get(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as ex:
        return 0, {"error": str(ex)}

def post(url, payload):
    try:
        req = urllib.request.Request(
            url, data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", **HEADERS},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as ex:
        return 0, {"error": str(ex)}

print("=" * 55)
print("STEP 1: SMS Gateway Status (Render backend)")
print("=" * 55)
s, data = get(f"{BASE}/api/sms/status")
print(f"  Status code: {s}")
print(f"  Configured: {data.get('configured')}")
print(f"  Wallet balance: {data.get('wallet')}")
print(f"  SMS count: {data.get('sms_count')}")
print(f"  Status: {data.get('status')}")
if data.get('error'):
    print(f"  Error: {data.get('error')}")
if data.get('raw'):
    print(f"  Raw response: {data.get('raw')}")

print()
print("=" * 55)
print("STEP 2: SMS Broadcast Test (no real numbers — preview only)")
print("=" * 55)
s2, data2 = post(f"{BASE}/api/sms/broadcast", {
    "alert_title": "Severe Thunderstorm Warning - Test",
    "region": "Nagpur Sector (Vidarbha)",
    "severity": "HIGH",
    "action": "Take indoor shelter immediately.",
    "phone_numbers": ""  # empty = preview mode only
})
print(f"  Status code: {s2}")
print(f"  Success: {data2.get('success')}")
print(f"  Status: {data2.get('status')}")
print(f"  Message: {data2.get('message')}")
print(f"  Dispatched: {data2.get('dispatched_count')}")
if data2.get('sms_preview'):
    print(f"  SMS Preview:")
    print(f"  {'-'*40}")
    for line in str(data2.get('sms_preview','')).split('\\n'):
        print(f"  {line}")
    print(f"  {'-'*40}")

print()
print("=" * 55)
print("STEP 3: SMS with real number test (your number)")
print("=" * 55)
print("  Sending to: 9XXXXXXXXXX (add your number below)")
YOUR_NUMBER = ""  # Add your 10-digit number here to actually test

if YOUR_NUMBER:
    s3, data3 = post(f"{BASE}/api/sms/broadcast", {
        "alert_title": "VARSHANET TEST - Thunderstorm Warning",
        "region": "Nagpur Sector (Vidarbha)",
        "severity": "HIGH",
        "action": "This is a test alert from VARSHANET SIH project.",
        "phone_numbers": YOUR_NUMBER
    })
    print(f"  HTTP: {s3}")
    print(f"  Response: {json.dumps(data3, indent=2)}")
else:
    print("  Skipped — no number configured in test script")
    print("  (Add your 10-digit mobile number in YOUR_NUMBER variable to test real SMS)")

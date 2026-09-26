"""Check Render backend status and citizen alerts"""
import urllib.request, json, urllib.error

RENDER_URL = "https://sih86.onrender.com"
LOCAL_URL = "http://localhost:8000"

def check(base, name):
    print(f"\n{'='*50}")
    print(f"Testing: {name} ({base})")
    print('='*50)
    
    endpoints = [
        "/api/health",
        "/api/citizen/alerts",
        "/api/citizen/status",
        "/api/alerts",
    ]
    
    for ep in endpoints:
        try:
            req = urllib.request.Request(
                base + ep,
                headers={"Accept": "application/json", "User-Agent": "VARSHANET-Checker/1.0"}
            )
            with urllib.request.urlopen(req, timeout=12) as r:
                body = r.read().decode('utf-8', errors='replace')
                try:
                    data = json.loads(body)
                    if isinstance(data, list):
                        print(f"  [200] {ep} => {len(data)} items")
                        for item in data[:2]:
                            if isinstance(item, dict):
                                print(f"         id={item.get('id','?')} title={str(item.get('title','?'))[:40]} status={item.get('status','?')}")
                    else:
                        print(f"  [200] {ep} => {str(data)[:150]}")
                except:
                    print(f"  [200] {ep} => {body[:150]}")
        except urllib.error.HTTPError as e:
            print(f"  [{e.code}] {ep}: {e.reason}")
        except Exception as ex:
            print(f"  [ERR] {ep}: {ex}")

check(RENDER_URL, "RENDER (Vercel Citizen Portal backend)")
check(LOCAL_URL, "LOCAL (Your machine)")

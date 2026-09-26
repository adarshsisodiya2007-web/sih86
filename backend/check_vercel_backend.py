"""Check what backend URL the Vercel-deployed frontend uses"""
import urllib.request, re

req = urllib.request.Request(
    'https://frontend-azure-theta-33.vercel.app/',
    headers={'User-Agent': 'Mozilla/5.0 Chrome/120'}
)
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8', errors='replace')

# Find JS bundle
js_src = re.findall(r'src="(/assets/index[^"]+\.js)"', html)
print('JS bundles:', js_src)

if js_src:
    js_url = 'https://frontend-azure-theta-33.vercel.app' + js_src[0]
    print('Fetching:', js_url)
    req2 = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req2, timeout=20) as r2:
        js = r2.read().decode('utf-8', errors='replace')
    print('Bundle size:', len(js), 'bytes')

    # Find backend/API URLs
    backend_urls = re.findall(r'(https?://[^\s",\'\`\\\\]{10,})', js)
    unique_urls = sorted(set(backend_urls))
    print('\nAll backend URLs in bundle:')
    for u in unique_urls:
        if any(x in u for x in ['8000', 'railway', 'render', 'heroku', 'fly.io', 'azure', 'ngrok', 'onrender', 'api']):
            print(' ', u)

    # Citizen endpoints
    citizen_eps = re.findall(r'"/api/citizen[^"]*"', js)
    print('\nCitizen API endpoints used:', list(set(citizen_eps)))

    # VITE_API_URL baked in
    vite_url = re.findall(r'VITE_API_URL[^"]*"([^"]+)"', js)
    print('VITE_API_URL in bundle:', vite_url)

    # Look for localhost
    if 'localhost' in js:
        print('WARNING: bundle still references localhost!')
else:
    print('No JS bundle found in HTML')

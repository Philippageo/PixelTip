import urllib.request, json

# Try to get list of supported solc versions from ArcScan
urls = [
    'https://testnet.arcscan.app/api?module=contract&action=getsolcversions',
    'https://testnet.arcscan.app/api?module=contract&action=listsolcversions',
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
}

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        print(f"URL: {url}")
        print(json.dumps(data, indent=2)[:2000])
        print("---")
    except Exception as e:
        print(f"URL: {url} => Error: {e}")

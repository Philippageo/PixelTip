import urllib.request, json, urllib.parse, time

# Simple source to test which versions work
test_source = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Test { uint256 public x = 1; }"""

# Known Blockscout-compatible versions to try
versions = [
    "v0.8.19+commit.7dd6d404",
    "v0.8.17+commit.8df45f5f",
    "v0.8.24+commit.e11b9ed9",
    "v0.8.21+commit.d9974bed",
    "v0.8.18+commit.87f61d96",
    "v0.8.16+commit.07a7930e",
    "v0.8.15+commit.e14f2714",
    "v0.8.23+commit.f704f362",
]

headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json',
    'Origin': 'https://testnet.arcscan.app',
    'Referer': 'https://testnet.arcscan.app/verifyContract',
}

# Use a dummy address just to test if the version string is accepted
dummy_addr = "0x000000000000000000000000000000000000dEaD"

for ver in versions:
    data = urllib.parse.urlencode({
        'apikey': 'YourApiKeyToken',
        'module': 'contract',
        'action': 'verifysourcecode',
        'contractaddress': dummy_addr,
        'sourceCode': test_source,
        'codeformat': 'solidity-single-file',
        'contractname': 'Test',
        'compilerversion': ver,
        'optimizationUsed': '0',
        'licenseType': '3',
    }).encode()
    try:
        req = urllib.request.Request('https://testnet.arcscan.app/api', data=data, headers=headers, method='POST')
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        msg = result.get('result', '') + ' | ' + result.get('message', '')
        print(f"{ver}: status={result.get('status')} result={result.get('result','')[:60]}")
        # If not "Invalid compiler version", this version is supported
        if 'Invalid' not in str(result.get('result','')) and 'invalid' not in str(result.get('result','').lower()):
            print(f"  ^^^ POTENTIALLY SUPPORTED ^^^")
        time.sleep(0.5)
    except Exception as e:
        print(f"{ver}: ERROR {e}")

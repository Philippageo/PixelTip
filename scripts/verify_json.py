import urllib.request
import json
import urllib.parse

# Standard JSON input format for verification
standard_json = {
    "language": "Solidity",
    "sources": {
        "PixelTipRegistry.sol": {
            "content": """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PixelTipRegistry {
    address public owner;
    uint256 public totalOrders;

    struct Service {
        string title;
        uint256 priceUSDC;
        bool active;
    }

    struct Order {
        address client;
        uint8 serviceId;
        uint256 amount;
        uint256 timestamp;
        string status;
    }

    Service[] public services;
    Order[] public orders;

    event ServiceAdded(uint8 indexed id, string title, uint256 price);
    event OrderPlaced(uint256 indexed orderId, address indexed client, uint8 serviceId);
    event OrderUpdated(uint256 indexed orderId, string status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        services.push(Service("Graphic Design", 40000000, true));
        services.push(Service("Video Production", 55000000, true));
        services.push(Service("3D Design & VFX", 70000000, true));
        services.push(Service("English Tutoring", 25000000, true));
    }

    function addService(string calldata title, uint256 priceUSDC) external onlyOwner {
        uint8 id = uint8(services.length);
        services.push(Service(title, priceUSDC, true));
        emit ServiceAdded(id, title, priceUSDC);
    }

    function toggleService(uint8 id, bool active) external onlyOwner {
        services[id].active = active;
    }

    function placeOrder(uint8 serviceId) external {
        require(serviceId < services.length, "Invalid service");
        require(services[serviceId].active, "Service inactive");
        uint256 orderId = orders.length;
        orders.push(Order(msg.sender, serviceId, services[serviceId].priceUSDC, block.timestamp, "pending"));
        totalOrders++;
        emit OrderPlaced(orderId, msg.sender, serviceId);
    }

    function updateOrderStatus(uint256 orderId, string calldata status) external onlyOwner {
        orders[orderId].status = status;
        emit OrderUpdated(orderId, status);
    }

    function getServicesCount() external view returns (uint256) {
        return services.length;
    }

    function getOrdersCount() external view returns (uint256) {
        return orders.length;
    }
}"""
        }
    },
    "settings": {
        "optimizer": {"enabled": True, "runs": 200},
        "outputSelection": {
            "*": {"*": ["abi", "evm.bytecode"]}
        }
    }
}

data = urllib.parse.urlencode({
    'apikey': 'YourApiKeyToken',
    'module': 'contract',
    'action': 'verifysourcecode',
    'contractaddress': '0xA8c2b034e02009AD3E85512EEcDc9d013AA4518D',
    'sourceCode': json.dumps(standard_json),
    'codeformat': 'solidity-standard-json-input',
    'contractname': 'PixelTipRegistry.sol:PixelTipRegistry',
    'compilerversion': 'v0.8.35+commit.d2d2e929',
    'optimizationUsed': '1',
    'runs': '200',
    'licenseType': '3',
}).encode()

req = urllib.request.Request(
    'https://testnet.arcscan.app/api',
    data=data,
    headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://testnet.arcscan.app',
        'Referer': 'https://testnet.arcscan.app/verifyContract',
    },
    method='POST'
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    print('Submit response:', json.dumps(result, indent=2))
    
    if result.get('status') == '1':
        guid = result['result']
        print('\nGUID:', guid)
        print('Checking status in 5s...')
        import time
        time.sleep(5)
        
        check_req = urllib.request.Request(
            f'https://testnet.arcscan.app/api?module=contract&action=checkverifystatus&guid={guid}',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        check_resp = urllib.request.urlopen(check_req, timeout=15)
        check_result = json.loads(check_resp.read())
        print('Status:', json.dumps(check_result, indent=2))
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print(e.read().decode()[:500])
except Exception as e:
    print('Error:', e)

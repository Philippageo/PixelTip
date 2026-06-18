import urllib.request
import json
import urllib.parse
import time

contract_source = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PixelTip {
    address public owner;
    uint256 public totalTips;
    uint256 public totalVolume;
    uint256 public platformFee;

    struct Creator {
        string name;
        string category;
        bool active;
        uint256 tipsReceived;
        uint256 volumeReceived;
    }

    struct Tip {
        address sender;
        address creator;
        uint256 amount;
        uint256 timestamp;
        string message;
    }

    mapping(address => Creator) public creators;
    mapping(address => uint256) public pendingWithdrawals;
    address[] public creatorList;
    Tip[] public tips;

    event CreatorRegistered(address indexed creator, string name, string category);
    event TipSent(address indexed sender, address indexed creator, uint256 amount, string message);
    event Withdrawn(address indexed creator, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 _platformFee) {
        owner = msg.sender;
        platformFee = _platformFee;
    }

    function registerCreator(string calldata name, string calldata category) external {
        require(!creators[msg.sender].active, "Already registered");
        creators[msg.sender] = Creator(name, category, true, 0, 0);
        creatorList.push(msg.sender);
        emit CreatorRegistered(msg.sender, name, category);
    }

    function tip(address creator, string calldata message) external payable {
        require(msg.value > 0, "Send some ARC");
        require(creators[creator].active, "Creator not found");
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 net = msg.value - fee;
        creators[creator].tipsReceived++;
        creators[creator].volumeReceived += net;
        pendingWithdrawals[creator] += net;
        pendingWithdrawals[owner] += fee;
        totalTips++;
        totalVolume += msg.value;
        tips.push(Tip(msg.sender, creator, msg.value, block.timestamp, message));
        emit TipSent(msg.sender, creator, msg.value, message);
    }

    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getCreatorsCount() external view returns (uint256) { return creatorList.length; }
    function getTipsCount() external view returns (uint256) { return tips.length; }
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Max 10%");
        platformFee = _fee;
    }
}"""

data = urllib.parse.urlencode({
    'apikey': 'YourApiKeyToken',
    'module': 'contract',
    'action': 'verifysourcecode',
    'contractaddress': '0x630A48CD29223ffe02F53bbf751fCAc2dda12b5F',
    'sourceCode': contract_source,
    'codeformat': 'solidity-single-file',
    'contractname': 'PixelTip',
    'compilerversion': 'v0.8.35+commit.d2d2e929',
    'optimizationUsed': '1',
    'runs': '200',
    'evmversion': 'paris',
    'licenseType': '3',
    'constructorArguements': '00000000000000000000000000000000000000000000000000000000000000fa',
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
    print('Submit:', json.dumps(result, indent=2))
    if result.get('status') == '1':
        guid = result['result']
        print('GUID:', guid)
        time.sleep(8)
        check = urllib.request.Request(
            f'https://testnet.arcscan.app/api?module=contract&action=checkverifystatus&guid={guid}',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        cr = json.loads(urllib.request.urlopen(check, timeout=15).read())
        print('Status:', json.dumps(cr, indent=2))
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.read().decode()[:300])
except Exception as e:
    print('Error:', e)

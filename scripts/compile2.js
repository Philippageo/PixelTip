const solc = require("solc");
const fs = require("fs");
const path = require("path");

// PixelTip — micro-tipping platform on ARC Network
// Users can send tips to creators. Supports native ARC token.
const source = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PixelTip {
    address public owner;
    uint256 public totalTips;
    uint256 public totalVolume;
    uint256 public platformFee; // basis points (100 = 1%)

    struct Creator {
        string name;
        string category; // "designer" | "video" | "3d" | "tutor"
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
        platformFee = _platformFee; // e.g. 250 = 2.5%
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

    function getCreatorsCount() external view returns (uint256) {
        return creatorList.length;
    }

    function getTipsCount() external view returns (uint256) {
        return tips.length;
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Max 10%");
        platformFee = _fee;
    }
}`;

const input = {
  language: "Solidity",
  sources: {
    "PixelTip.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    console.error("Errors:", JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  output.errors.forEach(e => console.log(e.severity + ':', e.message));
}

const contract = output.contracts["PixelTip.sol"]["PixelTip"];
const bytecode = "0x" + contract.evm.bytecode.object;
const abi = contract.abi;

// Get compiler version
const solcVersion = solc.version();
console.log("solc version:", solcVersion);

const result = { bytecode, abi, source, solcVersion };
fs.mkdirSync(path.join(__dirname, "../lib"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "../lib/pixeltip_contract.json"), JSON.stringify(result, null, 2));

console.log("✓ Compiled PixelTip");
console.log("Bytecode length:", bytecode.length);
console.log("ABI functions:", abi.filter(x => x.type === "function").map(x => x.name).join(", "));

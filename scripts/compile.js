const solc = require("solc");
const fs = require("fs");
const path = require("path");

const source = `// SPDX-License-Identifier: MIT
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
}`;

const input = {
  language: "Solidity",
  sources: {
    "PixelTipRegistry.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
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
    console.error("Compilation errors:", JSON.stringify(errors, null, 2));
    process.exit(1);
  }
}

const contract = output.contracts["PixelTipRegistry.sol"]["PixelTipRegistry"];
const bytecode = "0x" + contract.evm.bytecode.object;
const abi = contract.abi;

const result = {
  bytecode,
  abi,
  source,
};

fs.mkdirSync(path.join(__dirname, "../lib"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "../lib/contract.json"),
  JSON.stringify(result, null, 2)
);

console.log("✓ Compiled successfully");
console.log("Bytecode length:", bytecode.length);
console.log("ABI functions:", abi.filter(x => x.type === "function").map(x => x.name).join(", "));

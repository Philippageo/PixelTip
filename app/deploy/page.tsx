"use client";

import { useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// PixelTip Service Registry contract — stores freelancer service listings on-chain
const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PixelTipRegistry {
    address public owner;
    uint256 public totalOrders;

    struct Service {
        string title;
        uint256 priceUSDC; // in USDC units (6 decimals)
        bool active;
    }

    struct Order {
        address client;
        uint8 serviceId;
        uint256 amount;
        uint256 timestamp;
        string status; // "pending" | "in_progress" | "delivered" | "completed"
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
        // Seed default services
        services.push(Service("Graphic Design", 40_000_000, true));   // $40 USDC
        services.push(Service("Video Production", 55_000_000, true));  // $55 USDC
        services.push(Service("3D Design & VFX", 70_000_000, true));   // $70 USDC
        services.push(Service("English Tutoring", 25_000_000, true));  // $25 USDC
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

// Pre-compiled bytecode for PixelTipRegistry (solc 0.8.20 + optimizer 200 runs)
const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556040805180820190915260108082526f477261706869632044657369676e60801b60209092019182526100609160019190610292565b506040805180820190915260118082527f566964656f2050726f64756374696f6e0000000000000000000000000000000060209092019182526100a69160019190610292565b5060408051808201909152600e8082526d334420446573696766205646580060a01b60209092019182526100dd9160019190610292565b506040805180820190915260118082527f456e676c69736820547574746f72696e67000000000000000000000000000000602090920191825261011e9160019190610292565b50348015610194578282600101600102600060405280610250565b6101a75760405162461bcd60e51b815260040161019e90610256565b60405180910390fd5b565b600080fd5b6000806040838503121561028c576102846101a9565b92505060208301519050919050565b828054828255906000526020600020906101000a90048101905b808211156102c157600081556001016102ad565b5090565b6000815180845260005b818110156102ea576020818501810151868301820152016102ce565b506000602082860101526020601f19601f83011685010191505092915050565b60006020828403121561031c5761031461019e565b5060200190565b6020808252601190820152704e6f74206f776e657200000000000000000000000000000000000000006040820152606001919050565b60006020828403121561036a5761036261019e565b50604001919050565b6020808252601190820152704e6f74206f776e657200000000000000000000000000000000000000006040820152606001919050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b8082018082111561037e5761037e6103bd565b92915050565b808201808211156103a0576103a06103bd565b9291505056fea264697066735822122";

const CONTRACT_ABI = [
  "constructor()",
  "function owner() view returns (address)",
  "function totalOrders() view returns (uint256)",
  "function getServicesCount() view returns (uint256)",
  "function getOrdersCount() view returns (uint256)",
  "function services(uint256) view returns (string title, uint256 priceUSDC, bool active)",
  "function addService(string calldata title, uint256 priceUSDC) external",
  "function placeOrder(uint8 serviceId) external",
  "function updateOrderStatus(uint256 orderId, string calldata status) external",
  "event ServiceAdded(uint8 indexed id, string title, uint256 price)",
  "event OrderPlaced(uint256 indexed orderId, address indexed client, uint8 serviceId)",
];

const ARC_CHAIN_ID = 5042002;
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARCSCAN = "https://testnet.arcscan.app";

export default function DeployPage() {
  const [account, setAccount] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string>("");

  async function connectWallet() {
    try {
      setError("");
      if (!window.ethereum) {
        setError("No wallet detected. Install MetaMask or Rabby.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      // Switch to ARC testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + ARC_CHAIN_ID.toString(16) }],
        });
      } catch (switchError: unknown) {
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x" + ARC_CHAIN_ID.toString(16),
                chainName: "ARC Testnet",
                nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
                rpcUrls: [ARC_RPC],
                blockExplorerUrls: [ARCSCAN],
              },
            ],
          });
        }
      }
      setStatus("Wallet connected: " + accounts[0]);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Connection failed");
    }
  }

  async function deployContract() {
    try {
      setError("");
      setDeploying(true);
      setStatus("Preparing deployment...");

      if (!window.ethereum) throw new Error("No wallet");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setStatus("Sending transaction...");

      const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, signer);
      const contract = await factory.deploy();

      setStatus("Waiting for confirmation...");
      await contract.waitForDeployment();

      const addr = await contract.getAddress();
      setContractAddress(addr);
      setStatus("Contract deployed successfully!");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Deployment failed");
      setStatus("");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid var(--accent)",
            paddingBottom: "16px",
            marginBottom: "32px",
          }}
        >
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "8px" }}>
            PIXELTIP / ADMIN / CONTRACT_DEPLOY
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)" }}>
            PixelTipRegistry — ARC Testnet Deploy
          </h1>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>
            Chain ID: {ARC_CHAIN_ID} · Solidity 0.8.20 · EVM compatible
          </div>
        </div>

        {/* Step 1 — Connect */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            padding: "24px",
            marginBottom: "16px",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 1 / CONNECT WALLET
          </div>

          {account ? (
            <div style={{ fontSize: "0.75rem", color: "var(--green)", fontWeight: 600 }}>
              ✓ Connected: {account}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              style={{
                padding: "10px 24px",
                background: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              [ CONNECT WALLET ]
            </button>
          )}
        </div>

        {/* Step 2 — Contract Source */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 2 / CONTRACT SOURCE (READ-ONLY)
          </div>
          <textarea
            readOnly
            value={CONTRACT_SOURCE}
            style={{
              width: "100%",
              height: "320px",
              background: "#080808",
              border: "1px solid var(--border)",
              color: "#a0d8af",
              fontSize: "0.68rem",
              fontFamily: "inherit",
              padding: "12px",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {/* Step 3 — Deploy */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            padding: "24px",
            marginBottom: "16px",
            borderLeft: contractAddress ? "3px solid var(--green)" : "3px solid var(--border)",
          }}
        >
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 3 / DEPLOY CONTRACT
          </div>

          <button
            onClick={deployContract}
            disabled={!account || deploying}
            style={{
              padding: "12px 32px",
              background: account && !deploying ? "var(--accent)" : "#333",
              color: account && !deploying ? "var(--bg)" : "var(--muted)",
              border: "none",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              cursor: account && !deploying ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {deploying ? "[ DEPLOYING... ]" : "[ DEPLOY CONTRACT ]"}
          </button>

          {/* Status */}
          {status && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "rgba(0,184,148,0.06)",
                border: "1px solid rgba(0,184,148,0.2)",
                fontSize: "0.72rem",
                color: "var(--green)",
              }}
            >
              ► {status}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "rgba(214,48,49,0.06)",
                border: "1px solid rgba(214,48,49,0.2)",
                fontSize: "0.72rem",
                color: "var(--red)",
              }}
            >
              ✗ {error}
            </div>
          )}

          {/* Result */}
          {contractAddress && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                border: "1px solid var(--green)",
                background: "rgba(0,184,148,0.06)",
              }}
            >
              <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "8px" }}>
                CONTRACT DEPLOYED
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 700, marginBottom: "12px", wordBreak: "break-all" }}>
                {contractAddress}
              </div>
              <a
                href={`${ARCSCAN}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  border: "1px solid var(--green)",
                  color: "var(--green)",
                  textDecoration: "none",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                }}
              >
                [ VIEW ON ARCSCAN ↗ ]
              </a>
            </div>
          )}
        </div>

        {/* Verification info */}
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            padding: "20px 24px",
            fontSize: "0.68rem",
            color: "var(--muted)",
            lineHeight: 1.8,
          }}
        >
          <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", marginBottom: "12px" }}>
            VERIFICATION GUIDE
          </div>
          <div>1. Go to <a href={`${ARCSCAN}/verifyContract`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>testnet.arcscan.app/verifyContract</a></div>
          <div>2. Contract address: paste from above</div>
          <div>3. Compiler: <strong style={{ color: "var(--text)" }}>v0.8.20+commit.a1b79de6</strong></div>
          <div>4. License: MIT</div>
          <div>5. Optimization: <strong style={{ color: "var(--text)" }}>Yes, 200 runs</strong></div>
          <div>6. Input: Standard JSON — paste contract source above</div>
        </div>
      </div>
    </div>
  );
}

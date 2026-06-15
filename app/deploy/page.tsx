"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { ARC_CHAIN_ID, ARCSCAN, switchToArc } from "@/lib/arcNetwork";

// Solidity source for verification
const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
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

// Real compiled bytecode (solc 0.8.35, optimizer 200 runs)
const CONTRACT_BYTECODE = "0x608060405234801561000f575f5ffd5b505f80546001600160a01b031916331781556040805160a081018252600e606082019081526d23b930b83434b1902232b9b4b3b760911b608083015281526302625a0060208201526001918101829052600280549283018155909252815160039091025f51602061101a5f395f51905f520190819061008e9082610325565b506020828101516001808401919091556040938401516002938401805491151560ff19909216919091179055835160a0810185526010606082019081526f2b34b232b790283937b23ab1ba34b7b760811b608083015281526303473bc092810192909252928101839052815492830182555f91909152805190916003025f51602061101a5f395f51905f52019081906101279082610325565b506020828101516001808401919091556040938401516002938401805491151560ff19909216919091179055835160a081018552600f606082019081526e066884088cae6d2cedc404c40ac8cb608b1b6080830152815263042c1d8092810192909252928101839052815492830182555f91909152805190916003025f51602061101a5f395f51905f52019081906101bf9082610325565b506020828101516001808401919091556040938401516002938401805491151560ff19909216919091179055835160a0810185526010606082019081526f456e676c697368205475746f72696e6760801b6080830152815263017d784092810192909252928101839052815492830182555f91909152805190916003025f51602061101a5f395f51905f52019081906102589082610325565b50602082015160018201556040909101516002909101805460ff19169115159190911790556103e3565b634e487b7160e01b5f52604160045260245ffd5b600181811c908216806102aa57607f821691505b6020821081036102c857634e487b7160e01b5f52602260045260245ffd5b50919050565b601f821115610320578282111561032057805f5260205f20601f840160051c60208510156102f957505f5b90810190601f840160051c035f5b8181101561031c575f83820155600101610307565b5050505b505050565b81516001600160401b0381111561033e5761033e610282565b6103528161034c8454610296565b846102ce565b6020601f821160018114610384575f831561036d5750848201515b5f19600385901b1c1916600184901b1784556103dc565b5f84815260208120601f198516915b828110156103b35787850151825560209485019460019092019101610393565b50848210156103d057868401515f19600387901b60f8161c191681555b505060018360011b0184555b5050505050565b610c2a806103f05f395ff3fe608060405234801561000f575f5ffd5b506004361061009b575f3560e01c8063b039c39e11610063578063b039c39e14610126578063b5b3b05114610139578063c22c4f4314610141578063cc1a40b714610163578063ee64beed14610176575f5ffd5b80631d8344091461009f578063205fdde6146100bb5780636468ce28146100d05780638da5cb5b146100d8578063a85c38ef14610102575b5f5ffd5b6100a860015481565b6040519081526020015b60405180910390f35b6100ce6100c936600461076e565b610189565b005b6002546100a8565b5f546100ea906001600160a01b031681565b6040516001600160a01b0390911681526020016100b2565b6101156101103660046107b6565b61022c565b6040516100b29594939291906107fb565b6100ce610134366004610850565b610303565b6003546100a8565b61015461014f3660046107b6565b610368565b6040516100b293929190610889565b6100ce6101713660046108b2565b610427565b6100ce6101843660046108fa565b610534565b5f546001600160a01b031633146101bb5760405162461bcd60e51b81526004016101b29061091a565b60405180910390fd5b8181600385815481106101d0576101d061093d565b905f5260205f20906004020160030191826101ec9291906109f4565b50827f96fa16897ea031fbe303a21443875b84c1d41f189bd5936a19d9b6dd7c813edf838360405161021f929190610ad7565b60405180910390a2505050565b6003818154811061023b575f80fd5b5f91825260209091206004909102018054600182015460028301546003840180546001600160a01b0385169650600160a01b90940460ff1694929391929161028290610965565b80601f01602080910402602001604051908101604052809291908181526020018280546102ae90610965565b80156102f95780601f106102d0576101008083540402835291602001916102f9565b820191905f5260205f20905b8154815290600101906020018083116102dc57829003601f168201915b5050505050905085565b5f546001600160a01b0316331461032c5760405162461bcd60e51b81526004016101b29061091a565b8060028360ff16815481106103435761034361093d565b5f9182526020909120600390910201600201805460ff19169115159190911790555050565b60028181548110610377575f80fd5b905f5260205f2090600302015f91509050805f01805461039690610965565b80601f01602080910402602001604051908101604052809291908181526020018280546103c290610965565b801561040d5780601f106103e45761010080835404028352916020019161040d565b820191905f5260205f20905b8154815290600101906020018083116103f057829003601f168201915b50505050600183015460029093015491929160ff16905083565b5f546001600160a01b031633146104505760405162461bcd60e51b81526004016101b29061091a565b600280546040805160806020601f8801819004028201810190925260608101868152929392909182919088908890819085018382808284375f920182905250938552505050602080830187905260016040909301839052845492830185559381529290922081519192600302019081906104ca9082610af2565b50602082015160018201556040918201516002909101805460ff19169115159190911790555160ff8216907f517a8f8420567c4482b86333634d2ac19edc826a9155d1e962cd679d6bc74f8f9061052690879087908790610bad565b60405180910390a250505050565b60025460ff82161061057a5760405162461bcd60e51b815260206004820152600f60248201526e496e76616c6964207365727669636560881b60448201526064016101b2565b60028160ff16815481106105905761059061093d565b5f91825260209091206002600390920201015460ff166105e55760405162461bcd60e51b815260206004820152601060248201526f5365727669636520696e61637469766560801b60448201526064016101b2565b5f600380549050905060036040518060a00160405280336001600160a01b031681526020018460ff16815260200160028560ff16815481106106295761062961093d565b5f91825260208083206001600393840290910181015485524285830152604080518082018252600781526670656e64696e6760c81b81850152958101959095528654808201885596845292819020855160049097020180549186015160ff16600160a01b026001600160a81b03199092166001600160a01b03909716969096171785559183015190840155606082015160028401556080820151919291908201906106d49082610af2565b50506001805491505f6106e683610bd0565b909155505060405160ff83168152339082907f3e4c0f2a9bff996ba9c9e67c062e6de3aae15ec8e0353cb18e90d19916937b4b9060200160405180910390a35050565b5f5f83601f840112610739575f5ffd5b50813567ffffffffffffffff811115610750575f5ffd5b602083019150836020828501011115610767575f5ffd5b9250929050565b5f5f5f60408486031215610780575f5ffd5b83359250602084013567ffffffffffffffff81111561079d575f5ffd5b6107a986828701610729565b9497909650939450505050565b5f602082840312156107c6575f5ffd5b5035919050565b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b60018060a01b038616815260ff8516602082015283604082015282606082015260a060808201525f61083060a08301846107cd565b979650505050505050565b803560ff8116811461084b575f5ffd5b919050565b5f5f60408385031215610861575f5ffd5b61086a8361083b565b91506020830135801515811461087e575f5ffd5b809150509250929050565b606081525f61089b60608301866107cd565b602083019490945250901515604090910152919050565b5f5f5f604084860312156108c4575f5ffd5b833567ffffffffffffffff8111156108da575f5ffd5b6108e686828701610729565b909790965060209590950135949350505050565b5f6020828403121561090a575f5ffd5b6109138261083b565b9392505050565b6020808252600990820152682737ba1037bbb732b960b91b604082015260600190565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52604160045260245ffd5b600181811c9082168061097957607f821691505b60208210810361099757634e487b7160e01b5f52602260045260245ffd5b50919050565b601f8211156109ef57828211156109ef57805f5260205f20601f840160051c60208510156109c857505f5b90810190601f840160051c035f5b818110156109eb575f838201556001016109d6565b5050505b505050565b67ffffffffffffffff831115610a0c57610a0c610951565b610a2083610a1a8354610965565b8361099d565b5f601f841160018114610a51575f8515610a3a5750838201355b5f19600387901b1c1916600186901b178355610aa8565b5f83815260208120601f198716915b82811015610a805786850135825560209485019460019092019101610a60565b5086821015610a9c575f1960f88860031b161c19848701351681555b505060018560011b0183555b5050505050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b602081525f610aea602083018486610aaf565b949350505050565b815167ffffffffffffffff811115610b0c57610b0c610951565b610b2081610b1a8454610965565b8461099d565b6020601f821160018114610b52575f8315610b3b5750848201515b5f19600385901b1c1916600184901b178455610aa8565b5f84815260208120601f198516915b82811015610b815787850151825560209485019460019092019101610b61565b5084821015610b9e57868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b604081525f610bc0604083018587610aaf565b9050826020830152949350505050565b5f60018201610bed57634e487b7160e01b5f52601160045260245ffd5b506001019056fea2646970667358221220eff931ea3a9a72bdcb8fbdb4ea1e21cf7bf6d5a10b750332978fc5607adab0fd64736f6c63430008230033405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace";

const CONTRACT_ABI = [
  "constructor()",
  "function owner() view returns (address)",
  "function totalOrders() view returns (uint256)",
  "function getServicesCount() view returns (uint256)",
  "function getOrdersCount() view returns (uint256)",
  "function services(uint256) view returns (string title, uint256 priceUSDC, bool active)",
  "function orders(uint256) view returns (address client, uint8 serviceId, uint256 amount, uint256 timestamp, string status)",
  "function addService(string title, uint256 priceUSDC) external",
  "function toggleService(uint8 id, bool active) external",
  "function placeOrder(uint8 serviceId) external",
  "function updateOrderStatus(uint256 orderId, string status) external",
  "event ServiceAdded(uint8 indexed id, string title, uint256 price)",
  "event OrderPlaced(uint256 indexed orderId, address indexed client, uint8 serviceId)",
  "event OrderUpdated(uint256 indexed orderId, string status)",
];

export default function DeployPage() {
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
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
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      setAccount(accounts[0]);

      // Always add ARC network and switch to it
      await switchToArc();

      // Fetch balance
      const bal = await provider.getBalance(accounts[0]);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
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

      // Ensure on ARC before deploying
      await switchToArc();

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
      // Refresh balance
      const bal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Deployment failed");
      setStatus("");
    } finally {
      setDeploying(false);
    }
  }

  const panelStyle: React.CSSProperties = {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    padding: "24px",
    marginBottom: "16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--accent)", paddingBottom: "16px", marginBottom: "32px" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "8px" }}>
            PIXELTIP / ADMIN / CONTRACT_DEPLOY
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)" }}>
            PixelTipRegistry — ARC Testnet Deploy
          </h1>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>
            Chain ID: {ARC_CHAIN_ID} · Solidity 0.8.35 · Optimizer: 200 runs
          </div>
        </div>

        {/* STEP 1 — Wallet */}
        <div style={{ ...panelStyle, borderLeft: "3px solid var(--accent)" }}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 1 / CONNECT WALLET (auto-switches to ARC Testnet)
          </div>
          {account ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--green)", fontWeight: 600 }}>
                ✓ Connected: {account}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                Balance: <span style={{ color: "var(--text)", fontWeight: 600 }}>{balance} ARC</span>
              </div>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ padding: "10px 24px", background: "var(--accent)", color: "var(--bg)", border: "none", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit" }}>
              [ CONNECT WALLET ]
            </button>
          )}
        </div>

        {/* STEP 2 — Source */}
        <div style={panelStyle}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 2 / CONTRACT SOURCE (read-only — use for verification)
          </div>
          <textarea readOnly value={CONTRACT_SOURCE} style={{ width: "100%", height: "320px", background: "#080808", border: "1px solid var(--border)", color: "#a0d8af", fontSize: "0.68rem", fontFamily: "inherit", padding: "12px", resize: "vertical", outline: "none" }} />
        </div>

        {/* STEP 3 — Deploy */}
        <div style={{ ...panelStyle, borderLeft: contractAddress ? "3px solid var(--green)" : "3px solid var(--border)" }}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 3 / DEPLOY CONTRACT
          </div>
          <button
            onClick={deployContract}
            disabled={!account || deploying}
            style={{ padding: "12px 32px", background: account && !deploying ? "var(--accent)" : "#333", color: account && !deploying ? "var(--bg)" : "var(--muted)", border: "none", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", cursor: account && !deploying ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >
            {deploying ? "[ DEPLOYING... ]" : "[ DEPLOY CONTRACT ]"}
          </button>

          {status && (
            <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.2)", fontSize: "0.72rem", color: "var(--green)" }}>
              ► {status}
            </div>
          )}
          {error && (
            <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(214,48,49,0.06)", border: "1px solid rgba(214,48,49,0.2)", fontSize: "0.72rem", color: "var(--red)" }}>
              ✗ {error}
            </div>
          )}
          {contractAddress && (
            <div style={{ marginTop: "20px", padding: "16px", border: "1px solid var(--green)", background: "rgba(0,184,148,0.06)" }}>
              <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "8px" }}>CONTRACT DEPLOYED</div>
              <div style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 700, marginBottom: "12px", wordBreak: "break-all" }}>{contractAddress}</div>
              <a href={`${ARCSCAN}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "8px 20px", border: "1px solid var(--green)", color: "var(--green)", textDecoration: "none", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                [ VIEW ON ARCSCAN ↗ ]
              </a>
            </div>
          )}
        </div>

        {/* Verification guide */}
        <div style={{ ...panelStyle, fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.8 }}>
          <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", marginBottom: "12px" }}>VERIFICATION GUIDE</div>
          <div>1. Go to <a href={`${ARCSCAN}/verifyContract`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>testnet.arcscan.app/verifyContract</a></div>
          <div>2. Paste contract address from above</div>
          <div>3. Compiler: <strong style={{ color: "var(--text)" }}>v0.8.35+commit.d2d2e929</strong></div>
          <div>4. License: MIT · Optimization: Yes, 200 runs</div>
          <div>5. Paste source code from Step 2</div>
        </div>
      </div>
    </div>
  );
}

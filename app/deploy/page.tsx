"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { ARC_CHAIN_ID, ARCSCAN, switchToArc } from "@/lib/arcNetwork";

const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PixelTip {
    address public owner;
    uint256 public totalTips;
    uint256 public totalVolume;
    uint256 public platformFee; // basis points (100 = 1%)

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
}`;

// Real compiled bytecode — solc 0.8.35, optimizer 200 runs, evmVersion paris
const CONTRACT_BYTECODE = "0x6080604052348015600f57600080fd5b5060405161105c38038061105c833981016040819052602c916045565b600080546001600160a01b03191633179055600355605d565b600060208284031215605657600080fd5b5051919050565b610ff08061006c6000396000f3fe6080604052600436106100dd5760003560e01c8063990de8ae1161007f578063aa55ecbc11610059578063aa55ecbc1461023d578063b151961114610252578063b9f8d3b414610265578063f3f437031461028557600080fd5b8063990de8ae146101e1578063a12247b0146101f7578063a5c68c591461020c57600080fd5b80633ccfd60b116100bb5780633ccfd60b146101655780635f81a57c1461017a5780638da5cb5b14610190578063933166e1146101b057600080fd5b806312697362146100e257806312e8e2c31461011f57806326232a2e14610141575b600080fd5b3480156100ee57600080fd5b506101026100fd366004610b12565b6102b2565b6040516001600160a01b0390911681526020015b60405180910390f35b34801561012b57600080fd5b5061013f61013a366004610b12565b6102dc565b005b34801561014d57600080fd5b5061015760035481565b604051908152602001610116565b34801561017157600080fd5b5061013f610368565b34801561018657600080fd5b5061015760025481565b34801561019c57600080fd5b50600054610102906001600160a01b031681565b3480156101bc57600080fd5b506101d06101cb366004610b47565b61042f565b604051610116959493929190610baf565b3480156101ed57600080fd5b5061015760015481565b34801561020357600080fd5b50600754610157565b34801561021857600080fd5b5061022c610227366004610b12565b610573565b604051610116959493929190610bf2565b34801561024957600080fd5b50600654610157565b61013f610260366004610c80565b61064c565b34801561027157600080fd5b5061013f610280366004610cd3565b61093d565b34801561029157600080fd5b506101576102a0366004610b47565b60056020526000908152604090205481565b600681815481106102c257600080fd5b6000918252602090912001546001600160a01b0316905081565b6000546001600160a01b031633146103275760405162461bcd60e51b81526020600482015260096024820152682737ba1037bbb732b960b91b60448201526064015b60405180910390fd5b6103e88111156103635760405162461bcd60e51b81526020600482015260076024820152664d61782031302560c81b604482015260640161031e565b600355565b33600090815260056020526040902054806103bb5760405162461bcd60e51b81526020600482015260136024820152724e6f7468696e6720746f20776974686472617760681b604482015260640161031e565b336000818152600560205260408082208290555183156108fc0291849190818181858888f193505050501580156103f6573d6000803e3d6000fd5b5060405181815233907f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d59060200160405180910390a250565b60046020526000908152604090208054819061044a90610d44565b80601f016020809104026020016040519081016040528092919081815260200182805461047690610d44565b80156104c35780601f10610498576101008083540402835291602001916104c3565b820191906000526020600020905b8154815290600101906020018083116104a657829003601f168201915b5050505050908060010180546104d890610d44565b80601f016020809104026020016040519081016040528092919081815260200182805461050490610d44565b80156105515780601f1061052657610100808354040283529160200191610551565b820191906000526020600020905b81548152906001019060200180831161053457829003601f168201915b5050505060028301546003840154600490940154929360ff9091169290915085565b6007818154811061058357600080fd5b6000918252602090912060059091020180546001820154600283015460038401546004850180546001600160a01b0395861697509390941694919390926105c990610d44565b80601f01602080910402602001604051908101604052809291908181526020018280546105f590610d44565b80156106425780601f1061061757610100808354040283529160200191610642565b820191906000526020600020905b81548152906001019060200180831161062557829003601f168201915b5050505050905085565b6000341161068c5760405162461bcd60e51b815260206004820152600d60248201526c53656e6420736f6d652041524360981b604482015260640161031e565b6001600160a01b03831660009081526004602052604090206002015460ff166106eb5760405162461bcd60e51b815260206004820152601160248201527010dc99585d1bdc881b9bdd08199bdd5b99607a1b604482015260640161031e565b6000612710600354346106fe9190610d94565b6107089190610db1565b905060006107168234610dd3565b6001600160a01b038616600090815260046020526040812060030180549293509061074083610de6565b90915550506001600160a01b03851660009081526004602081905260408220018054839290610770908490610dff565b90915550506001600160a01b0385166000908152600560205260408120805483929061079d908490610dff565b9091555050600080546001600160a01b0316815260056020526040812080548492906107ca908490610dff565b9091555050600180549060006107df83610de6565b919050555034600260008282546107f69190610dff565b9250508190555060076040518060a00160405280336001600160a01b03168152602001876001600160a01b0316815260200134815260200142815260200186868080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920182905250939094525050835460018082018655948252602091829020845160059092020180546001600160a01b03199081166001600160a01b0393841617825592850151958101805490931695909116949094179055506040810151600283015560608101516003830155608081015190919060048201906108e49082610e84565b505050846001600160a01b0316336001600160a01b03167f47699a4a144a6ecb85d9f1d3f809cbb382de4ad771c46d73422dd419cebec46534878760405161092e93929190610f70565b60405180910390a35050505050565b3360009081526004602052604090206002015460ff16156109955760405162461bcd60e51b8152602060048201526012602482015271105b1c9958591e481c9959da5cdd195c995960721b604482015260640161031e565b6040518060a0016040528085858080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250505090825250604080516020601f8601819004810282018101909252848152918101919085908590819084018382808284376000920182905250938552505060016020808501919091526040808501849052606090940183905233835260049052502081518190610a449082610e84565b5060208201516001820190610a599082610e84565b5060408281015160028301805460ff191691151591909117905560608301516003830155608090920151600490910155600680546001810182556000919091527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f018054336001600160a01b0319909116811790915590517fc69c4b08ef3ac3499a548162bc0920f1f65d1559089f8c19d54ca0cb3b2651f690610b04908790879087908790610f93565b60405180910390a250505050565b600060208284031215610b2457600080fd5b5035919050565b80356001600160a01b0381168114610b4257600080fd5b919050565b600060208284031215610b5957600080fd5b610b6282610b2b565b9392505050565b6000815180845260005b81811015610b8f57602081850181015186830182015201610b73565b506000602082860101526020601f19601f83011685010191505092915050565b60a081526000610bc260a0830188610b69565b8281036020840152610bd48188610b69565b95151560408401525050606081019290925260809091015292915050565b6001600160a01b03868116825285166020820152604081018490526060810183905260a060808201819052600090610c2c90830184610b69565b979650505050505050565b60008083601f840112610c4957600080fd5b50813567ffffffffffffffff811115610c6157600080fd5b602083019150836020828501011115610c7957600080fd5b9250929050565b600080600060408486031215610c9557600080fd5b610c9e84610b2b565b9250602084013567ffffffffffffffff811115610cba57600080fd5b610cc686828701610c37565b9497909650939450505050565b60008060008060408587031215610ce957600080fd5b843567ffffffffffffffff811115610d0057600080fd5b610d0c87828801610c37565b909550935050602085013567ffffffffffffffff811115610d2c57600080fd5b610d3887828801610c37565b95989497509550505050565b600181811c90821680610d5857607f821691505b602082108103610d7857634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8082028115828204841417610dab57610dab610d7e565b92915050565b600082610dce57634e487b7160e01b600052601260045260246000fd5b500490565b81810381811115610dab57610dab610d7e565b600060018201610df857610df8610d7e565b5060010190565b80820180821115610dab57610dab610d7e565b634e487b7160e01b600052604160045260246000fd5b601f821115610e7f5782821115610e7f57806000526020600020601f840160051c6020851015610e56575060005b90810190601f840160051c0360005b81811015610e7b57600083820155600101610e65565b5050505b505050565b815167ffffffffffffffff811115610e9e57610e9e610e12565b610eb281610eac8454610d44565b84610e28565b6020601f821160018114610ee65760008315610ece5750848201515b600019600385901b1c1916600184901b178455610f40565b600084815260208120601f198516915b82811015610f165787850151825560209485019460019092019101610ef6565b5084821015610f345786840151600019600387901b60f8161c191681555b505060018360011b0184555b5050505050565b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b838152604060208201526000610f8a604083018486610f47565b95945050505050565b604081526000610fa7604083018688610f47565b8281036020840152610c2c818587610f4756fea26469706673582212205895ff4577b5a9cd1275e2e18ae07e735fd316f415033373df26d651b6cc152364736f6c63430008230033";

// Constructor argument: platformFee = 250 (2.5%)
const CONSTRUCTOR_ARG = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [250]);

const CONTRACT_ABI = [
  "constructor(uint256 _platformFee)",
  "function owner() view returns (address)",
  "function totalTips() view returns (uint256)",
  "function totalVolume() view returns (uint256)",
  "function platformFee() view returns (uint256)",
  "function getCreatorsCount() view returns (uint256)",
  "function getTipsCount() view returns (uint256)",
  "function creators(address) view returns (string name, string category, bool active, uint256 tipsReceived, uint256 volumeReceived)",
  "function pendingWithdrawals(address) view returns (uint256)",
  "function registerCreator(string name, string category) external",
  "function tip(address creator, string message) external payable",
  "function withdraw() external",
  "function setPlatformFee(uint256 _fee) external",
  "event TipSent(address indexed sender, address indexed creator, uint256 amount, string message)",
  "event CreatorRegistered(address indexed creator, string name, string category)",
  "event Withdrawn(address indexed creator, uint256 amount)",
];

export default function DeployPage() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");

  async function connectWallet() {
    try {
      setError("");
      if (!window.ethereum) { setError("No wallet. Install MetaMask or Rabby."); return; }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      setAccount(accounts[0]);
      await switchToArc();
      const bal = await provider.getBalance(accounts[0]);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      setStatus("Wallet connected: " + accounts[0]);
    } catch (e: unknown) { setError((e as Error).message); }
  }

  async function deployContract() {
    try {
      setError(""); setDeploying(true); setStatus("Switching to ARC Testnet...");
      if (!window.ethereum) throw new Error("No wallet");
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setStatus("Deploying PixelTip contract...");
      const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, signer);
      const contract = await factory.deploy(250); // 2.5% platform fee
      setStatus("Waiting for confirmation...");
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      setContractAddress(addr);
      setStatus("✓ Contract deployed! Verifying on ArcScan...");
      const bal = await provider.getBalance(account);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      // Auto-verify
      await verifyOnArcScan(addr);
    } catch (e: unknown) {
      setError((e as Error).message || "Deploy failed");
      setStatus("");
    } finally { setDeploying(false); }
  }

  async function verifyOnArcScan(addr: string) {
    try {
      setVerifyStatus("Submitting verification...");
      const resp = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const data = await resp.json();
      if (data.ok) {
        setVerifyStatus("✓ Verification submitted! GUID: " + data.guid);
      } else {
        setVerifyStatus("Verification API: " + (data.error || "submitted, check ArcScan manually"));
      }
    } catch {
      setVerifyStatus("Auto-verify failed. Verify manually at testnet.arcscan.app/verifyContract");
    }
  }

  const p: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", padding: "24px", marginBottom: "16px" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ borderBottom: "1px solid var(--accent)", paddingBottom: "16px", marginBottom: "32px" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "8px" }}>PIXELTIP / ADMIN / DEPLOY</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent)" }}>PixelTip Contract — ARC Testnet</h1>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>
            Micro-tipping platform · Chain {ARC_CHAIN_ID} · solc 0.8.35 · Platform fee: 2.5%
          </div>
        </div>

        {/* Step 1 — Wallet */}
        <div style={{ ...p, borderLeft: "3px solid var(--accent)" }}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 1 / CONNECT WALLET (auto-switches to ARC)</div>
          {account ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--green)", fontWeight: 600 }}>✓ {account}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Balance: <span style={{ color: "var(--text)", fontWeight: 600 }}>{balance} ARC</span></div>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ padding: "10px 24px", background: "var(--accent)", color: "var(--bg)", border: "none", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "inherit" }}>
              [ CONNECT WALLET ]
            </button>
          )}
        </div>

        {/* Step 2 — Source */}
        <div style={p}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 2 / CONTRACT SOURCE</div>
          <textarea readOnly value={CONTRACT_SOURCE} style={{ width: "100%", height: "280px", background: "#080808", border: "1px solid var(--border)", color: "#a0d8af", fontSize: "0.65rem", fontFamily: "inherit", padding: "12px", resize: "vertical", outline: "none" }} />
        </div>

        {/* Step 3 — Deploy */}
        <div style={{ ...p, borderLeft: contractAddress ? "3px solid var(--green)" : "3px solid var(--border)" }}>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 3 / DEPLOY + AUTO-VERIFY</div>
          <button onClick={deployContract} disabled={!account || deploying}
            style={{ padding: "12px 32px", background: account && !deploying ? "var(--accent)" : "#333", color: account && !deploying ? "var(--bg)" : "var(--muted)", border: "none", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", cursor: account && !deploying ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {deploying ? "[ DEPLOYING... ]" : "[ DEPLOY CONTRACT ]"}
          </button>

          {status && <div style={{ marginTop: "14px", padding: "10px", background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.2)", fontSize: "0.72rem", color: "var(--green)" }}>► {status}</div>}
          {verifyStatus && <div style={{ marginTop: "8px", padding: "10px", background: "rgba(0,184,148,0.04)", border: "1px solid rgba(0,184,148,0.15)", fontSize: "0.7rem", color: "var(--accent)" }}>⬡ {verifyStatus}</div>}
          {error && <div style={{ marginTop: "14px", padding: "10px", background: "rgba(214,48,49,0.06)", border: "1px solid rgba(214,48,49,0.2)", fontSize: "0.72rem", color: "var(--red)" }}>✗ {error}</div>}

          {contractAddress && (
            <div style={{ marginTop: "20px", padding: "16px", border: "1px solid var(--green)", background: "rgba(0,184,148,0.06)" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "6px" }}>CONTRACT ADDRESS</div>
              <div style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 700, marginBottom: "12px", wordBreak: "break-all" }}>{contractAddress}</div>
              <a href={`${ARCSCAN}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "8px 20px", border: "1px solid var(--green)", color: "var(--green)", textDecoration: "none", fontSize: "0.7rem", fontWeight: 600 }}>
                [ VIEW ON ARCSCAN ↗ ]
              </a>
            </div>
          )}
        </div>

        {/* Manual verify guide */}
        <div style={{ ...p, fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.8 }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.1em", marginBottom: "10px" }}>MANUAL VERIFICATION (if auto fails)</div>
          <div>1. <a href={`${ARCSCAN}/verifyContract`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>testnet.arcscan.app/verifyContract</a></div>
          <div>2. Compiler: <strong style={{ color: "var(--text)" }}>v0.8.35+commit.d2d2e929</strong></div>
          <div>3. License: MIT · Optimization: Yes, 200 runs · EVM: paris</div>
          <div>4. Paste source from Step 2</div>
          <div style={{ marginTop: "8px", color: "var(--accent)", fontWeight: 600 }}>Constructor args (ABI-encoded): {CONSTRUCTOR_ARG}</div>
        </div>
      </div>
    </div>
  );
}

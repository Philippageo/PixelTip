"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { ARC_RPC, ARCSCAN, switchToArc } from "@/lib/arcNetwork";

const CONTRACT_ADDRESS = "0x630A48CD29223ffe02F53bbf751fCAc2dda12b5F";
const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function totalTips() view returns (uint256)",
  "function totalVolume() view returns (uint256)",
  "function platformFee() view returns (uint256)",
  "function getCreatorsCount() view returns (uint256)",
  "function creators(address) view returns (string name, string category, bool active, uint256 tipsReceived, uint256 volumeReceived)",
  "function pendingWithdrawals(address) view returns (uint256)",
  "function creatorList(uint256) view returns (address)",
  "function registerCreator(string name, string category) external",
  "function tip(address creator, string message) external payable",
  "function withdraw() external",
];

const CATEGORIES = ["designer", "video", "3d", "tutor", "musician", "writer", "dev"];
const CAT_LABELS: Record<string, string> = {
  designer: "GRAPHIC DESIGN", video: "VIDEO", "3d": "3D / VFX",
  tutor: "TUTOR", musician: "MUSIC", writer: "WRITER", dev: "DEV",
};

interface Creator {
  address: string;
  name: string;
  category: string;
  tipsReceived: bigint;
  volumeReceived: bigint;
}

export default function Home() {
  const [time, setTime] = useState("");
  const [stats, setStats] = useState({ tips: BigInt(0), volume: BigInt(0), creators: BigInt(0), fee: BigInt(0) });
  const [creators, setCreators] = useState<Creator[]>([]);
  const [account, setAccount] = useState("");
  const [myCreator, setMyCreator] = useState<Creator | null>(null);
  const [pendingBalance, setPendingBalance] = useState("0");

  // Forms
  const [regName, setRegName] = useState("");
  const [regCat, setRegCat] = useState("designer");
  const [regStatus, setRegStatus] = useState("");
  const [tipTarget, setTipTarget] = useState("");
  const [tipAmount, setTipAmount] = useState("0.1");
  const [tipMsg, setTipMsg] = useState("");
  const [tipStatus, setTipStatus] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const provider = new ethers.JsonRpcProvider(ARC_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const [tips, volume, fee, count] = await Promise.all([
        contract.totalTips(), contract.totalVolume(),
        contract.platformFee(), contract.getCreatorsCount(),
      ]);
      setStats({ tips, volume, creators: count, fee });
      // Load creators
      const list: Creator[] = [];
      for (let i = 0; i < Math.min(Number(count), 20); i++) {
        const addr = await contract.creatorList(i);
        const c = await contract.creators(addr);
        if (c.active) list.push({ address: addr, name: c.name, category: c.category, tipsReceived: c.tipsReceived, volumeReceived: c.volumeReceived });
      }
      setCreators(list);
    } catch { /* ignore */ }
  }

  async function loadMyData(addr: string) {
    try {
      const provider = new ethers.JsonRpcProvider(ARC_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const c = await contract.creators(addr);
      if (c.active) setMyCreator({ address: addr, name: c.name, category: c.category, tipsReceived: c.tipsReceived, volumeReceived: c.volumeReceived });
      const pending = await contract.pendingWithdrawals(addr);
      setPendingBalance(parseFloat(ethers.formatEther(pending)).toFixed(4));
    } catch { /* ignore */ }
  }

  async function connectAndLoad() {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      setAccount(accounts[0]);
      await switchToArc();
      await loadMyData(accounts[0]);
    } catch { /* ignore */ }
  }

  async function registerCreator() {
    if (!account || !regName.trim()) return;
    setLoading(true); setRegStatus("Registering...");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerCreator(regName.trim(), regCat);
      setRegStatus("Waiting for confirmation...");
      await tx.wait();
      setRegStatus("✓ Registered! Your page is live.");
      await loadMyData(account);
      await loadStats();
    } catch (e: unknown) { setRegStatus("✗ " + (e as Error).message?.slice(0, 80)); }
    finally { setLoading(false); }
  }

  async function sendTip() {
    if (!account || !tipTarget || !tipAmount) return;
    setLoading(true); setTipStatus("Sending tip...");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const value = ethers.parseEther(tipAmount);
      const tx = await contract.tip(tipTarget, tipMsg || "🔥", { value });
      setTipStatus("Waiting for confirmation...");
      await tx.wait();
      setTipStatus("✓ Tip sent on-chain!");
      setTipMsg(""); setTipAmount("0.1");
      await loadStats();
    } catch (e: unknown) { setTipStatus("✗ " + (e as Error).message?.slice(0, 80)); }
    finally { setLoading(false); }
  }

  async function withdrawFunds() {
    if (!account) return;
    setLoading(true); setWithdrawStatus("Withdrawing...");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.withdraw();
      setWithdrawStatus("Waiting for confirmation...");
      await tx.wait();
      setWithdrawStatus("✓ Withdrawn!");
      await loadMyData(account);
    } catch (e: unknown) { setWithdrawStatus("✗ " + (e as Error).message?.slice(0, 80)); }
    finally { setLoading(false); }
  }

  const panel: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", padding: "20px" };
  const label: React.CSSProperties = { fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "12px", display: "block" };
  const input: React.CSSProperties = { width: "100%", background: "#080808", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 12px", fontSize: "0.72rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const btn: React.CSSProperties = { padding: "8px 20px", background: "var(--accent)", color: "var(--bg)", border: "none", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" };
  const btnGhost: React.CSSProperties = { ...btn, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>
      <NavBar time={time} />

      {/* Ticker */}
      <div style={{ background: "#050505", borderBottom: "1px solid var(--border)", padding: "6px 0", overflow: "hidden", fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", paddingLeft: "100%" }} className="ticker">
          PIXELTIP · DECENTRALIZED CREATOR TIPPING · ARC TESTNET · CHAIN 5042002 · CONTRACT {CONTRACT_ADDRESS} · PLATFORM FEE {Number(stats.fee) / 100}% · {Number(stats.creators)} CREATORS · {Number(stats.tips)} TIPS SENT · TOTAL VOLUME {parseFloat(ethers.formatEther(stats.volume)).toFixed(2)} ARC ·&nbsp;&nbsp;&nbsp;
          PIXELTIP · DECENTRALIZED CREATOR TIPPING · ARC TESTNET · CHAIN 5042002 · CONTRACT {CONTRACT_ADDRESS} · PLATFORM FEE {Number(stats.fee) / 100}% · {Number(stats.creators)} CREATORS · {Number(stats.tips)} TIPS SENT ·
        </span>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>

        {/* Hero */}
        <section style={{ ...panel, borderLeft: "3px solid var(--accent)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "8px" }}>PIXELTIP / V1.0 / ARC NETWORK</div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0", lineHeight: 1.2 }}>
                Creator Tipping<br /><span style={{ color: "var(--accent)" }}>On-Chain.</span>
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 16px 0", lineHeight: 1.7, maxWidth: "480px" }}>
                Register your profile. Share your page. Get tipped in native ARC tokens — instantly, transparently, on ARC testnet. Every transaction on-chain, zero trust required.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {!account ? (
                  <button onClick={connectAndLoad} style={btn}>[ CONNECT WALLET ]</button>
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 600, padding: "8px 12px", border: "1px solid rgba(0,184,148,0.3)", background: "rgba(0,184,148,0.06)" }}>
                    ✓ CONNECTED · {account.slice(0, 8)}...{account.slice(-4)}
                  </div>
                )}
                <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: "none" }}>CONTRACT ↗</a>
              </div>
            </div>
            {/* Stats panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", minWidth: "220px" }}>
              {[
                { label: "CREATORS", value: Number(stats.creators).toString() },
                { label: "TIPS SENT", value: Number(stats.tips).toString() },
                { label: "VOLUME ARC", value: parseFloat(ethers.formatEther(stats.volume)).toFixed(2) },
                { label: "PLATFORM FEE", value: (Number(stats.fee) / 100).toFixed(1) + "%" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--panel)", padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)" }}>{s.value}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main 3-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>

          {/* Col 1: Register */}
          <div style={panel}>
            <span style={label}>① BECOME A CREATOR</span>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              Register once on-chain. Get your own tipping page. Anyone can send you ARC tips directly.
            </p>
            {myCreator ? (
              <div>
                <div style={{ padding: "10px", border: "1px solid var(--green)", background: "rgba(0,184,148,0.06)", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginBottom: "4px" }}>YOUR PROFILE</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>{myCreator.name}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{CAT_LABELS[myCreator.category] || myCreator.category}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "6px" }}>
                    Tips: <span style={{ color: "var(--green)" }}>{Number(myCreator.tipsReceived)}</span> · Earned: <span style={{ color: "var(--green)" }}>{parseFloat(ethers.formatEther(myCreator.volumeReceived)).toFixed(4)} ARC</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginBottom: "6px" }}>YOUR TIP PAGE URL:</div>
                <div style={{ padding: "8px", background: "#080808", border: "1px solid var(--border)", fontSize: "0.62rem", color: "var(--accent)", wordBreak: "break-all" }}>
                  {typeof window !== "undefined" ? window.location.origin : ""}/creator/{myCreator.address}
                </div>
              </div>
            ) : (
              <div>
                {!account ? (
                  <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Connect wallet first ↑</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your name / alias" style={input} />
                    <select value={regCat} onChange={e => setRegCat(e.target.value)} style={{ ...input, cursor: "pointer" }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <button onClick={registerCreator} disabled={loading || !regName.trim()} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
                      {loading ? "REGISTERING..." : "[ REGISTER ]"}
                    </button>
                    {regStatus && <div style={{ fontSize: "0.65rem", color: regStatus.startsWith("✓") ? "var(--green)" : "var(--red)" }}>{regStatus}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Col 2: Send tip */}
          <div style={panel}>
            <span style={label}>② SEND A TIP</span>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              Paste a creator&apos;s wallet address and send ARC. 2.5% goes to the platform. The rest goes to them.
            </p>
            {!account ? (
              <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Connect wallet first ↑</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input value={tipTarget} onChange={e => setTipTarget(e.target.value)} placeholder="Creator address (0x...)" style={input} />
                <div style={{ display: "flex", gap: "6px" }}>
                  {["0.1", "0.5", "1", "5"].map(v => (
                    <button key={v} onClick={() => setTipAmount(v)} style={{ flex: 1, padding: "6px 0", background: tipAmount === v ? "var(--accent)" : "transparent", color: tipAmount === v ? "var(--bg)" : "var(--muted)", border: "1px solid var(--border)", fontSize: "0.65rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {v}
                    </button>
                  ))}
                </div>
                <input value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="ARC amount" style={input} type="number" min="0" step="0.01" />
                <input value={tipMsg} onChange={e => setTipMsg(e.target.value)} placeholder="Message (optional)" style={input} maxLength={80} />
                <button onClick={sendTip} disabled={loading || !tipTarget} style={{ ...btn, opacity: loading || !tipTarget ? 0.6 : 1 }}>
                  {loading ? "SENDING..." : `[ SEND ${tipAmount} ARC ]`}
                </button>
                {tipStatus && <div style={{ fontSize: "0.65rem", color: tipStatus.startsWith("✓") ? "var(--green)" : "var(--red)" }}>{tipStatus}</div>}
              </div>
            )}
          </div>

          {/* Col 3: Withdraw */}
          <div style={panel}>
            <span style={label}>③ WITHDRAW EARNINGS</span>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              All tips are held in the contract. Withdraw to your wallet anytime — no lock-up, no KYC.
            </p>
            {!account ? (
              <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Connect wallet first ↑</div>
            ) : (
              <div>
                <div style={{ padding: "14px", border: "1px solid var(--border)", background: "#080808", marginBottom: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "4px" }}>PENDING WITHDRAWAL</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: parseFloat(pendingBalance) > 0 ? "var(--green)" : "var(--muted)" }}>
                    {pendingBalance} <span style={{ fontSize: "0.8rem" }}>ARC</span>
                  </div>
                </div>
                <button onClick={withdrawFunds} disabled={loading || parseFloat(pendingBalance) <= 0} style={{ ...btn, width: "100%", opacity: loading || parseFloat(pendingBalance) <= 0 ? 0.5 : 1 }}>
                  {loading ? "WITHDRAWING..." : "[ WITHDRAW ALL ]"}
                </button>
                <button onClick={() => loadMyData(account)} style={{ ...btnGhost, width: "100%", marginTop: "6px", boxSizing: "border-box" }}>
                  [ REFRESH BALANCE ]
                </button>
                {withdrawStatus && <div style={{ fontSize: "0.65rem", marginTop: "8px", color: withdrawStatus.startsWith("✓") ? "var(--green)" : "var(--red)" }}>{withdrawStatus}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Creator Leaderboard */}
        <section style={{ ...panel, marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={label}>CREATOR LEADERBOARD / ON-CHAIN</span>
            <button onClick={loadStats} style={{ ...btnGhost, padding: "4px 12px", fontSize: "0.6rem" }}>[ REFRESH ]</button>
          </div>
          {creators.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--muted)", fontSize: "0.7rem" }}>
              No creators yet. Be the first to register ↑
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#", "NAME", "CATEGORY", "TIPS", "VOLUME (ARC)", "ADDRESS", "ACTION"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creators.sort((a, b) => Number(b.tipsReceived - a.tipsReceived)).map((c, i) => (
                    <tr key={c.address} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "10px 12px", color: "var(--muted)" }}>#{i + 1}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text)", fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "rgba(0,184,148,0.1)", color: "var(--accent)", padding: "2px 8px", fontSize: "0.55rem", letterSpacing: "0.08em" }}>
                          {CAT_LABELS[c.category] || c.category}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--green)", fontWeight: 600 }}>{Number(c.tipsReceived)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--green)", fontWeight: 600 }}>{parseFloat(ethers.formatEther(c.volumeReceived)).toFixed(4)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <a href={`${ARCSCAN}/address/${c.address}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.62rem" }}>
                          {c.address.slice(0, 8)}...{c.address.slice(-4)} ↗
                        </a>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button onClick={() => { setTipTarget(c.address); document.querySelector("#tip-section")?.scrollIntoView({ behavior: "smooth" }); }}
                          style={{ ...btn, padding: "4px 10px", fontSize: "0.6rem" }}>TIP</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* How it works */}
        <section style={{ ...panel, marginBottom: "20px" }}>
          <span style={label}>HOW IT WORKS / 3 STEPS</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              { n: "01", title: "REGISTER", desc: "Connect wallet, set your name and category. One transaction — your profile is live on ARC blockchain forever." },
              { n: "02", title: "SHARE", desc: "Share your unique link. Anyone can tip you directly. No middleman, no platform fees beyond 2.5% contract fee." },
              { n: "03", title: "EARN", desc: "Tips accumulate in the smart contract. Withdraw anytime. 97.5% goes to you, 2.5% to platform." },
            ].map(s => (
              <div key={s.n} style={{ padding: "16px", border: "1px solid var(--border)", background: "#080808" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)", opacity: 0.3, marginBottom: "8px" }}>{s.n}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{s.title}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Agent SOON */}
        <section style={{ ...panel, marginBottom: "20px", borderLeft: "3px solid rgba(0,184,148,0.4)", position: "relative", overflow: "hidden" }}>
          {/* Background grid effect */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "linear-gradient(rgba(0,184,148,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,184,148,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={label}>AI AGENT / COMING SOON</span>
              <span style={{ background: "rgba(0,184,148,0.15)", color: "var(--accent)", fontSize: "0.55rem", padding: "2px 10px", letterSpacing: "0.15em", fontWeight: 700, border: "1px solid rgba(0,184,148,0.3)" }}>SOON</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", margin: "0 0 12px 0", lineHeight: 1.3 }}>
                  Meet <span style={{ color: "var(--accent)" }}>PixelAgent</span> —<br />Your On-Chain AI Manager
                </h2>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.8, margin: "0 0 16px 0" }}>
                  An autonomous AI agent that runs on ARC Network. It monitors your creator profile, sends automated thank-you messages to tippers, routes payments, and optimizes your earnings — all on-chain, 24/7.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.68rem", color: "var(--muted)" }}>
                  {[
                    "Auto-reply to tips with personalized AI messages",
                    "Smart routing — split tips between wallets on-chain",
                    "Analytics dashboard — track earnings in real time",
                    "ARC-native: agent holds funds in smart contract",
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>▸</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Terminal mockup */}
              <div style={{ background: "#050505", border: "1px solid var(--border)", padding: "16px", fontFamily: "inherit" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f57" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#28c840" }} />
                  <span style={{ marginLeft: "8px", fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.1em" }}>pixel-agent v0.1 — ARC TESTNET</span>
                </div>
                <div style={{ fontSize: "0.65rem", lineHeight: 2, color: "var(--muted)" }}>
                  <div><span style={{ color: "var(--accent)" }}>$</span> agent.start()</div>
                  <div style={{ color: "var(--green)" }}>✓ Monitoring contract 0x630A48...</div>
                  <div><span style={{ color: "var(--accent)" }}>$</span> tip received: 1.0 ARC</div>
                  <div style={{ color: "var(--green)" }}>✓ Auto-reply sent to 0xf81b...</div>
                  <div><span style={{ color: "var(--accent)" }}>$</span> earnings: 12.5 ARC pending</div>
                  <div><span style={{ color: "var(--accent)" }}>$</span> next action: withdraw at 20 ARC</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "var(--accent)" }}>$</span>
                    <span className="blink" style={{ display: "inline-block", width: "8px", height: "13px", background: "var(--accent)", verticalAlign: "middle" }} />
                  </div>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div style={{ marginTop: "20px", padding: "12px 16px", background: "rgba(0,184,148,0.05)", border: "1px solid rgba(0,184,148,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                Powered by <span style={{ color: "var(--accent)", fontWeight: 700 }}>ARC Network</span> · Autonomous smart contract execution · Zero custody
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em" }}>NOTIFY ME</span>
                <div style={{ padding: "6px 16px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", opacity: 0.6, cursor: "not-allowed" }}>
                  [ JOIN WAITLIST ]
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why ARC */}
        <section style={{ ...panel }}>
          <span style={label}>WHY ARC NETWORK</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
            {[
              { icon: "⚡", title: "Fast", desc: "Near-instant finality on ARC testnet" },
              { icon: "⛓", title: "On-Chain", desc: "Every tip recorded on the blockchain" },
              { icon: "🔍", title: "Transparent", desc: "All transactions visible on ArcScan" },
              { icon: "🔒", title: "Non-custodial", desc: "You own your funds, always" },
            ].map(f => (
              <div key={f.title} style={{ padding: "14px", border: "1px solid var(--border)", background: "#080808", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>{f.icon}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{f.title}</div>
                <div style={{ fontSize: "0.62rem", color: "var(--muted)", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}

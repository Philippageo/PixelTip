"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Avatar from "@/components/Avatar";
import { ARCSCAN, switchToArc } from "@/lib/arcNetwork";
import {
  CONTRACT_ADDRESS,
  PIXELTIP_ABI as CONTRACT_ABI,
  readContract,
  CATEGORIES,
  CAT_LABELS,
  CAT_ICON,
  fetchStats,
  fetchCreators,
  fetchTips,
  fmtArc,
  shortAddr,
  timeAgo,
  type Creator,
  type TipRecord,
} from "@/lib/pixeltip";

export default function Home() {
  const [time, setTime] = useState("");
  const [stats, setStats] = useState({ tips: BigInt(0), volume: BigInt(0), creators: BigInt(0), fee: BigInt(0) });
  const [creators, setCreators] = useState<Creator[]>([]);
  const [activity, setActivity] = useState<TipRecord[]>([]);
  const [account, setAccount] = useState("");
  const [myCreator, setMyCreator] = useState<Creator | null>(null);
  const [pendingBalance, setPendingBalance] = useState("0");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [s, list, acts] = await Promise.all([
        fetchStats(),
        fetchCreators(30),
        fetchTips({ max: 12, scan: 60 }),
      ]);
      setStats(s);
      setCreators(list);
      setActivity(acts);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const nameOf = useCallback(
    (addr: string) => creators.find((c) => c.address.toLowerCase() === addr.toLowerCase())?.name,
    [creators]
  );

  const loadMyData = useCallback(async (addr: string) => {
    try {
      const contract = readContract();
      const c = await contract.creators(addr);
      setMyCreator(
        c.active
          ? {
              address: ethers.getAddress(addr),
              name: c.name,
              category: c.category,
              active: c.active,
              tipsReceived: c.tipsReceived,
              volumeReceived: c.volumeReceived,
            }
          : null
      );
      const pending = await contract.pendingWithdrawals(addr);
      setPendingBalance(parseFloat(ethers.formatEther(pending)).toFixed(4));
    } catch {
      setMyCreator(null);
      setPendingBalance("0");
    }
  }, []);

  const connectAndLoad = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
      setAccount(accounts[0]);
      await switchToArc();
      await loadMyData(accounts[0]);
    } catch {
      /* ignore */
    }
  }, [loadMyData]);

  // Keep the shared wallet account in sync: rehydrate an already-authorized
  // wallet on mount, and react to account switches in MetaMask/Rabby. The page
  // owns this state and feeds it to the NavBar so the two never disagree.
  useEffect(() => {
    if (!window.ethereum) return;
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accs) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          loadMyData(accs[0]);
        }
      })
      .catch(() => {});
    if (!window.ethereum.on) return;
    const handler = (accounts: unknown) => {
      const list = accounts as string[];
      if (list.length > 0) {
        setAccount(list[0]);
        loadMyData(list[0]);
      } else {
        setAccount("");
        setMyCreator(null);
        setPendingBalance("0");
      }
    };
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum?.removeListener?.("accountsChanged", handler);
  }, [loadMyData]);

  async function registerCreator() {
    if (!account || !regName.trim()) return;
    setLoading(true);
    setRegStatus("Registering…");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner(account);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerCreator(regName.trim(), regCat);
      setRegStatus("Waiting for confirmation…");
      await tx.wait();
      setRegStatus("✓ Registered! Your page is live.");
      await loadMyData(account);
      await loadStats();
    } catch (e: unknown) {
      setRegStatus("✗ " + (e as Error).message?.slice(0, 80));
    } finally {
      setLoading(false);
    }
  }

  async function sendTip() {
    if (!account) return;
    if (!ethers.isAddress(tipTarget)) {
      setTipStatus("✗ Enter a valid creator address (0x…)");
      return;
    }
    if (!tipAmount || Number(tipAmount) <= 0) {
      setTipStatus("✗ Enter an amount greater than 0");
      return;
    }
    setLoading(true);
    setTipStatus("Sending tip…");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner(account);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const value = ethers.parseEther(tipAmount);
      const tx = await contract.tip(tipTarget, tipMsg || "🔥", { value });
      setTipStatus("Waiting for confirmation…");
      await tx.wait();
      setTipStatus("✓ Tip sent on-chain!");
      setTipMsg("");
      setTipAmount("0.1");
      await loadStats();
    } catch (e: unknown) {
      setTipStatus("✗ " + (e as Error).message?.slice(0, 80));
    } finally {
      setLoading(false);
    }
  }

  async function withdrawFunds() {
    if (!account) return;
    setLoading(true);
    setWithdrawStatus("Withdrawing…");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner(account);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.withdraw();
      setWithdrawStatus("Waiting for confirmation…");
      await tx.wait();
      setWithdrawStatus("✓ Withdrawn!");
      await loadMyData(account);
    } catch (e: unknown) {
      setWithdrawStatus("✗ " + (e as Error).message?.slice(0, 80));
    } finally {
      setLoading(false);
    }
  }

  async function copyMyLink() {
    if (!myCreator) return;
    try {
      await navigator.clipboard.writeText(`${origin}/creator/${myCreator.address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const panel: React.CSSProperties = { background: "var(--panel)", border: "1px solid var(--border)", padding: "20px" };
  const label: React.CSSProperties = { fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.12em", marginBottom: "12px", display: "block" };
  const input: React.CSSProperties = { width: "100%", background: "#080808", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 12px", fontSize: "0.72rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const btn: React.CSSProperties = { padding: "8px 20px", background: "var(--accent)", color: "var(--bg)", border: "none", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit" };
  const btnGhost: React.CSSProperties = { ...btn, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>
      <NavBar time={time} account={account} onConnect={connectAndLoad} />

      {/* Ticker */}
      <div style={{ background: "#050505", borderBottom: "1px solid var(--border)", padding: "6px 0", overflow: "hidden", fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", paddingLeft: "100%" }} className="ticker">
          PIXELTIP · DECENTRALIZED CREATOR TIPPING · ARC TESTNET · CHAIN 5042002 · CONTRACT {CONTRACT_ADDRESS} · PLATFORM FEE {Number(stats.fee) / 100}% · {Number(stats.creators)} CREATORS · {Number(stats.tips)} TIPS SENT · TOTAL VOLUME {fmtArc(stats.volume, 2)} ARC ·&nbsp;&nbsp;&nbsp;
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
                Register your profile. Get your own shareable page. Receive tips in native ARC tokens — instantly, transparently, on ARC testnet. Every transaction on-chain, zero trust required.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {!account ? (
                  <button onClick={connectAndLoad} style={btn}>[ CONNECT WALLET ]</button>
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 600, padding: "8px 12px", border: "1px solid rgba(0,184,148,0.3)", background: "rgba(0,184,148,0.06)" }}>
                    ✓ CONNECTED · {shortAddr(account, 8, 4)}
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
                { label: "VOLUME ARC", value: fmtArc(stats.volume, 2) },
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
          <div id="register" style={panel}>
            <span style={label}>① BECOME A CREATOR</span>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              Register once on-chain. Get your own tipping page. Anyone can send you ARC tips directly.
            </p>
            {myCreator ? (
              <div>
                <div style={{ padding: "10px", border: "1px solid var(--green)", background: "rgba(0,184,148,0.06)", marginBottom: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <Avatar address={myCreator.address} size={40} rounded />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>{myCreator.name}</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--muted)" }}>
                      {CAT_ICON[myCreator.category]} {CAT_LABELS[myCreator.category] || myCreator.category}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginTop: "4px" }}>
                      Tips: <span style={{ color: "var(--green)" }}>{Number(myCreator.tipsReceived)}</span> · Earned: <span style={{ color: "var(--green)" }}>{fmtArc(myCreator.volumeReceived)} ARC</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginBottom: "6px" }}>YOUR PUBLIC TIP PAGE:</div>
                <a href={`/creator/${myCreator.address}`} style={{ display: "block", padding: "8px", background: "#080808", border: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--accent)", wordBreak: "break-all", textDecoration: "none" }}>
                  {origin}/creator/{myCreator.address}
                </a>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <a href={`/creator/${myCreator.address}`} style={{ ...btn, flex: 1, textAlign: "center", textDecoration: "none" }}>[ OPEN PAGE ]</a>
                  <button onClick={copyMyLink} style={{ ...btnGhost, flex: 1 }}>{copied ? "✓ COPIED" : "[ COPY ]"}</button>
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
                      {loading ? "REGISTERING…" : "[ REGISTER ]"}
                    </button>
                    {regStatus && <div style={{ fontSize: "0.65rem", color: regStatus.startsWith("✓") ? "var(--green)" : regStatus.startsWith("✗") ? "var(--red)" : "var(--accent)" }}>{regStatus}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Col 2: Send tip */}
          <div id="send" style={panel}>
            <span style={label}>② SEND A TIP</span>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              Paste a creator&apos;s wallet address and send ARC. 2.5% goes to the platform. The rest goes to them.
            </p>
            {!account ? (
              <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Connect wallet first ↑</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input value={tipTarget} onChange={e => setTipTarget(e.target.value)} placeholder="Creator address (0x…)" style={input} />
                <div style={{ display: "flex", gap: "6px" }}>
                  {["0.1", "0.5", "1", "5"].map(v => (
                    <button key={v} onClick={() => setTipAmount(v)} style={{ flex: 1, padding: "6px 0", background: tipAmount === v ? "var(--accent)" : "transparent", color: tipAmount === v ? "var(--bg)" : "var(--muted)", border: "1px solid var(--border)", fontSize: "0.65rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {v}
                    </button>
                  ))}
                </div>
                <input value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="ARC amount" style={input} type="number" min="0" step="0.01" />
                <input value={tipMsg} onChange={e => setTipMsg(e.target.value)} placeholder="Message (optional)" style={input} maxLength={80} />
                {(() => {
                  const tipDisabled = loading || !ethers.isAddress(tipTarget) || Number(tipAmount) <= 0;
                  return (
                    <button onClick={sendTip} disabled={tipDisabled} style={{ ...btn, opacity: tipDisabled ? 0.6 : 1 }}>
                      {loading ? "SENDING…" : `[ SEND ${tipAmount || "0"} ARC ]`}
                    </button>
                  );
                })()}
                {tipStatus && <div style={{ fontSize: "0.65rem", color: tipStatus.startsWith("✓") ? "var(--green)" : tipStatus.startsWith("✗") ? "var(--red)" : "var(--accent)" }}>{tipStatus}</div>}
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
                  {loading ? "WITHDRAWING…" : "[ WITHDRAW ALL ]"}
                </button>
                <button onClick={() => loadMyData(account)} style={{ ...btnGhost, width: "100%", marginTop: "6px", boxSizing: "border-box" }}>
                  [ REFRESH BALANCE ]
                </button>
                {withdrawStatus && <div style={{ fontSize: "0.65rem", marginTop: "8px", color: withdrawStatus.startsWith("✓") ? "var(--green)" : withdrawStatus.startsWith("✗") ? "var(--red)" : "var(--accent)" }}>{withdrawStatus}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Creator Leaderboard */}
        <section id="leaderboard" style={{ ...panel, marginBottom: "20px" }}>
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
                    {["#", "CREATOR", "CATEGORY", "TIPS", "VOLUME (ARC)", "ADDRESS", ""].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...creators].sort((a, b) => Number(b.tipsReceived - a.tipsReceived)).map((c, i) => (
                    <tr key={c.address} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "10px 12px", color: "var(--muted)" }}>#{i + 1}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <a href={`/creator/${c.address}`} style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
                          <Avatar address={c.address} size={26} rounded />
                          {c.name}
                        </a>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "rgba(0,184,148,0.1)", color: "var(--accent)", padding: "2px 8px", fontSize: "0.55rem", letterSpacing: "0.08em" }}>
                          {CAT_LABELS[c.category] || c.category}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--green)", fontWeight: 600 }}>{Number(c.tipsReceived)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--green)", fontWeight: 600 }}>{fmtArc(c.volumeReceived)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <a href={`${ARCSCAN}/address/${c.address}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.62rem" }}>
                          {shortAddr(c.address)} ↗
                        </a>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <a href={`/creator/${c.address}`} style={{ ...btn, padding: "4px 10px", fontSize: "0.6rem", textDecoration: "none" }}>TIP</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Live on-chain activity */}
        <section id="activity" style={{ ...panel, marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={label}>LIVE ACTIVITY / ON-CHAIN TIP FEED</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.58rem", color: "var(--green)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)" }} className="blink" /> LIVE
            </span>
          </div>
          {activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", color: "var(--muted)", fontSize: "0.7rem" }}>
              No tips yet. The feed updates as ARC flows through the contract.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {activity.map((t) => {
                const cName = nameOf(t.creator);
                return (
                  <div key={t.index} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "#080808", border: "1px solid var(--border)" }}>
                    <Avatar address={t.sender} size={28} rounded />
                    <div style={{ flex: 1, minWidth: 0, fontSize: "0.64rem", lineHeight: 1.5 }}>
                      <div style={{ color: "var(--muted)" }}>
                        <span style={{ color: "var(--text)" }}>{shortAddr(t.sender, 5, 3)}</span> → tipped{" "}
                        <a href={`/creator/${t.creator}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                          {cName || shortAddr(t.creator, 5, 3)}
                        </a>
                      </div>
                      {t.message && <div style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{t.message}”</div>}
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ color: "var(--green)", fontWeight: 700, fontSize: "0.7rem" }}>+{fmtArc(t.amount, 2)}</div>
                      <div style={{ color: "var(--muted)", fontSize: "0.54rem" }}>{timeAgo(t.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works */}
        <section id="how" style={{ ...panel, marginBottom: "20px" }}>
          <span style={label}>HOW IT WORKS / 3 STEPS</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              { n: "01", title: "REGISTER", desc: "Connect wallet, set your name and category. One transaction — your profile is live on ARC blockchain forever." },
              { n: "02", title: "SHARE", desc: "Share your unique creator link. Anyone can tip you directly. No middleman, no platform fees beyond 2.5% contract fee." },
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
                  <div style={{ color: "var(--green)" }}>✓ Monitoring contract {shortAddr(CONTRACT_ADDRESS, 8, 4)}</div>
                  <div><span style={{ color: "var(--accent)" }}>$</span> tip received: 1.0 ARC</div>
                  <div style={{ color: "var(--green)" }}>✓ Auto-reply sent to 0xf81b…</div>
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

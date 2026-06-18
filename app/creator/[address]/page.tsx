"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Avatar from "@/components/Avatar";
import { ARCSCAN, switchToArc } from "@/lib/arcNetwork";
import {
  CONTRACT_ADDRESS,
  PIXELTIP_ABI,
  CAT_LABELS,
  CAT_ICON,
  readContract,
  fetchCreator,
  fetchCreatorTips,
  fetchCreators,
  fmtArc,
  shortAddr,
  timeAgo,
  type Creator,
  type TipRecord,
} from "@/lib/pixeltip";

const QUICK = ["0.1", "0.5", "1", "5"];

export default function CreatorPage() {
  const params = useParams<{ address: string }>();
  const raw = (params?.address as string) || "";
  const valid = ethers.isAddress(raw);
  const address = valid ? ethers.getAddress(raw) : raw;

  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [rank, setRank] = useState<{ pos: number; total: number } | null>(null);

  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("0.5");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl =
    typeof window !== "undefined" ? `${window.location.origin}/creator/${address}` : "";

  useEffect(() => {
    const t = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false })),
      1000
    );
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!valid) {
      setLoading(false);
      return;
    }
    try {
      const [cr, ts] = await Promise.all([
        fetchCreator(address),
        fetchCreatorTips(address, 30),
      ]);
      setCreator(cr);
      setTips(ts);
      if (cr) {
        try {
          const c = readContract();
          const total = Number(await c.getCreatorsCount());
          const all = await fetchCreators(total, c);
          const sorted = [...all].sort((a, b) => Number(b.tipsReceived - a.tipsReceived));
          const pos = sorted.findIndex((x) => x.address.toLowerCase() === address.toLowerCase());
          if (pos >= 0) setRank({ pos: pos + 1, total: all.length });
        } catch {
          /* rank is optional */
        }
      }
    } catch {
      /* ignore — keeps empty state */
    } finally {
      setLoading(false);
    }
  }, [address, valid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (creator?.name) document.title = `${creator.name} — PixelTip`;
  }, [creator?.name]);

  useEffect(() => {
    if (!window.ethereum) return;
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accs) => {
        if (accs.length) setAccount(accs[0]);
      })
      .catch(() => {});
    if (!window.ethereum.on) return;
    const handler = (accounts: unknown) => {
      const list = accounts as string[];
      setAccount(list.length ? list[0] : "");
    };
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum?.removeListener?.("accountsChanged", handler);
  }, []);

  async function connect() {
    if (!window.ethereum) {
      setStatus("✗ No wallet detected. Install MetaMask or Rabby.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accs = (await provider.send("eth_requestAccounts", [])) as string[];
      setAccount(accs[0]);
      await switchToArc();
    } catch (e) {
      setStatus("✗ " + (e as Error).message?.slice(0, 80));
    }
  }

  async function sendTip() {
    if (!account || !valid || !amount || Number(amount) <= 0) return;
    setBusy(true);
    setStatus("Opening wallet…");
    try {
      await switchToArc();
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner(account);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PIXELTIP_ABI, signer);
      const tx = await contract.tip(address, message || "🔥", { value: ethers.parseEther(amount) });
      setStatus("Confirming on ARC…");
      await tx.wait();
      setStatus("✓ Tip sent on-chain! Thank you for supporting this creator.");
      setMessage("");
      await load();
    } catch (e) {
      setStatus("✗ " + ((e as Error).message?.slice(0, 90) || "Transaction failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  // ── shared styles ───────────────────────────────────────────
  const panel: React.CSSProperties = {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    padding: "20px",
  };
  const label: React.CSSProperties = {
    fontSize: "0.58rem",
    color: "var(--muted)",
    letterSpacing: "0.12em",
    marginBottom: "12px",
    display: "block",
  };
  const input: React.CSSProperties = {
    width: "100%",
    background: "#080808",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "9px 12px",
    fontSize: "0.74rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    padding: "9px 20px",
    background: "var(--accent)",
    color: "var(--bg)",
    border: "none",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: "pointer",
    fontFamily: "inherit",
  };
  const btnGhost: React.CSSProperties = {
    ...btn,
    background: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
  };

  const wrap = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <NavBar time={time} account={account} onConnect={connect} />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 20px" }}>{children}</div>
      <Footer />
    </div>
  );

  // ── invalid address ─────────────────────────────────────────
  if (!valid) {
    return wrap(
      <section style={{ ...panel, borderLeft: "3px solid var(--red)" }}>
        <span style={label}>INVALID ADDRESS</span>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.7 }}>
          <span style={{ color: "var(--text)", wordBreak: "break-all" }}>{raw}</span> is not a valid
          wallet address.
        </p>
        <a href="/" style={{ ...btnGhost, textDecoration: "none", display: "inline-block", marginTop: "12px" }}>
          ← BACK TO DIRECTORY
        </a>
      </section>
    );
  }

  // ── loading ─────────────────────────────────────────────────
  if (loading) {
    return wrap(
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)", fontSize: "0.78rem" }}>
        <span className="blink">▍</span> Reading profile from ARC Testnet…
      </div>
    );
  }

  // ── not a registered creator ────────────────────────────────
  if (!creator) {
    return wrap(
      <section style={{ ...panel, borderLeft: "3px solid var(--accent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <Avatar address={address} size={56} rounded />
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
              No profile yet
            </div>
            <a
              href={`${ARCSCAN}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.65rem", color: "var(--muted)", textDecoration: "none" }}
            >
              {shortAddr(address, 10, 8)} ↗
            </a>
          </div>
        </div>
        <p style={{ fontSize: "0.76rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "16px" }}>
          This wallet hasn&apos;t registered a PixelTip creator profile yet. If it&apos;s yours,
          register on-chain in one transaction and your public tipping page goes live right here.
        </p>
        <a href="/#register" style={{ ...btn, textDecoration: "none", display: "inline-block" }}>
          [ REGISTER THIS PROFILE ]
        </a>
      </section>
    );
  }

  // ── creator profile ─────────────────────────────────────────
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Tip ${creator.name} in ARC on-chain via PixelTip 💸`
  )}&url=${encodeURIComponent(pageUrl)}`;

  return wrap(
    <>
      {/* Profile header */}
      <section style={{ ...panel, borderLeft: "3px solid var(--accent)", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <Avatar address={address} size={84} rounded />
          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.15em", marginBottom: "6px" }}>
              PIXELTIP CREATOR · ARC TESTNET
            </div>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0", lineHeight: 1.1 }}>
              {creator.name}
            </h1>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(0,184,148,0.1)", color: "var(--accent)", padding: "3px 10px", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                {CAT_ICON[creator.category] || "◆"} {CAT_LABELS[creator.category] || creator.category}
              </span>
              <a
                href={`${ARCSCAN}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.64rem", color: "var(--muted)", textDecoration: "none" }}
              >
                {shortAddr(address, 8, 6)} ↗
              </a>
              {rank && (
                <span style={{ fontSize: "0.62rem", color: "var(--muted)" }}>
                  RANK <span style={{ color: "var(--accent)", fontWeight: 700 }}>#{rank.pos}</span> / {rank.total}
                </span>
              )}
            </div>
          </div>
          {/* stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", minWidth: "200px" }}>
            {[
              { label: "TIPS", value: Number(creator.tipsReceived).toString() },
              { label: "EARNED ARC", value: fmtArc(creator.volumeReceived, 3) },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--panel)", padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)" }}>{s.value}</div>
                <div style={{ fontSize: "0.54rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tip + Share */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Tip box */}
        <div style={{ ...panel, borderTop: "2px solid var(--accent)" }}>
          <span style={label}>SEND A TIP TO {creator.name.toUpperCase()}</span>
          {!account ? (
            <button onClick={connect} style={btn}>[ CONNECT WALLET ]</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {QUICK.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      background: amount === v ? "var(--accent)" : "transparent",
                      color: amount === v ? "var(--bg)" : "var(--muted)",
                      border: "1px solid var(--border)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="ARC amount"
                style={input}
              />
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={80}
                placeholder="Say something nice (optional)"
                style={input}
              />
              <button
                onClick={sendTip}
                disabled={busy || Number(amount) <= 0}
                style={{ ...btn, opacity: busy || Number(amount) <= 0 ? 0.6 : 1 }}
              >
                {busy ? "SENDING…" : `[ SEND ${amount || "0"} ARC ]`}
              </button>
              <div style={{ fontSize: "0.58rem", color: "var(--muted)", lineHeight: 1.6 }}>
                97.5% goes straight to the creator · 2.5% protocol fee · settled on-chain, non-custodial.
              </div>
            </div>
          )}
          {status && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "0.66rem",
                color: status.startsWith("✓") ? "var(--green)" : status.startsWith("✗") ? "var(--red)" : "var(--accent)",
              }}
            >
              {status}
            </div>
          )}
        </div>

        {/* Share */}
        <div style={panel}>
          <span style={label}>SHARE THIS PAGE</span>
          <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginBottom: "6px" }}>PUBLIC TIP LINK</div>
          <div
            style={{
              padding: "9px",
              background: "#080808",
              border: "1px solid var(--border)",
              fontSize: "0.6rem",
              color: "var(--accent)",
              wordBreak: "break-all",
              marginBottom: "10px",
            }}
          >
            {pageUrl}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={copyLink} style={btnGhost}>
              {copied ? "✓ COPIED" : "[ COPY LINK ]"}
            </button>
            <a href={tweet} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: "none", textAlign: "center" }}>
              SHARE ON X ↗
            </a>
          </div>
        </div>
      </div>

      {/* Supporters feed */}
      <section style={{ ...panel, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={label}>
            SUPPORTERS / ON-CHAIN
            {Number(creator.tipsReceived) > tips.length && (
              <span style={{ color: "var(--muted)", marginLeft: "8px", letterSpacing: 0 }}>
                · showing {tips.length} of {Number(creator.tipsReceived)}
              </span>
            )}
          </span>
          <button onClick={load} style={{ ...btnGhost, padding: "4px 12px", fontSize: "0.6rem" }}>[ REFRESH ]</button>
        </div>
        {tips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", color: "var(--muted)", fontSize: "0.72rem" }}>
            No tips yet — be the first supporter ↑
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tips.map((t) => (
              <div
                key={t.index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: "#080808",
                  border: "1px solid var(--border)",
                }}
              >
                <Avatar address={t.sender} size={34} rounded />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                    <a
                      href={`${ARCSCAN}/address/${t.sender}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.66rem", color: "var(--text)", fontWeight: 600, textDecoration: "none" }}
                    >
                      {shortAddr(t.sender)}
                    </a>
                    <span style={{ fontSize: "0.58rem", color: "var(--muted)" }}>{timeAgo(t.timestamp)}</span>
                  </div>
                  {t.message && (
                    <div style={{ fontSize: "0.66rem", color: "var(--muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      “{t.message}”
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--green)", fontWeight: 700, whiteSpace: "nowrap" }}>
                  +{fmtArc(t.amount, 3)} ARC
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Powered by ARC */}
      <section style={{ ...panel, fontSize: "0.66rem", color: "var(--muted)", lineHeight: 1.8 }}>
        <span style={label}>POWERED BY ARC NETWORK</span>
        <p style={{ margin: "0 0 10px 0" }}>
          Every tip on this page is a real transaction on <strong style={{ color: "var(--text)" }}>ARC Testnet</strong>{" "}
          (chain 5042002). No platform holds your money — funds move straight into the PixelTip smart
          contract and can be withdrawn by the creator at any time. Fully transparent, verifiable by
          anyone.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>
            VERIFIED CONTRACT ↗
          </a>
          <a href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
            ← ALL CREATORS
          </a>
        </div>
      </section>
    </>
  );
}

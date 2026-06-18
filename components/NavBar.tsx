"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ARC_RPC, ARCSCAN, ARC_CHAIN_HEX, switchToArc } from "@/lib/arcNetwork";

interface NavBarProps {
  time: string;
  /** Shared wallet account — owned by the page so the nav and page never disagree. */
  account: string;
  /** Connect handler owned by the page (does requestAccounts + switchToArc + load). */
  onConnect: () => void | Promise<void>;
}

export default function NavBar({ time, account, onConnect }: NavBarProps) {
  const [balance, setBalance] = useState<string>("");
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function fetchBalance(addr: string) {
    try {
      const provider = new ethers.JsonRpcProvider(ARC_RPC);
      const bal = await provider.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch {
      setBalance("--");
    }
  }

  async function checkChain() {
    if (!window.ethereum) return;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setChainOk(chainId.toLowerCase() === ARC_CHAIN_HEX.toLowerCase());
    } catch {
      setChainOk(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      await onConnect();
    } catch (e) {
      console.error("Wallet connect error:", e);
    } finally {
      setConnecting(false);
    }
  }

  // Watch chain changes
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handler = (chainId: unknown) => {
      setChainOk((chainId as string).toLowerCase() === ARC_CHAIN_HEX.toLowerCase());
    };
    window.ethereum.on("chainChanged", handler);
    return () => {
      window.ethereum?.removeListener?.("chainChanged", handler);
    };
  }, []);

  // Sync balance + chain badge whenever the shared account changes; refresh every 30s.
  useEffect(() => {
    if (!account) {
      setBalance("");
      setChainOk(false);
      return;
    }
    fetchBalance(account);
    checkChain();
    const interval = setInterval(() => fetchBalance(account), 30000);
    return () => clearInterval(interval);
  }, [account]);

  function shortAddr(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <header style={{ background: "var(--panel)", borderBottom: "1px solid var(--accent)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px", maxWidth: "1600px", margin: "0 auto", gap: "16px" }}>

        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, textDecoration: "none" }}>
          <span style={{ color: "var(--accent)", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.15em" }} className="glow">
            PIXEL<span style={{ color: "var(--text)" }}>TIP</span>
          </span>
          <span style={{ background: "var(--accent)", color: "var(--bg)", fontSize: "0.6rem", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
        </a>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {[
            { label: "DIRECTORY", href: "/#leaderboard" },
            { label: "REGISTER", href: "/#register" },
            { label: "ACTIVITY", href: "/#activity" },
            { label: "HOW IT WORKS", href: "/#how" },
          ].map((item) => (
            <a key={item.href} href={item.href}
              style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--accent)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--muted)")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.7rem", flexShrink: 0 }}>
          <span style={{ color: "var(--accent)", fontWeight: 600, letterSpacing: "0.05em" }}>{time || "--:--:--"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--muted)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="blink" />
            OPEN
          </span>

          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Chain badge */}
              <div
                onClick={!chainOk ? () => switchToArc().then(() => setChainOk(true)).catch(() => {}) : undefined}
                title={chainOk ? "ARC Testnet" : "Click to switch to ARC Testnet"}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "3px 8px",
                  background: chainOk ? "rgba(0,184,148,0.1)" : "rgba(214,48,49,0.1)",
                  border: `1px solid ${chainOk ? "rgba(0,184,148,0.3)" : "rgba(214,48,49,0.4)"}`,
                  fontSize: "0.58rem",
                  color: chainOk ? "var(--green)" : "var(--red)",
                  letterSpacing: "0.08em",
                  cursor: chainOk ? "default" : "pointer",
                }}
              >
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: chainOk ? "var(--green)" : "var(--red)", display: "inline-block" }} />
                {chainOk ? "ARC TESTNET" : "SWITCH TO ARC"}
              </div>

              {/* Balance */}
              <div style={{ padding: "3px 10px", background: "rgba(0,184,148,0.06)", border: "1px solid var(--border)", fontSize: "0.68rem", color: "var(--text)", fontWeight: 600 }}>
                {balance} <span style={{ color: "var(--accent)" }}>ARC</span>
              </div>

              {/* Address */}
              <a
                href={`${ARCSCAN}/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "3px 10px", background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.65rem", color: "var(--muted)", fontFamily: "inherit", textDecoration: "none" }}
              >
                {shortAddr(account)}
              </a>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: "5px 14px",
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: connecting ? "wait" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget.style.background = "rgba(0,184,148,0.1)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); }}
            >
              {connecting ? "CONNECTING..." : "[ CONNECT ]"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

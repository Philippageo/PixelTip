"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const ARC_CHAIN_ID = 5042002;
const ARC_RPC = "https://rpc.testnet.arc.network";
const ARCSCAN = "https://testnet.arcscan.app";

interface NavBarProps {
  time: string;
}

export default function NavBar({ time }: NavBarProps) {
  const [account, setAccount] = useState<string>("");
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

  async function connectWallet() {
    if (!window.ethereum) return;
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      const addr = accounts[0];
      setAccount(addr);

      // Switch to ARC testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + ARC_CHAIN_ID.toString(16) }],
        });
        setChainOk(true);
      } catch (e: unknown) {
        const err = e as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x" + ARC_CHAIN_ID.toString(16),
              chainName: "ARC Testnet",
              nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
              rpcUrls: [ARC_RPC],
              blockExplorerUrls: [ARCSCAN],
            }],
          });
          setChainOk(true);
        }
      }
      await fetchBalance(addr);
    } catch {
      // ignore
    } finally {
      setConnecting(false);
    }
  }

  // Auto-refresh balance every 30s
  useEffect(() => {
    if (!account) return;
    const interval = setInterval(() => fetchBalance(account), 30000);
    return () => clearInterval(interval);
  }, [account]);

  function shortAddr(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <header
      style={{
        background: "var(--panel)",
        borderBottom: "1px solid var(--accent)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          maxWidth: "1600px",
          margin: "0 auto",
          gap: "16px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <span style={{ color: "var(--accent)", fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.15em" }} className="glow">
            PIXEL<span style={{ color: "var(--text)" }}>TIP</span>
          </span>
          <span style={{ background: "var(--accent)", color: "var(--bg)", fontSize: "0.6rem", padding: "1px 6px", fontWeight: 700, letterSpacing: "0.1em" }}>
            LIVE
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {["#services", "#portfolio", "#tutor", "#contact"].map((href) => (
            <a
              key={href}
              href={href}
              style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--accent)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--muted)")}
            >
              {href.replace("#", "")}
            </a>
          ))}
        </nav>

        {/* Right — clock + wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.7rem", flexShrink: 0 }}>
          {/* Clock */}
          <span style={{ color: "var(--accent)", fontWeight: 600, letterSpacing: "0.05em" }}>
            {time || "--:--:--"}
          </span>

          {/* Status dot */}
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--muted)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="blink" />
            OPEN
          </span>

          {/* Wallet block */}
          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Chain indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "3px 8px",
                background: chainOk ? "rgba(0,184,148,0.1)" : "rgba(214,48,49,0.1)",
                border: `1px solid ${chainOk ? "rgba(0,184,148,0.3)" : "rgba(214,48,49,0.3)"}`,
                fontSize: "0.58rem",
                color: chainOk ? "var(--green)" : "var(--red)",
                letterSpacing: "0.08em",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: chainOk ? "var(--green)" : "var(--red)", display: "inline-block" }} />
                {chainOk ? "ARC" : "WRONG NET"}
              </div>

              {/* Balance */}
              <div style={{
                padding: "3px 10px",
                background: "rgba(0,184,148,0.06)",
                border: "1px solid var(--border)",
                fontSize: "0.68rem",
                color: "var(--text)",
                fontWeight: 600,
              }}>
                {balance} <span style={{ color: "var(--accent)" }}>ARC</span>
              </div>

              {/* Address */}
              <div style={{
                padding: "3px 10px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                fontSize: "0.65rem",
                color: "var(--muted)",
                fontFamily: "inherit",
              }}>
                {shortAddr(account)}
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              style={{
                padding: "5px 14px",
                background: connecting ? "#1a1a1a" : "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: connecting ? "wait" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { if (!connecting) (e.currentTarget.style.background = "rgba(0,184,148,0.1)"); }}
              onMouseLeave={(e) => { if (!connecting) (e.currentTarget.style.background = "transparent"); }}
            >
              {connecting ? "CONNECTING..." : "[ CONNECT ]"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

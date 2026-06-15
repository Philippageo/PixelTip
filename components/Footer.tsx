"use client";

const CONTRACT_ADDRESS = "0xA8c2b034e02009AD3E85512EEcDc9d013AA4518D";
const ARCSCAN = "https://testnet.arcscan.app";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--panel)", marginTop: "24px" }}>
      {/* Contract bar */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "8px 24px",
        maxWidth: "1600px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "0.62rem",
        color: "var(--muted)",
      }}>
        <span style={{ color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em" }}>CONTRACT</span>
        <span style={{ color: "var(--border)" }}>│</span>
        <span style={{ color: "var(--muted)" }}>PixelTipRegistry</span>
        <span style={{ color: "var(--border)" }}>│</span>
        <a
          href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--green)",
            textDecoration: "none",
            fontFamily: "inherit",
            letterSpacing: "0.04em",
            fontWeight: 600,
          }}
        >
          {CONTRACT_ADDRESS}
        </a>
        <span style={{ color: "var(--border)" }}>│</span>
        <a
          href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--accent)",
            textDecoration: "none",
            fontSize: "0.6rem",
            letterSpacing: "0.08em",
          }}
        >
          VIEW ON ARCSCAN ↗
        </a>
        <span style={{ color: "var(--border)" }}>│</span>
        <span style={{ color: "var(--green)", fontWeight: 600 }}>● VERIFIED</span>
        <span style={{ color: "var(--muted)" }}>· ARC Testnet · Chain 5042002</span>
      </div>

      {/* Main footer */}
      <div style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.65rem",
        color: "var(--muted)",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>PIXELTIP</span>
            {" "}© {year} Philippa George
          </span>
          <span style={{ color: "var(--border)" }}>│</span>
          <span>All rights reserved</span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>
            Built on{" "}
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              ARC Network
            </a>
          </span>
          <span style={{ color: "var(--border)" }}>│</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--green)", fontWeight: 600 }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} className="blink" />
            SYSTEM ONLINE
          </span>
        </div>
      </div>
    </footer>
  );
}

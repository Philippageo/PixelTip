"use client";

const CONTRACT_ADDRESS = "0x74d21b54c684f0b78E29D11e3A994C6605C1D545";
const ARCSCAN = "https://testnet.arcscan.app";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--panel)", marginTop: "24px" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "8px 24px", maxWidth: "1600px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px", fontSize: "0.62rem", color: "var(--muted)", flexWrap: "wrap" }}>
        <span style={{ color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em" }}>CONTRACT</span>
        <span style={{ color: "var(--border)" }}>│</span>
        <span style={{ color: "var(--muted)" }}>PixelTip v1.0</span>
        <span style={{ color: "var(--border)" }}>│</span>
        <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 600 }}>{CONTRACT_ADDRESS}</a>
        <span style={{ color: "var(--border)" }}>│</span>
        <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.6rem", letterSpacing: "0.08em" }}>VIEW ON ARCSCAN ↗</a>
        <span style={{ color: "var(--border)" }}>│</span>
        <span style={{ color: "var(--muted)" }}>ARC Testnet · Chain 5042002 · Fee: 2.5%</span>
      </div>
      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--muted)", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span><span style={{ color: "var(--accent)", fontWeight: 700 }}>PIXELTIP</span> © {year}</span>
          <span style={{ color: "var(--border)" }}>│</span>
          <span>Decentralized creator tipping on ARC Network</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--green)", fontWeight: 600 }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} className="blink" />
          SYSTEM ONLINE
        </div>
      </div>
    </footer>
  );
}

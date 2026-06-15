"use client";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--panel)",
        marginTop: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.65rem",
          color: "var(--muted)",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>PIXELTIP</span>
            {" "}© {year} Philippa George
          </span>
          <span style={{ color: "var(--border)" }}>│</span>
          <span>All rights reserved</span>
        </div>

        {/* Center — contract address placeholder */}
        <div id="contract-info" />

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "var(--border)" }}>│</span>
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
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--green)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--green)",
                display: "inline-block",
              }}
              className="blink"
            />
            SYSTEM ONLINE
          </span>
        </div>
      </div>
    </footer>
  );
}

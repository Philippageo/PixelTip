"use client";

interface NavBarProps {
  time: string;
}

export default function NavBar({ time }: NavBarProps) {
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
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "var(--accent)",
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
            className="glow"
          >
            PIXEL<span style={{ color: "var(--text)" }}>TIP</span>
          </span>
          <span
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              fontSize: "0.6rem",
              padding: "1px 6px",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            LIVE
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {["#services", "#portfolio", "#tutor", "#contact"].map((href) => (
            <a
              key={href}
              href={href}
              style={{
                color: "var(--muted)",
                textDecoration: "none",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--muted)")
              }
            >
              {href.replace("#", "")}
            </a>
          ))}
        </nav>

        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "0.7rem",
            color: "var(--muted)",
          }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {time || "-- : -- : --"}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
              }}
              className="blink"
            />
            OPEN FOR WORK
          </span>
        </div>
      </div>
    </header>
  );
}

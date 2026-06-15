"use client";

const items = [
  { label: "GRAPHICS", value: "+∞", positive: true },
  { label: "VIDEO_EDIT", value: "4K", positive: true },
  { label: "3D_RENDER", value: "+7YRS", positive: true },
  { label: "ENG_TUTOR", value: "B2→C1", positive: true },
  { label: "CLIENTS", value: "120+", positive: true },
  { label: "DEADLINE", value: "100%", positive: true },
  { label: "REVISIONS", value: "FREE", positive: true },
  { label: "RESPONSE", value: "<2H", positive: true },
  { label: "RATE", value: "NEGOTIABLE", positive: null },
  { label: "STATUS", value: "AVAILABLE", positive: true },
  { label: "BLENDER", value: "PRO", positive: true },
  { label: "PREMIERE", value: "PRO", positive: true },
  { label: "PHOTOSHOP", value: "PRO", positive: true },
  { label: "AFTER_FX", value: "PRO", positive: true },
  { label: "ILLUSTRATOR", value: "PRO", positive: true },
  { label: "FIGMA", value: "PRO", positive: true },
];

const doubled = [...items, ...items];

export default function TickerTape() {
  return (
    <div
      className="ticker-wrap"
      style={{
        background: "#0a0a0a",
        borderBottom: "1px solid var(--border)",
        padding: "6px 0",
      }}
    >
      <div className="ticker-content">
        {doubled.map((item, i) => (
          <span key={i} style={{ marginRight: "40px", fontSize: "0.72rem" }}>
            <span style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>
              {item.label}
            </span>
            <span style={{ margin: "0 4px", color: "var(--border)" }}>│</span>
            <span
              style={{
                color:
                  item.positive === true
                    ? "var(--green)"
                    : item.positive === false
                    ? "var(--red)"
                    : "var(--text)",
                fontWeight: 600,
              }}
            >
              {item.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

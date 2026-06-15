"use client";

const projects = [
  {
    id: "PRJ-001",
    category: "BRANDING",
    title: "NightOwl Records",
    desc: "Full brand identity for an indie music label — logo, merch, social kit.",
    tags: ["Illustrator", "Photoshop"],
    status: "COMPLETED",
    year: "2024",
  },
  {
    id: "PRJ-002",
    category: "VIDEO",
    title: "TechFlow Promo",
    desc: "60-second product launch video with motion graphics and voiceover.",
    tags: ["Premiere Pro", "After Effects"],
    status: "COMPLETED",
    year: "2024",
  },
  {
    id: "PRJ-003",
    category: "3D",
    title: "Axiom Chair Render",
    desc: "Photorealistic furniture product visualization for e-commerce catalog.",
    tags: ["Blender", "Cycles"],
    status: "COMPLETED",
    year: "2023",
  },
  {
    id: "PRJ-004",
    category: "MOTION",
    title: "Solara — Brand Film",
    desc: "2-minute brand story animation for a wellness startup. Full pipeline.",
    tags: ["After Effects", "Cinema 4D"],
    status: "COMPLETED",
    year: "2023",
  },
  {
    id: "PRJ-005",
    category: "PRINT",
    title: "Atlas Collective",
    desc: "Editorial layout & print production for a quarterly design magazine.",
    tags: ["InDesign", "Illustrator"],
    status: "COMPLETED",
    year: "2024",
  },
  {
    id: "PRJ-006",
    category: "3D / VFX",
    title: "Urban Bloom — VFX",
    desc: "Environmental VFX compositing for a short film. Nature meets city.",
    tags: ["Blender", "DaVinci Resolve"],
    status: "COMPLETED",
    year: "2025",
  },
];

export default function PortfolioPanel() {
  return (
    <section
      id="portfolio"
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          fontSize: "0.7rem",
          color: "var(--muted)",
          letterSpacing: "0.12em",
        }}
      >
        <span style={{ color: "var(--accent)" }}>▶</span>
        PORTFOLIO / SELECTED WORK
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--accent)" }}>120+ PROJECTS TOTAL</span>
      </div>

      {/* Table header */}
      <div
        className="panel"
        style={{
          display: "grid",
          gridTemplateColumns: "80px 100px 1fr 1fr 160px 80px 80px",
          gap: "16px",
          padding: "8px 16px",
          fontSize: "0.6rem",
          color: "var(--muted)",
          letterSpacing: "0.12em",
          marginBottom: "4px",
        }}
      >
        <span>ID</span>
        <span>CATEGORY</span>
        <span>TITLE</span>
        <span>DESCRIPTION</span>
        <span>TAGS</span>
        <span>STATUS</span>
        <span>YEAR</span>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {projects.map((p, i) => (
          <div
            key={p.id}
            className="panel"
            style={{
              display: "grid",
              gridTemplateColumns: "80px 100px 1fr 1fr 160px 80px 80px",
              gap: "16px",
              padding: "12px 16px",
              fontSize: "0.72rem",
              borderLeft: i % 2 === 0 ? "2px solid var(--border)" : "2px solid transparent",
              transition: "border-color 0.2s, background 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderLeftColor = "var(--accent)";
              el.style.background = "rgba(0,184,148,0.04)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderLeftColor = i % 2 === 0 ? "var(--border)" : "transparent";
              el.style.background = "var(--panel)";
            }}
          >
            <span style={{ color: "var(--muted)", fontSize: "0.62rem" }}>{p.id}</span>
            <span className="tag" style={{ alignSelf: "center", fontSize: "0.58rem" }}>
              {p.category}
            </span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.title}</span>
            <span style={{ color: "var(--muted)", fontSize: "0.68rem" }}>{p.desc}</span>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {p.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "0.58rem",
                    padding: "1px 6px",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <span style={{ color: "var(--green)", fontSize: "0.62rem", fontWeight: 600 }}>
              ● {p.status}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.65rem" }}>{p.year}</span>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: "12px",
          fontSize: "0.62rem",
          color: "var(--muted)",
          textAlign: "right",
        }}
      >
        * NDA-protected work excluded. Full portfolio available on request.
      </div>
    </section>
  );
}

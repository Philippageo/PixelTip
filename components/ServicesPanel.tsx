"use client";

const services = [
  {
    code: "SVC-001",
    title: "GRAPHIC DESIGN",
    desc: "Brand identity, print, social media, marketing materials. Vector-sharp, purpose-built.",
    items: ["Logo & Brand", "Posters / Banners", "Social Media Kits", "Print Materials"],
    rate: "FROM $40/hr",
    delivery: "2–5 days",
    positive: true,
  },
  {
    code: "SVC-002",
    title: "VIDEO PRODUCTION",
    desc: "End-to-end video: shooting (remote direction), editing, color grading, sound design.",
    items: ["Reels & Shorts", "Promo Videos", "Color Grading", "Motion Titles"],
    rate: "FROM $55/hr",
    delivery: "3–7 days",
    positive: true,
  },
  {
    code: "SVC-003",
    title: "3D DESIGN & VFX",
    desc: "Product renders, architectural viz, character modeling, animations in Blender / C4D.",
    items: ["Product Renders", "3D Animation", "Environment Design", "VFX Compositing"],
    rate: "FROM $70/hr",
    delivery: "5–14 days",
    positive: true,
  },
];

export default function ServicesPanel() {
  return (
    <section
      id="services"
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
        SERVICES / CATALOG
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--accent)" }}>3 ACTIVE</span>
      </div>

      {/* Services grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {services.map((svc) => (
          <div
            key={svc.code}
            className="panel"
            style={{
              padding: "24px",
              borderTop: "2px solid var(--accent)",
              transition: "border-color 0.2s",
            }}
          >
            {/* Code + rate */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {svc.code}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--green)",
                  fontWeight: 700,
                }}
              >
                {svc.rate}
              </span>
            </div>

            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.08em",
                marginBottom: "12px",
              }}
            >
              {svc.title}
            </h3>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                lineHeight: 1.6,
                marginBottom: "16px",
              }}
            >
              {svc.desc}
            </p>

            {/* Line items */}
            <div style={{ marginBottom: "20px" }}>
              {svc.items.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 0",
                    fontSize: "0.72rem",
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>→</span>
                  {item}
                </div>
              ))}
            </div>

            {/* Delivery */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>DELIVERY</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {svc.delivery}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

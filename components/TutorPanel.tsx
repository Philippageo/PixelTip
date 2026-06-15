"use client";

const levels = [
  { from: "A1–A2", to: "B1", label: "BEGINNER → INTERMEDIATE", delta: "+200%", sessions: "40+ hrs" },
  { from: "B1–B2", to: "C1", label: "INTERMEDIATE → ADVANCED", delta: "+140%", sessions: "30+ hrs" },
  { from: "C1", to: "C2", label: "ADVANCED → MASTERY", delta: "+60%", sessions: "20+ hrs" },
];

const formats = [
  { code: "FMT-A", name: "CONVERSATION CLUB", desc: "Structured speaking sessions with real-life topics, corrections, and vocabulary growth.", price: "$25/session" },
  { code: "FMT-B", name: "EXAM PREP", desc: "IELTS / TOEFL / Cambridge — targeted practice, mock exams, essay feedback.", price: "$35/session" },
  { code: "FMT-C", name: "BUSINESS ENGLISH", desc: "Presentations, emails, negotiations, meetings — corporate fluency accelerator.", price: "$40/session" },
];

export default function TutorPanel() {
  return (
    <section
      id="tutor"
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
        ENGLISH TUTORING / MODULE
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--accent)" }}>ONLINE · ALL TIMEZONES</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Left — level progression */}
        <div className="panel" style={{ padding: "24px" }}>
          <div
            style={{
              fontSize: "0.62rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              marginBottom: "20px",
            }}
          >
            LEVEL_PROGRESSION_CHART
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {levels.map((l) => (
              <div
                key={l.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                  gap: "16px",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                      marginBottom: "4px",
                    }}
                  >
                    {l.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--red)",
                      }}
                    >
                      {l.from}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>→</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--green)",
                      }}
                    >
                      {l.to}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "2px" }}>
                    GAIN
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green)" }}>
                    ▲ {l.delta}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginBottom: "2px" }}>
                    AVG
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text)" }}>{l.sessions}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "rgba(0,184,148,0.06)",
              border: "1px solid rgba(0,184,148,0.2)",
            }}
          >
            <div style={{ fontSize: "0.65rem", color: "var(--accent)", marginBottom: "4px", fontWeight: 600 }}>
              ► PHILIPPA&apos;S METHOD
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.6 }}>
              Immersion-first approach. Real conversation, not grammar drills.
              Custom lesson plans, weekly feedback reports, vocabulary tracking.
              Results guaranteed or lessons refunded.
            </div>
          </div>
        </div>

        {/* Right — formats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {formats.map((f) => (
            <div
              key={f.code}
              className="panel"
              style={{
                padding: "20px 24px",
                borderRight: "2px solid var(--accent)",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
                  {f.code}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 700 }}>
                  {f.price}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                {f.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

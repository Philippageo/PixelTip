"use client";

import { useEffect, useState } from "react";

const stats = [
  { label: "EXPERIENCE", value: "7 YRS", delta: "+7", positive: true },
  { label: "PROJECTS", value: "120+", delta: "+12 YTD", positive: true },
  { label: "CLIENTS", value: "40+", delta: "RETURNING", positive: true },
  { label: "AVG DELIVERY", value: "3 DAYS", delta: "-1 DAY", positive: true },
];

const skills = [
  "ADOBE PHOTOSHOP",
  "PREMIERE PRO",
  "AFTER EFFECTS",
  "BLENDER 3D",
  "ILLUSTRATOR",
  "FIGMA",
  "CINEMA 4D",
  "DAVINCI RESOLVE",
];

export default function HeroPanel() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Hi, I'm Philippa George.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      {/* Section header */}
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
        PROFILE / OVERVIEW
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span>PIXELTIP_v2.0</span>
      </div>

      {/* Split layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Left panel — identity */}
        <div
          className="panel"
          style={{
            padding: "28px 32px",
            borderLeft: "3px solid var(--accent)",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              marginBottom: "16px",
            }}
          >
            CREATIVE_DIRECTOR.EXE
          </div>

          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            {typedText}
            <span className="blink" style={{ color: "var(--accent)" }}>
              _
            </span>
          </h1>

          <div
            style={{
              color: "var(--accent)",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: "24px",
            }}
          >
            FREELANCE DESIGNER · MOTION · 3D · ENGLISH TUTOR
          </div>

          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.82rem",
              lineHeight: 1.7,
              marginBottom: "24px",
              maxWidth: "480px",
            }}
          >
            Seven years in the creative industry. I turn briefs into polished
            visuals — from static graphics and motion video to full 3D
            production. When I&apos;m not rendering, I help students unlock fluent
            English. Precision-driven. Deadline-obsessed. No fluff.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="#contact"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "var(--accent)",
                color: "var(--bg)",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.85")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
            >
              [ HIRE ME ]
            </a>
            <a
              href="#portfolio"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(0,184,148,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              [ VIEW WORK ]
            </a>
          </div>
        </div>

        {/* Right panel — stats + skills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Stats grid */}
          <div
            className="panel"
            style={{
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                fontSize: "0.62rem",
                color: "var(--muted)",
                letterSpacing: "0.12em",
                marginBottom: "16px",
              }}
            >
              PERFORMANCE_METRICS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    borderLeft: "2px solid var(--border)",
                    paddingLeft: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                      marginBottom: "4px",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      lineHeight: 1,
                      marginBottom: "2px",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: s.positive ? "var(--green)" : "var(--red)",
                      fontWeight: 600,
                    }}
                  >
                    ▲ {s.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="panel" style={{ padding: "20px 24px" }}>
            <div
              style={{
                fontSize: "0.62rem",
                color: "var(--muted)",
                letterSpacing: "0.12em",
                marginBottom: "14px",
              }}
            >
              TECH_STACK / TOOLS
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {skills.map((skill) => (
                <span key={skill} className="tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

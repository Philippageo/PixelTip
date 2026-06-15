"use client";

import { useState } from "react";

export default function ContactPanel() {
  const [form, setForm] = useState({ name: "", email: "", service: "GRAPHIC DESIGN", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "10px 12px",
    fontSize: "0.75rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section
      id="contact"
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
        CONTACT / INITIATE_REQUEST
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        <span style={{ color: "var(--green)" }}>● ACCEPTING NEW PROJECTS</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Left — contact info */}
        <div className="panel" style={{ padding: "28px 32px" }}>
          <div
            style={{
              fontSize: "0.62rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              marginBottom: "24px",
            }}
          >
            CONTACT_CHANNELS
          </div>

          {[
            { label: "EMAIL", value: "philippa@pixeltip.studio", icon: "✉" },
            { label: "TELEGRAM", value: "@philippa_design", icon: "✈" },
            { label: "AVAILABILITY", value: "MON–SAT · 09:00–20:00 GMT", icon: "◷" },
            { label: "RESPONSE TIME", value: "< 2 HOURS", icon: "⚡" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--accent)", fontSize: "1rem", width: "20px" }}>
                {c.icon}
              </span>
              <div>
                <div style={{ fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>
                  {c.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text)", fontWeight: 500 }}>
                  {c.value}
                </div>
              </div>
            </div>
          ))}

          {/* Quick stats */}
          <div
            style={{
              marginTop: "24px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { label: "FREE CONSULTATION", value: "30 MIN" },
              { label: "REVISIONS", value: "UNLIMITED*" },
              { label: "PAYMENT", value: "CRYPTO / WIRE" },
              { label: "CONTRACT", value: "ON REQUEST" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "10px",
                  background: "rgba(0,184,148,0.04)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="panel" style={{ padding: "28px 32px" }}>
          <div
            style={{
              fontSize: "0.62rem",
              color: "var(--muted)",
              letterSpacing: "0.12em",
              marginBottom: "24px",
            }}
          >
            SUBMIT_REQUEST_FORM
          </div>

          {sent ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                border: "1px solid var(--accent)",
                background: "rgba(0,184,148,0.06)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✓</div>
              <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "8px" }}>
                REQUEST RECEIVED
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                I&apos;ll get back to you within 2 hours. Stand by.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  NAME
                </label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  SERVICE
                </label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  {["GRAPHIC DESIGN", "VIDEO PRODUCTION", "3D DESIGN & VFX", "ENGLISH TUTORING", "FULL PACKAGE"].map((s) => (
                    <option key={s} value={s} style={{ background: "var(--bg)" }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  MESSAGE
                </label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your project..."
                  required
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  background: "var(--accent)",
                  color: "var(--bg)",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.85")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
              >
                [ SEND REQUEST ]
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

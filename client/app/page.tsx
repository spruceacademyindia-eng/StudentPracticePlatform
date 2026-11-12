import Navbar from "@/components/Navbar";
import { GraduationCap, Zap, FileText, Check, BarChart2, Trophy, Target, Activity, PenLine } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* ── Navigation ── */}
      <Navbar />

      {/* ── Hero Section ── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #eef4fb 0%, #e8f5fb 50%, #e6faf7 100%)",
          padding: "var(--space-3xl) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blob */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,120,183,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,197,162,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="animate-fade-in-up"
            style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}
          >
            <span className="badge badge-teal" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
              <GraduationCap size={14} strokeWidth={1.5} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} /> Academic Typing Platform
            </span>

            <h1
              className="text-h1"
              style={{
                color: "var(--color-secondary)",
                marginBottom: "1.25rem",
              }}
            >
              Build Speed.
              <br />
              <span style={{ color: "var(--color-accent)" }}>
                Build Confidence.
              </span>
            </h1>

            <p
              className="text-body-lead"
              style={{
                color: "var(--color-muted)",
                maxWidth: "540px",
                margin: "0 auto 2rem",
                lineHeight: 1.7,
              }}
            >
              Spruce Academia combines structured typing practice with
              domain-specific content — Healthcare, English Communication, and
              Speed Tests — to help you grow measurably.
            </p>

            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
            >
              <a href="/practice" className="btn btn-primary btn-lg">
                Start Free Practice
              </a>
              <a href="/challenge" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} strokeWidth={1.5} /> Challenge Me
              </a>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div
            className="grid-3 animate-fade-in-up delay-300"
            style={{ marginTop: "var(--space-3xl)", maxWidth: "640px", margin: "3rem auto 0" }}
          >
            {[
              { value: "3", label: "Domains" },
              { value: "2", label: "Practice Modes" },
              { value: "∞", label: "Paragraphs" },
            ].map((stat) => (
              <div key={stat.label} className="wpm-pill">
                <span className="wpm-value">{stat.value}</span>
                <span className="wpm-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modes Section ── */}
      <section id="practice" className="section" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <span className="badge badge-primary" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>
              Practice Modes
            </span>
            <h2 className="text-h2" style={{ color: "var(--color-secondary)" }}>
              Two Ways to Train
            </h2>
          </div>

          <div className="grid-2" style={{ gap: "var(--space-xl)" }}>
            {/* Free Practice Card */}
            <div className="card card-featured" id="mode-free-practice">
              <div className="card-body" style={{ padding: "var(--space-xl)" }}>
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <span
                    style={{
                      fontSize: "2.5rem",
                      display: "block",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <FileText size={40} strokeWidth={1.5} />
                  </span>
                  <h3 className="text-h3" style={{ color: "var(--color-secondary)", marginBottom: "0.5rem" }}>
                    Free Practice
                  </h3>
                  <span className="badge badge-accent">No Time Pressure</span>
                </div>
                <p className="text-body" style={{ color: "var(--color-muted)", marginBottom: "var(--space-lg)", lineHeight: 1.7 }}>
                  Build your baseline typing speed without stress. Complete any
                  paragraph at your own pace and see your actual WPM upon
                  completion. Historical progress is tracked for you and your
                  instructor.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  {[
                    "Calculates WPM after completion",
                    "No automated failure triggers",
                    "Domain-filtered paragraph selection",
                    "Historical WPM metrics",
                  ].map((f) => (
                    <li key={f} className="text-body" style={{ color: "var(--color-text)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={14} strokeWidth={2} style={{ color: 'var(--color-accent2)', flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <a href="/practice" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                  Start Practice
                </a>
              </div>
            </div>

            {/* Challenge Me Card */}
            <div
              className="card card-featured"
              id="mode-challenge"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%)",
                color: "#ffffff",
              }}
            >
              <div className="card-body" style={{ padding: "var(--space-xl)" }}>
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <span
                    style={{
                      fontSize: "2.5rem",
                      display: "block",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <Zap size={40} strokeWidth={1.5} />
                  </span>
                  <h3 className="text-h3" style={{ color: "#ffffff", marginBottom: "0.5rem" }}>
                    Challenge Me
                  </h3>
                  <span
                    className="badge"
                    style={{ backgroundColor: "rgba(249,248,113,0.25)", color: "var(--color-accent4)" }}
                  >
                    Timed &amp; Graded
                  </span>
                </div>
                <p className="text-body" style={{ color: "rgba(255,255,255,0.85)", marginBottom: "var(--space-lg)", lineHeight: 1.7 }}>
                  Race against an auto-calculated timer based on your target WPM.
                  Get an explicit Pass or Fail result based on both speed and
                  accuracy. Push your limits with custom benchmarks.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  {[
                    { icon: <BarChart2 size={14} strokeWidth={2} />, text: "Real-time visual timer" },
                    { icon: <Trophy size={14} strokeWidth={2} />, text: "Pass / Fail status" },
                    { icon: <Target size={14} strokeWidth={2} />, text: "Custom WPM benchmarks" },
                  ].map((f) => (
                    <li key={f.text} className="text-body" style={{ color: "rgba(255,255,255,0.9)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ flexShrink: 0 }}>{f.icon}</span> {f.text}
                    </li>
                  ))}
                </ul>
                <a
                  href="/challenge"
                  className="btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    color: "var(--color-secondary)",
                    borderColor: "#ffffff",
                  }}
                >
                  Take the Challenge
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Domains Section ── */}
      <section id="domains" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <span className="badge badge-teal" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>
              Content Categories
            </span>
            <h2 className="text-h2" style={{ color: "var(--color-secondary)" }}>
              Domain-Specific Content
            </h2>
            <p className="text-body-lead" style={{ color: "var(--color-muted)", marginTop: "0.75rem" }}>
              Practice with content tailored to your professional focus.
            </p>
          </div>

          <div className="grid-3">
            {/* Healthcare */}
            <div className="card card-featured" id="domain-healthcare">
              <div
                style={{
                  height: "6px",
                  background: "linear-gradient(90deg, var(--color-accent1), var(--color-accent))",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }}
              />
              <div className="card-body" style={{ padding: "var(--space-lg)" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }}><Activity size={36} strokeWidth={1.5} /></span>
                <span className="domain-pill domain-pill-healthcare" style={{ marginBottom: "0.75rem" }}>
                  Healthcare
                </span>
                <h3 className="text-h3" style={{ color: "var(--color-secondary)", margin: "0.75rem 0 0.5rem" }}>
                  Clinical Documents
                </h3>
                <p className="text-body" style={{ color: "var(--color-muted)", marginBottom: "var(--space-md)", lineHeight: 1.7 }}>
                  Discharge summaries, clinical reports, and structured medical
                  notes designed for healthcare documentation training.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className="badge badge-teal">300–1,000 words</span>
                  <span className="badge badge-accent">Word Count Limit</span>
                </div>
              </div>
            </div>

            {/* English Communication */}
            <div className="card card-featured" id="domain-english">
              <div
                style={{
                  height: "6px",
                  background: "linear-gradient(90deg, var(--color-secondary), var(--color-accent))",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }}
              />
              <div className="card-body" style={{ padding: "var(--space-lg)" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }}><PenLine size={36} strokeWidth={1.5} /></span>
                <span className="domain-pill domain-pill-english" style={{ marginBottom: "0.75rem" }}>
                  English
                </span>
                <h3 className="text-h3" style={{ color: "var(--color-secondary)", margin: "0.75rem 0 0.5rem" }}>
                  Communication
                </h3>
                <p className="text-body" style={{ color: "var(--color-muted)", marginBottom: "var(--space-md)", lineHeight: 1.7 }}>
                  Essays, business correspondence, and communication drills for
                  general and professional English proficiency.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className="badge badge-primary">200–800 words</span>
                  <span className="badge badge-accent">General & Professional</span>
                </div>
              </div>
            </div>

            {/* Speed Tests */}
            <div className="card card-featured" id="domain-speed">
              <div
                style={{
                  height: "6px",
                  background: "linear-gradient(90deg, var(--color-accent2), var(--color-accent3))",
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }}
              />
              <div className="card-body" style={{ padding: "var(--space-lg)" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.75rem" }}><Zap size={36} strokeWidth={1.5} /></span>
                <span className="domain-pill domain-pill-speed" style={{ marginBottom: "0.75rem" }}>
                  Speed Tests
                </span>
                <h3 className="text-h3" style={{ color: "var(--color-secondary)", margin: "0.75rem 0 0.5rem" }}>
                  Timed Assessments
                </h3>
                <p className="text-body" style={{ color: "var(--color-muted)", marginBottom: "var(--space-md)", lineHeight: 1.7 }}>
                  Standardized text blocks mapped to specific WPM thresholds for
                  formal timed assessment tasks.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className="badge badge-success">Fixed ~500 words</span>
                  <span className="badge badge-teal">WPM Mapped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <footer
        style={{
          backgroundColor: "var(--color-extra)",
          color: "rgba(255,255,255,0.6)",
          padding: "var(--space-xl) 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <img
              src="/spruce_logo_dark.png"
              alt="Spruce Academia Logo"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
            <p className="text-body-lead" style={{ color: "#ffffff", fontWeight: 700, margin: 0 }}>
              Spruce<span style={{ color: "var(--color-accent1)" }}>Academia</span>
            </p>
          </div>
          <p className="text-body" style={{ marginBottom: "var(--space-sm)" }}>
            Typing Practice Platform — Healthcare · English · Speed Tests
          </p>
          <p className="text-caption" style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
            © {new Date().getFullYear()} Spruce Academia. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

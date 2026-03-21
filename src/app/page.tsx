"use client";
import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
//  AttendMate — Premium Landing Page
// ─────────────────────────────────────────────

const FEATURES = [
  {
    icon: "✓",
    title: "One-Click Attendance",
    desc: "Mark your attendance in under 10 seconds. Track present, absent, and everything in between.",
    color: "#00E5A0",
  },
  {
    icon: "📊",
    title: "Live Analytics",
    desc: "Real-time charts showing attendance trends, subject-wise breakdowns, and performance tracking.",
    color: "#3B9EFF",
  },
  {
    icon: "🤖",
    title: "AI Copilot",
    desc: "Ask the AI how many classes you can safely skip, or let it mark your attendance by voice command.",
    color: "#A78BFA",
  },
  {
    icon: "👥",
    title: "Friends Tracking",
    desc: "Add friends and see their attendance status in real-time. Know who made it to the 8 AM lecture.",
    color: "#FBBF24",
  },
  {
    icon: "🔐",
    title: "Cloud Sync",
    desc: "Your data is securely saved to Firebase and synced instantly across all your devices.",
    color: "#34D399",
  },
  {
    icon: "📅",
    title: "Smart Timetable",
    desc: "Set up your weekly schedule once. Auto-detect active lectures and get prompted to mark attendance.",
    color: "#FF6B6B",
  },
];

const STATS = [
  { value: "< 10s", label: "to mark attendance" },
  { value: "100%", label: "cloud-synced, always" },
  { value: "AI", label: "powered predictions" },
  { value: "0", label: "papers needed" },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  return (
    <div style={styles.root}>
      {/* ── Cursor glow ── */}
      <div
        style={{
          ...styles.cursorGlow,
          left: mousePos.x - 200,
          top: mousePos.y - 200,
        }}
      />

      {/* ── NAV ── */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <span style={styles.logo}>
            <span style={styles.logoDot}>●</span> AttendMate
          </span>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#how" style={styles.navLink}>How it works</a>
            <a
              href="/login"
              style={styles.navCta}
            >
              Open App →
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={styles.hero}>
        <div style={styles.heroBadge} className="hero-badge">
          🎓 Smart Attendance Tracker for Students
        </div>
        <h1 style={styles.heroTitle} className="hero-title">
          Attendance,{" "}
          <span style={styles.heroGradient}>finally smart.</span>
        </h1>
        <p style={styles.heroSub} className="hero-sub">
          AttendMate replaces guesswork with a real-time, AI-powered
          system. Know your exact attendance percentage, predict how many
          classes you can safely skip, and track friends — all in one place.
        </p>
        <div style={styles.heroCtas} className="hero-ctas">
          <a href="/login" style={styles.ctaPrimary}>
            Get Started Free
          </a>
          <a href="/register" style={styles.ctaSecondary}>
            Create Account ↗
          </a>
        </div>

        {/* Mock dashboard card */}
        <div style={styles.mockCard} className="mock-card">
          <div style={styles.mockHeader}>
            <div style={styles.mockDot} />
            <div style={{ ...styles.mockDot, background: "#FBBF24" }} />
            <div style={{ ...styles.mockDot, background: "#34D399" }} />
            <span style={styles.mockTitle}>Dashboard — Your Subjects · Today</span>
          </div>
          <div style={styles.mockBody}>
            {[
              { name: "Mathematics", pct: "82%", safe: true },
              { name: "Data Structures", pct: "76%", safe: true },
              { name: "Operating Systems", pct: "68%", safe: false },
              { name: "Computer Networks", pct: "91%", safe: true },
              { name: "Database Systems", pct: "73%", safe: false },
            ].map((sub) => (
              <div key={sub.name} style={styles.mockRow}>
                <div style={styles.mockAvatar}>
                  {sub.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span style={styles.mockName}>{sub.name}</span>
                <span
                  style={{
                    ...styles.mockStatus,
                    background: sub.safe
                      ? "rgba(0,229,160,0.15)"
                      : "rgba(255,107,107,0.15)",
                    color: sub.safe ? "#00E5A0" : "#FF6B6B",
                  }}
                >
                  {sub.pct}
                </span>
              </div>
            ))}
          </div>
          <div style={styles.mockFooter}>
            <span style={styles.mockStat}>78% Overall</span>
            <span style={styles.mockStat}>3 classes today</span>
            <span style={{ ...styles.mockStat, color: "#A78BFA" }}>
              🤖 AI: can skip 2 classes
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={styles.statsSection}>
        {STATS.map((s) => (
          <div key={s.label} style={styles.statItem}>
            <span style={styles.statValue}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={styles.featSection}>
        <p style={styles.sectionTag}>FEATURES</p>
        <h2 style={styles.sectionTitle}>
          Everything you need to stay above 75%.
        </h2>
        <div style={styles.featGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.featCard} className="feat-card">
              <span style={{ ...styles.featIcon, color: f.color }}>{f.icon}</span>
              <h3 style={styles.featTitle}>{f.title}</h3>
              <p style={styles.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={styles.howSection}>
        <p style={{ ...styles.sectionTag, maxWidth: 1100, margin: "0 auto 14px", padding: "0 24px" }}>HOW IT WORKS</p>
        <h2 style={{ ...styles.sectionTitle, maxWidth: 1100, margin: "0 auto 52px", padding: "0 24px" }}>Up and running in 3 steps.</h2>
        <div style={styles.howSteps}>
          {[
            {
              n: "01",
              title: "Sign In",
              desc: "Login with your Google account or email. Set up your subjects and timetable in minutes.",
            },
            {
              n: "02",
              title: "Mark Attendance",
              desc: "When a class starts, you get prompted automatically. Tap Present or Absent — it's that simple.",
            },
            {
              n: "03",
              title: "Get AI Insights",
              desc: "View real-time analytics, ask the AI copilot how many classes you can skip, and track friends.",
            },
          ].map((step) => (
            <div key={step.n} style={styles.howCard} className="how-card">
              <span style={styles.howNumber}>{step.n}</span>
              <h3 style={styles.howTitle}>{step.title}</h3>
              <p style={styles.howDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={styles.techSection}>
        <p style={styles.sectionTag}>BUILT WITH</p>
        <div style={styles.techPills}>
          {[
            "Next.js",
            "React",
            "TypeScript",
            "Firebase",
            "Gemini AI",
            "Tailwind CSS",
            "MUI",
            "Framer Motion",
            "Vercel",
          ].map((t) => (
            <span key={t} style={styles.techPill} className="tech-pill">{t}</span>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>
          Ready to take control of your semester?
        </h2>
        <a href="/login" style={styles.ctaBig}>
          Start Tracking Free →
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <span>© 2026 AttendMate · Built by Kishan Pokal</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/login" style={styles.footerLink}>Sign In</a>
          <a href="/register" style={styles.footerLink}>Register</a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080C14; }
        a { text-decoration: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .hero-badge { animation: fadeUp 0.6s ease both; }
        .hero-title { animation: fadeUp 0.7s 0.1s ease both; }
        .hero-sub   { animation: fadeUp 0.7s 0.2s ease both; }
        .hero-ctas  { animation: fadeUp 0.7s 0.3s ease both; }
        .mock-card  { animation: fadeUp 0.8s 0.5s ease both, float 6s 2s ease-in-out infinite; }

        .feat-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.12) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .how-card:hover { transform: translateY(-4px); }
        .tech-pill:hover { background: rgba(255,255,255,0.12) !important; }

        @media (max-width: 768px) {
          nav .nav-links-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#080C14",
    color: "#E8EDF5",
    minHeight: "100vh",
    overflowX: "hidden",
    position: "relative",
  },
  cursorGlow: {
    position: "fixed",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(59,158,255,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
    transition: "left 0.1s, top 0.1s",
  },

  // Nav
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "20px 0",
    transition: "all 0.3s ease",
  },
  navScrolled: {
    background: "rgba(8,12,20,0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "14px 0",
  },
  navInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  logoDot: {
    color: "#00E5A0",
    marginRight: 4,
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  navLink: {
    color: "rgba(232,237,245,0.6)",
    fontSize: 15,
    fontWeight: 400,
    transition: "color 0.2s",
  },
  navCta: {
    background: "#fff",
    color: "#080C14",
    padding: "8px 18px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    transition: "opacity 0.2s",
  },

  // Hero
  hero: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "160px 24px 80px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(59,158,255,0.1)",
    border: "1px solid rgba(59,158,255,0.25)",
    color: "#3B9EFF",
    padding: "6px 16px",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 28,
    letterSpacing: "0.3px",
  },
  heroTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(42px, 7vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "-2px",
    color: "#fff",
    marginBottom: 20,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #00E5A0 0%, #3B9EFF 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 1.7,
    color: "rgba(232,237,245,0.6)",
    maxWidth: 540,
    margin: "0 auto 36px",
    fontWeight: 300,
  },
  heroCtas: {
    display: "flex",
    gap: 14,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 60,
  },
  ctaPrimary: {
    background: "linear-gradient(135deg, #00E5A0, #3B9EFF)",
    color: "#080C14",
    padding: "14px 28px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 16,
  },
  ctaSecondary: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#E8EDF5",
    padding: "14px 28px",
    borderRadius: 10,
    fontWeight: 500,
    fontSize: 16,
  },

  // Mock card
  mockCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: 560,
    margin: "0 auto",
    backdropFilter: "blur(8px)",
  },
  mockHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },
  mockDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#FF6B6B",
  },
  mockTitle: {
    marginLeft: 8,
    fontSize: 13,
    color: "rgba(232,237,245,0.4)",
    fontWeight: 400,
  },
  mockBody: {
    padding: "8px 0",
  },
  mockRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  mockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(232,237,245,0.6)",
    flexShrink: 0,
  },
  mockName: {
    flex: 1,
    fontSize: 14,
    color: "rgba(232,237,245,0.85)",
    textAlign: "left",
  },
  mockStatus: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 6,
  },
  mockFooter: {
    display: "flex",
    gap: 20,
    padding: "12px 20px",
    background: "rgba(255,255,255,0.02)",
    flexWrap: "wrap",
  },
  mockStat: {
    fontSize: 12,
    color: "rgba(232,237,245,0.45)",
    fontWeight: 500,
  },

  // Stats
  statsSection: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "1px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    position: "relative",
    zIndex: 1,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 60px",
    gap: 6,
  },
  statValue: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 36,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-1px",
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(232,237,245,0.45)",
    fontWeight: 400,
  },

  // Features
  featSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "100px 24px",
    position: "relative",
    zIndex: 1,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "2px",
    color: "#00E5A0",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-1px",
    marginBottom: 52,
    maxWidth: 600,
    lineHeight: 1.15,
  },
  featGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  featCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "28px 24px",
    transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease",
    cursor: "default",
  },
  featIcon: {
    fontSize: 28,
    display: "block",
    marginBottom: 14,
  },
  featTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 8,
  },
  featDesc: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(232,237,245,0.55)",
    fontWeight: 300,
  },

  // How it works
  howSection: {
    background: "rgba(255,255,255,0.02)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "100px 24px",
    position: "relative",
    zIndex: 1,
  },
  howSteps: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 24,
    maxWidth: 1100,
    margin: "0 auto",
  },
  howCard: {
    padding: "32px 28px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    transition: "transform 0.2s ease",
    cursor: "default",
  },
  howNumber: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 48,
    fontWeight: 800,
    color: "rgba(255,255,255,0.06)",
    display: "block",
    marginBottom: 12,
    lineHeight: 1,
  },
  howTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 10,
  },
  howDesc: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(232,237,245,0.55)",
    fontWeight: 300,
  },

  // Tech stack
  techSection: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "80px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  techPills: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
  },
  techPill: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(232,237,245,0.7)",
    padding: "8px 18px",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    transition: "background 0.2s",
    cursor: "default",
  },

  // CTA section
  ctaSection: {
    textAlign: "center",
    padding: "100px 24px",
    background:
      "radial-gradient(ellipse at center, rgba(0,229,160,0.06) 0%, transparent 70%)",
    position: "relative",
    zIndex: 1,
  },
  ctaTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(28px, 5vw, 52px)",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-1.5px",
    marginBottom: 36,
  },
  ctaBig: {
    display: "inline-block",
    background: "linear-gradient(135deg, #00E5A0, #3B9EFF)",
    color: "#080C14",
    padding: "16px 36px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 18,
  },

  // Footer
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    padding: "28px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: 1100,
    margin: "0 auto",
    fontSize: 13,
    color: "rgba(232,237,245,0.35)",
    flexWrap: "wrap",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  footerLink: {
    color: "rgba(232,237,245,0.35)",
    transition: "color 0.2s",
  },
};
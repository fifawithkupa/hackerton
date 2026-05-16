// PAINPOINT — shared UI atoms (window-globals)

// ───────────────────────── Wordmark
function Wordmark({ size = 18, withDot = true }) {
  return (
    <a href="#" className="pp-wordmark" style={{ fontSize: size }}>
      {withDot && <span className="dot" />}
      PAINPOINT
    </a>);

}

// ───────────────────────── TopNav
function TopNav({ onHome }) {
  const links = ["탐색", "내 리포트", "트렌드", "가격", "API"];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      height: 64,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--pp-line)",
      display: "flex", alignItems: "center",
      padding: "0 40px", gap: 28
    }}>
      <div onClick={onHome} style={{ cursor: "pointer" }}>
        <Wordmark />
      </div>
      <span style={{
        font: "700 10px/1 var(--font-base)",
        letterSpacing: "0.08em",
        color: "var(--pp-pain)",
        background: "var(--pp-pain-bg)",
        padding: "4px 7px", borderRadius: 6,
        marginLeft: -16
      }}>BETA</span>
      <nav style={{ display: "flex", gap: 24, marginLeft: 12 }}>
        {links.map((l, i) =>
        <a key={l} href="#" style={{
          font: "600 14px/1 var(--font-base)",
          letterSpacing: "0.005em",
          color: i === 0 ? "var(--pp-ink)" : "var(--pp-ink-soft)",
          textDecoration: "none"
        }}>{l}</a>
        )}
      </nav>
      <div style={{ flex: 1 }} />
      <span style={{
        font: "600 12px/1 var(--font-base)",
        color: "var(--pp-ink-dim)",
        display: "inline-flex", alignItems: "center", gap: 6
      }}>
        <span style={{
          display: "inline-block", width: 6, height: 6, borderRadius: 9999,
          background: "var(--pp-positive)"
        }} />
        오늘 수집 <span className="tnum" style={{ color: "var(--pp-ink)", fontWeight: 700 }}>1,284,392</span>건
      </span>
      <a href="#" style={{
        font: "500 14px/1 var(--font-base)", color: "var(--pp-ink-soft)", textDecoration: "none"
      }}>로그인</a>
      <button className="pp-btn" data-variant="primary" data-size="sm" style={{ height: 36 }}>
        무료로 시작
      </button>
    </header>);

}

// ───────────────────────── Footer
function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--pp-line)",
      padding: "32px 40px",
      display: "flex", alignItems: "center", gap: 24,
      color: "var(--pp-ink-dim)",
      font: "500 12px/1.6 var(--font-base)"
    }}>
      <Wordmark size={14} />
      <span>© 2025 SSATIS Lab. 실제 불만 기반 창업 아이디어 발굴 플랫폼.</span>
      <div style={{ flex: 1 }} />
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>이용약관</a>
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>개인정보처리방침</a>
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>문의</a>
    </footer>);

}

// ───────────────────────── Source icon (tiny abstract glyph per source)
function SourceGlyph({ id, size = 14 }) {
  const palette = {
    reddit: "#FF5C1F",
    blind: "#0066FF",
    twitter: "#171719",
    cafe: "#00BF40",
    youtube: "#FF4242",
    ph: "#FF9C00"
  };
  const color = palette[id] || "var(--pp-ink-soft)";
  return (
    <span style={{
      width: size, height: size, borderRadius: 4,
      background: color, display: "inline-block",
      flexShrink: 0
    }} />);

}

// ───────────────────────── Verdict badge
function VerdictBadge({ verdict, tone, size = "md" }) {
  const icon = { 블루오션: "◎", "틈새 존재": "◐", 레드오션: "●" }[verdict] || "●";
  const big = size === "lg";
  return (
    <span className="pp-pill" data-tone={tone} style={{
      height: big ? 32 : 26,
      padding: big ? "0 14px" : "0 10px",
      fontSize: big ? 14 : 12
    }}>
      <span style={{ fontSize: big ? 16 : 14 }}>{icon}</span>
      {verdict}
    </span>);

}

// ───────────────────────── Severity bar (3 segments)
function Severity({ level }) {
  return (
    <span className="sev" data-level={level}>
      <i /><i /><i />
    </span>);

}

// ───────────────────────── Stat block
function Stat({ label, value, suffix, tone }) {
  return (
    <div>
      <div style={{
        font: "500 11px/1.4 var(--font-base)",
        letterSpacing: "0.02em",
        color: "var(--pp-ink-dim)",
        textTransform: "uppercase",
        marginBottom: 4
      }}>{label}</div>
      <div className="tnum" style={{
        font: "700 22px/1.2 var(--font-display)",
        letterSpacing: "-0.015em",
        color: tone || "var(--pp-ink)"
      }}>
        {value}
        {suffix && <span style={{
          font: "600 12px/1 var(--font-base)",
          color: "var(--pp-ink-soft)", marginLeft: 4
        }}>{suffix}</span>}
      </div>
    </div>);

}

// Expose
Object.assign(window, {
  Wordmark, TopNav, Footer,
  SourceGlyph, VerdictBadge, Severity, Stat
});
// SSATIS — shared UI atoms (window-globals)

// ───────────────────────── Toast system
const _toastListeners = [];
function showToast(msg, type = "default") {
  _toastListeners.forEach(fn => fn(msg, type));
}
window.showToast = showToast;

function ToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const fn = (msg, type) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
    };
    _toastListeners.push(fn);
    return () => { const i = _toastListeners.indexOf(fn); if (i >= 0) _toastListeners.splice(i, 1); };
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 20px", borderRadius: 12,
          background: t.type === "error" ? "#ff4242" : t.type === "success" ? "#00bf40" : "var(--color-label-strong)",
          color: "#fff",
          font: "600 14px/1.4 var(--font-base)",
          boxShadow: "0 8px 24px rgba(23,23,25,0.2)",
          animation: "fade 200ms ease-out both",
          pointerEvents: "auto",
          whiteSpace: "nowrap",
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ───────────────────────── Wordmark
function Wordmark({ size = 18, withDot = true }) {
  return (
    <a href="#" className="pp-wordmark" style={{ fontSize: size }}>
      {withDot && <span className="dot" />}
      SSATIS
    </a>
  );
}

// ───────────────────────── TopNav
function TopNav({ route, onNav, user }) {
  const links = [
    { id: "landing",   label: "탐색" },
    { id: "dashboard", label: "내 리포트", auth: true },
    { id: "trends",    label: "트렌드" },
    { id: "pricing",   label: "가격" },
  ];
  const [open, setOpen] = React.useState(false);
  const visibleLinks = links.filter(l => !l.auth || user);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      height: 64,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--pp-line)",
      display: "flex", alignItems: "center",
      padding: "0 40px", gap: 28,
    }}>
      <div onClick={() => onNav("landing")} style={{ cursor: "pointer" }}>
        <Wordmark />
      </div>
      <nav style={{ display: "flex", gap: 24, marginLeft: 12 }}>
        {visibleLinks.map(l => (
          <button key={l.id} onClick={() => onNav(l.id)} style={{
            all: "unset", cursor: "pointer",
            font: "600 14px/1 var(--font-base)",
            letterSpacing: "0.005em",
            color: route === l.id ? "var(--pp-ink)" : "var(--pp-ink-soft)",
            borderBottom: route === l.id ? "2px solid var(--pp-ink)" : "2px solid transparent",
            paddingBottom: 2,
            transition: "color 150ms ease-out",
          }}>{l.label}</button>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <span style={{
        font: "600 12px/1 var(--font-base)",
        color: "var(--pp-ink-dim)",
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        <span style={{
          display: "inline-block", width: 6, height: 6, borderRadius: 9999,
          background: "var(--pp-positive)",
          animation: "pulse 2s ease-out infinite",
        }} />
        오늘 수집 <span className="tnum" style={{ color: "var(--pp-ink)", fontWeight: 700 }}>1,284,392</span>건
      </span>

      {!user && (
        <>
          <button onClick={() => onNav("login")} style={{
            all: "unset", cursor: "pointer",
            font: "500 14px/1 var(--font-base)", color: "var(--pp-ink-soft)",
          }}>로그인</button>
          <button className="pp-btn" data-variant="primary" data-size="sm"
                  onClick={() => onNav("login")} style={{ height: 36 }}>
            무료로 시작
          </button>
        </>
      )}

      {user && (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button onClick={() => setOpen(o => !o)} style={{
            all: "unset", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "4px 10px 4px 4px",
            border: "1px solid var(--pp-line)",
            borderRadius: 9999,
            transition: "background 150ms ease-out",
            background: open ? "var(--color-fill-alternative)" : "transparent",
          }}>
            <Avatar name={user.name} src={user.avatar} size={28} />
            <span style={{
              font: "600 13px/1 var(--font-base)",
              color: "var(--pp-ink)",
            }}>{user.name}</span>
            <span style={{
              font: "700 9px/1 var(--font-base)",
              letterSpacing: "0.06em",
              color: user.plan === "Free" ? "var(--pp-ink-dim)" : "var(--pp-pain)",
              background: user.plan === "Free" ? "var(--color-fill-alternative)" : "var(--pp-pain-bg)",
              padding: "4px 6px", borderRadius: 6,
            }}>{user.plan.toUpperCase()}</span>
          </button>
          {open && (
            <UserMenu onNav={(r) => { setOpen(false); onNav(r); }} user={user} />
          )}
        </div>
      )}
    </header>
  );
}

function UserMenu({ onNav, user }) {
  const items = [
    { label: "내 리포트",       route: "dashboard" },
    { label: "저장된 아이디어", route: "ideas-saved" },
    { label: "계정·결제",       route: "account" },
    { divider: true },
    { label: "로그아웃",        route: "logout", danger: true },
  ];
  return (
    <div style={{
      position: "absolute", right: 0, top: "calc(100% + 8px)",
      width: 240,
      background: "#fff",
      border: "1px solid var(--pp-line)",
      borderRadius: 12,
      boxShadow: "0 12px 36px rgba(23,23,25,0.10)",
      overflow: "hidden",
      zIndex: 60,
      animation: "fade 150ms ease-out both",
    }}>
      <div style={{
        padding: "14px 16px",
        background: "var(--pp-surface-soft)",
        borderBottom: "1px solid var(--pp-line)",
      }}>
        <div style={{ font: "700 14px/1.3 var(--font-base)", color: "var(--pp-ink)" }}>{user.name}</div>
        <div style={{ font: "500 12px/1.3 var(--font-base)", color: "var(--pp-ink-soft)" }}>{user.email}</div>
      </div>
      {items.map((it, i) => it.divider ? (
        <div key={i} style={{ height: 1, background: "var(--pp-line)" }} />
      ) : (
        <button key={it.label} onClick={() => onNav(it.route)} style={{
          all: "unset", cursor: "pointer", display: "block", width: "100%",
          padding: "10px 16px",
          font: "500 13px/1 var(--font-base)",
          color: it.danger ? "var(--pp-neg)" : "var(--pp-ink)",
          boxSizing: "border-box",
          transition: "background 100ms ease-out",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--color-fill-alternative)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────── Avatar
function Avatar({ name = "U", src, size = 32 }) {
  const initial = (name || "U").trim()[0].toUpperCase();
  return (
    <span style={{
      width: size, height: size, borderRadius: 9999,
      background: "linear-gradient(135deg,#0066FF 0%,#6541F2 100%)",
      color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      font: `700 ${Math.round(size * 0.42)}px/1 var(--font-display)`,
      flexShrink: 0,
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundSize: "cover",
    }}>{src ? "" : initial}</span>
  );
}

// ───────────────────────── Footer
function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--pp-line)",
      padding: "32px 40px",
      display: "flex", alignItems: "center", gap: 24,
      color: "var(--pp-ink-dim)",
      font: "500 12px/1.6 var(--font-base)",
    }}>
      <Wordmark size={14} />
      <span>© 2025 SSATIS Lab. 실제 불만 기반 창업 아이디어 발굴 플랫폼.</span>
      <div style={{ flex: 1 }} />
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>이용약관</a>
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>개인정보처리방침</a>
      <a href="#" style={{ textDecoration: "none", color: "inherit" }}>문의</a>
    </footer>
  );
}

// ───────────────────────── Source brand logos
const SOURCE_BRAND = {
  reddit:     { bg: "#FF4500",                     name: "레딧" },
  naver:      { bg: "#03C75A",                     name: "네이버" },
  appstore:   { bg: "linear-gradient(180deg,#1FB0FF 0%,#0080FF 100%)", name: "App Store" },
  playstore:  { bg: "#FFFFFF", border: true,       name: "Google Play" },
  youtube:    { bg: "#FF0000",                     name: "유튜브 댓글" },
  trustpilot: { bg: "#00B67A",                     name: "Trustpilot" },
  hackernews: { bg: "#FF6600",                     name: "Hacker News" },
};

function SourceGlyph({ id, size = 16, square = false }) {
  const brand = SOURCE_BRAND[id];
  if (!brand) return null;
  const s = size;
  const radius = square ? Math.max(2, s * 0.2) : "50%";
  return (
    <span style={{
      width: s, height: s, borderRadius: radius,
      background: brand.bg,
      border: brand.border ? "1px solid var(--pp-line)" : "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden",
      boxSizing: "border-box",
    }} aria-label={brand.name}>
      <BrandMark id={id} size={s * 0.72} />
    </span>
  );
}

function BrandMark({ id, size = 12 }) {
  const s = size;
  if (id === "reddit") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M22 12.1c0-1.2-1-2.2-2.2-2.2-.6 0-1.1.2-1.5.6-1.5-1-3.6-1.7-5.9-1.8l1-4.7 3.3.7c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5c-.6 0-1.1.3-1.3.9l-3.7-.8c-.2 0-.4.1-.4.3l-1.1 5.2c-2.3.1-4.3.7-5.9 1.8-.4-.4-.9-.6-1.5-.6C2 9.9 1 10.9 1 12.1c0 .9.5 1.6 1.3 2-.1.3-.1.7-.1 1 0 3.4 4 6.2 8.8 6.2s8.8-2.8 8.8-6.2c0-.3 0-.7-.1-1 .8-.4 1.3-1.1 1.3-2zM7 13.6c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5S7 14.4 7 13.6zm8.4 4c-1 .9-2.4 1.4-3.9 1.4s-2.9-.5-3.9-1.4c-.2-.2-.2-.5 0-.7s.5-.2.7 0c.8.7 1.9 1.1 3.2 1.1s2.4-.4 3.2-1.1c.2-.2.5-.2.7 0s.2.5 0 .7zm.1-2.6c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
      </svg>
    );
  }
  if (id === "naver") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M6 4h4.4l3.2 6.4V4H18v16h-4.4l-3.2-6.4V20H6V4z" />
      </svg>
    );
  }
  if (id === "appstore") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M17.05 12.5c-.03-2.4 1.97-3.55 2.06-3.61-1.13-1.66-2.88-1.88-3.5-1.91-1.48-.15-2.9.87-3.65.87-.76 0-1.91-.85-3.15-.83-1.62.02-3.13.95-3.97 2.4-1.7 2.94-.43 7.3 1.22 9.69.8 1.18 1.76 2.49 3.02 2.44 1.21-.05 1.67-.78 3.14-.78s1.88.78 3.17.76c1.31-.02 2.13-1.19 2.93-2.37.92-1.37 1.3-2.7 1.32-2.77-.03-.01-2.53-.97-2.56-3.86zM14.65 5.16c.66-.81 1.11-1.93.99-3.05-.96.04-2.12.64-2.81 1.44-.61.71-1.16 1.86-1.01 2.95 1.07.08 2.17-.55 2.83-1.34z" />
      </svg>
    );
  }
  if (id === "playstore") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="5,3 12,12 5,21"    fill="#4285F4" />
        <polygon points="5,3 20,12 12,12"   fill="#34A853" />
        <polygon points="5,21 12,12 20,12"  fill="#EA4335" />
      </svg>
    );
  }
  if (id === "youtube") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5L8 5.5z" />
      </svg>
    );
  }
  if (id === "trustpilot") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <polygon points="12,3 14.65,9.5 22,9.5 16.18,13.5 18.32,20.5 12,16.27 5.68,20.5 7.82,13.5 2,9.5 9.35,9.5" />
      </svg>
    );
  }
  if (id === "hackernews") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M6 4 L10.6 12.4 L10.6 20 L13.4 20 L13.4 12.4 L18 4 L15 4 L12 9.6 L9 4 Z" />
      </svg>
    );
  }
  return null;
}

// ───────────────────────── Verdict badge
function VerdictBadge({ verdict, tone, size = "md" }) {
  const icon = { 블루오션: "◎", "틈새 존재": "◐", 레드오션: "●" }[verdict] || "●";
  const big = size === "lg";
  return (
    <span className="pp-pill" data-tone={tone} style={{
      height: big ? 32 : 26,
      padding: big ? "0 14px" : "0 10px",
      fontSize: big ? 14 : 12,
    }}>
      <span style={{ fontSize: big ? 16 : 14 }}>{icon}</span>
      {verdict}
    </span>
  );
}

// ───────────────────────── Severity bar (3 segments)
function Severity({ level }) {
  return (
    <span className="sev" data-level={level}>
      <i /><i /><i />
    </span>
  );
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
        marginBottom: 4,
      }}>{label}</div>
      <div className="tnum" style={{
        font: "700 22px/1.2 var(--font-display)",
        letterSpacing: "-0.015em",
        color: tone || "var(--pp-ink)",
      }}>
        {value}
        {suffix && <span style={{
          font: "600 12px/1 var(--font-base)",
          color: "var(--pp-ink-soft)", marginLeft: 4,
        }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ───────────────────────── Count-up hook
function useCountUp(target, duration = 1200) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const num = parseInt(String(target).replace(/[^0-9]/g, ""));
    if (!num) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(num * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}
window.useCountUp = useCountUp;

// ───────────────────────── Animated Stat (count-up)
function AnimStat({ label, value, suffix }) {
  const num = parseInt(String(value).replace(/[^0-9]/g, ""));
  const animated = useCountUp(num);
  const fmt = animated.toLocaleString();
  return (
    <div className="pp-card-soft" style={{ padding: 20 }}>
      <div style={{
        font: "600 12px/1.4 var(--font-base)",
        color: "var(--pp-ink-soft)",
        marginBottom: 6,
      }}>{label}</div>
      <div className="tnum" style={{
        font: "800 28px/1.1 var(--font-display)",
        letterSpacing: "-0.02em",
        color: "var(--pp-ink)",
      }}>{fmt}{suffix || ""}</div>
    </div>
  );
}
window.AnimStat = AnimStat;

// Expose
Object.assign(window, {
  ToastHost, showToast,
  Wordmark, TopNav, Footer, Avatar,
  SourceGlyph, BrandMark, SOURCE_BRAND,
  VerdictBadge, Severity, Stat,
});

// Pricing page — 3 plans + comparison + FAQ
const PRICING_PLANS = [
  {
    id: "free", name: "Free", tag: "개인 탐색용", priceM: 0, priceY: 0,
    cta: "무료로 시작",
    features: [
      { label: "월 리포트 3건",     yes: true },
      { label: "레딧 1개 소스",     yes: true },
      { label: "트렌드 Top 3 미리보기", yes: true },
      { label: "기본 경쟁자 조사 (3개)", yes: true },
      { label: "리포트 저장 7일",  yes: true },
      { label: "PDF 워터마크",     yes: true,  dim: true },
      { label: "팀 공유",          yes: false },
    ],
  },
  {
    id: "pro", name: "Pro", tag: "예비 창업자·기획자", priceM: 29000, priceY: 23200,
    cta: "Pro 시작하기", featured: true,
    features: [
      { label: "월 리포트 무제한",      yes: true },
      { label: "전체 6개 소스",          yes: true },
      { label: "심화 경쟁자 조사 (10+)", yes: true },
      { label: "리포트 영구 저장",       yes: true },
      { label: "워터마크 없는 PDF",      yes: true },
      { label: "트렌드 주간 뉴스레터",   yes: true },
      { label: "팀 공유",                yes: false },
    ],
  },
  {
    id: "team", name: "Team", tag: "스타트업·액셀러레이터", priceM: 99000, priceY: 79200,
    cta: "팀 플랜 문의",
    features: [
      { label: "Pro의 모든 기능",         yes: true },
      { label: "팀원 5명 포함",            yes: true },
      { label: "공용 컬렉션·코멘트",       yes: true },
      { label: "업종별 페인포인트 트렌드", yes: true },
      { label: "전담 온보딩",              yes: true },
      { label: "SSO·SAML",                 yes: true },
    ],
  },
];

const FAQS = [
  { q: "결제는 어떻게 하나요?", a: "Stripe를 통해 신용카드·국내 카드·해외 카드를 지원하며, 부가세 포함 가격입니다. 세금계산서는 Team 플랜부터 발행됩니다." },
  { q: "언제든 해지할 수 있나요?", a: "네. 결제일 기준 언제든 해지 가능하며, 남은 기간 동안은 그대로 사용하실 수 있습니다." },
  { q: "Free 플랜에서도 모든 소스를 쓸 수 있나요?", a: "Free 플랜은 레딧 소스만 지원합니다. 네이버·해커뉴스·앱스토어·구글플레이·트러스트파일럿·유튜브 댓글은 Pro 이상에서 사용 가능합니다." },
  { q: "리포트 PDF는 영구 보관되나요?", a: "Pro와 Team 플랜은 영구 보관되며, Free 플랜은 생성 후 7일까지만 저장됩니다." },
  { q: "팀원을 더 추가할 수 있나요?", a: "Team 플랜은 기본 5명을 포함하며, 1명당 월 ₩19,000에 추가할 수 있습니다." },
];

function Pricing({ onNav, onChoose }) {
  const [cycle, setCycle] = React.useState("month"); // month | year

  return (
    <main className="fade-in" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 40px 80px" }}>
      {/* header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          font: "700 12px/1 var(--font-base)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--pp-pain)",
          marginBottom: 16,
        }}>가격</div>
        <h1 style={{
          margin: "0 0 16px",
          font: "800 56px/1.08 var(--font-display)",
          letterSpacing: "-0.03em",
          color: "var(--color-label-strong)",
        }}>당신의 단계에 맞는 플랜</h1>
        <p style={{
          margin: 0,
          font: "500 17px/1.5 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>아이디어 하나로 시작해, 팀으로 확장해도 같은 데이터를 그대로 씁니다.</p>

        {/* billing toggle */}
        <div style={{
          marginTop: 32,
          display: "inline-flex", padding: 4,
          background: "var(--pp-surface-soft)", borderRadius: 9999,
        }}>
          {[
            { id: "month", label: "월 결제" },
            { id: "year",  label: "연 결제 · 20% 할인" },
          ].map(o => (
            <button key={o.id} onClick={() => setCycle(o.id)} style={{
              all: "unset", cursor: "pointer",
              padding: "10px 20px", borderRadius: 9999,
              background: cycle === o.id ? "#fff" : "transparent",
              boxShadow: cycle === o.id ? "0 1px 3px rgba(23,23,25,0.08)" : "none",
              font: "600 13px/1 var(--font-base)",
              color: cycle === o.id ? "var(--pp-ink)" : "var(--pp-ink-soft)",
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* plan cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        marginBottom: 64,
      }}>
        {PRICING_PLANS.map(p => {
          const price = cycle === "month" ? p.priceM : p.priceY;
          const isFeatured = p.featured;
          return (
            <div key={p.id} style={{
              padding: 32, borderRadius: 24,
              background: isFeatured ? "var(--color-label-strong)" : "#fff",
              color: isFeatured ? "#fff" : "inherit",
              border: isFeatured ? "none" : "1px solid var(--pp-line)",
              position: "relative",
              boxShadow: isFeatured ? "0 24px 60px rgba(23,23,25,0.18)" : "none",
            }}>
              {isFeatured && (
                <div style={{
                  position: "absolute", top: -12, left: 24,
                  padding: "6px 12px", borderRadius: 9999,
                  background: "var(--pp-pain)", color: "#fff",
                  font: "700 11px/1 var(--font-base)",
                  letterSpacing: "0.06em",
                }}>가장 인기</div>
              )}

              <div style={{
                font: "700 12px/1 var(--font-base)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isFeatured ? "rgba(255,255,255,0.5)" : "var(--pp-ink-dim)",
                marginBottom: 8,
              }}>{p.tag}</div>
              <div style={{
                font: "800 28px/1 var(--font-display)",
                letterSpacing: "-0.022em",
                marginBottom: 24,
              }}>{p.name}</div>

              <div style={{ marginBottom: 28 }}>
                <span className="tnum" style={{
                  font: "900 56px/1 var(--font-display)",
                  letterSpacing: "-0.035em",
                }}>
                  {price === 0 ? "₩0" : `₩${price.toLocaleString()}`}
                </span>
                {price > 0 && (
                  <span style={{
                    font: "500 14px/1 var(--font-base)",
                    color: isFeatured ? "rgba(255,255,255,0.6)" : "var(--pp-ink-soft)",
                    marginLeft: 6,
                  }}>/ 월</span>
                )}
                {cycle === "year" && price > 0 && (
                  <div style={{
                    marginTop: 6,
                    font: "500 12px/1 var(--font-base)",
                    color: isFeatured ? "rgba(255,255,255,0.5)" : "var(--pp-ink-dim)",
                  }}>
                    연 ₩{(price * 12).toLocaleString()} 일시결제
                  </div>
                )}
              </div>

              <button onClick={() => onChoose(p.id)} className="pp-btn"
                      data-variant={isFeatured ? "brand" : "primary"}
                      style={{
                        width: "100%", marginBottom: 28,
                        background: isFeatured ? "#fff" : undefined,
                        color: isFeatured ? "var(--color-label-strong)" : undefined,
                      }}>
                {p.cta} →
              </button>

              <div style={{
                display: "flex", flexDirection: "column", gap: 12,
                paddingTop: 24,
                borderTop: isFeatured ? "1px solid rgba(255,255,255,0.12)" : "1px solid var(--pp-line)",
              }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    font: "500 14px/1.4 var(--font-base)",
                    color: f.yes ? (isFeatured ? "#fff" : "var(--pp-ink)") : (isFeatured ? "rgba(255,255,255,0.4)" : "var(--pp-ink-dim)"),
                    textDecoration: f.yes ? "none" : "line-through",
                    opacity: f.dim ? 0.6 : 1,
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: f.yes
                        ? (isFeatured ? "rgba(255,255,255,0.16)" : "var(--pp-pain-bg)")
                        : "transparent",
                      color: f.yes ? (isFeatured ? "#fff" : "var(--pp-pain)") : "var(--pp-ink-dim)",
                      font: "700 11px/1 var(--font-base)",
                    }}>{f.yes ? "✓" : "—"}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{
          margin: "0 0 24px",
          font: "800 32px/1.2 var(--font-display)",
          letterSpacing: "-0.022em",
          textAlign: "center",
        }}>자주 묻는 질문</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--pp-line)", borderRadius: 16, overflow: "hidden" }}>
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
        </div>
      </div>
    </main>
  );
}

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ background: "#fff" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        all: "unset", cursor: "pointer", display: "flex",
        width: "100%", padding: "20px 24px", alignItems: "center", gap: 16,
        boxSizing: "border-box",
      }}>
        <span style={{
          flex: 1,
          font: "700 16px/1.4 var(--font-display)",
          letterSpacing: "-0.01em",
          color: "var(--pp-ink)",
        }}>{q}</span>
        <span style={{
          font: "700 18px/1 var(--font-base)",
          color: "var(--pp-ink-soft)",
          transform: open ? "rotate(45deg)" : "none",
          transition: "transform 150ms ease-out",
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: "0 24px 20px",
          font: "500 14px/1.6 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>{a}</div>
      )}
    </div>
  );
}

window.Pricing = Pricing;

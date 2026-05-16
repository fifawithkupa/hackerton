// Competitors & differentiation tab
function Competitors({ data, selectedId, onSelect }) {
  const idea = data.ideas.find(i => i.id === selectedId) || data.ideas[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Idea selector */}
      <div className="pp-card-soft" style={{ padding: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {data.ideas.map(i => {
          const on = i.id === selectedId;
          return (
            <button key={i.id} onClick={() => onSelect(i.id)} style={{
              all: "unset", cursor: "pointer",
              padding: "10px 16px", borderRadius: 10,
              background: on ? "#fff" : "transparent",
              boxShadow: on ? "0 1px 0 rgba(23,23,25,0.04), 0 2px 8px rgba(23,23,25,0.06)" : "none",
              display: "flex", alignItems: "center", gap: 10,
              flex: 1, minWidth: 0,
            }}>
              <span className="tnum" style={{
                font: "800 14px/1 var(--font-display)",
                color: on ? "var(--pp-primary)" : "var(--pp-ink-dim)",
              }}>I{i.rank}</span>
              <span style={{
                font: "600 14px/1.3 var(--font-base)",
                letterSpacing: "-0.005em",
                color: on ? "var(--pp-ink)" : "var(--pp-ink-soft)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flex: 1,
              }}>{i.title}</span>
              <VerdictBadge verdict={i.verdict} tone={i.verdictTone} />
            </button>
          );
        })}
      </div>

      {/* Verdict hero */}
      <VerdictPanel idea={idea} />

      {/* Competitor table */}
      <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "20px 28px",
          borderBottom: "1px solid var(--pp-line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            font: "700 18px/1.3 var(--font-display)",
            letterSpacing: "-0.012em",
            color: "var(--pp-ink)",
            flex: 1,
          }}>경쟁자 자동 조사 · {idea.competitors.length}개 발견</div>
          <span className="pp-pill">Perplexity API + Google Custom Search</span>
        </div>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          font: "500 14px/1.5 var(--font-base)",
        }}>
          <thead>
            <tr style={{ background: "var(--pp-surface-soft)" }}>
              {["경쟁자", "URL", "타깃", "가격", "약점 / 빈틈"].map((h, i) => (
                <th key={h} style={{
                  font: "700 11px/1 var(--font-base)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--pp-ink-dim)",
                  textAlign: "left",
                  padding: "14px 20px",
                  width: i === 4 ? "auto" : i === 0 ? 160 : i === 1 ? 160 : i === 2 ? 160 : 140,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {idea.competitors.map((c, i) => (
              <tr key={c.name} style={{
                borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
              }}>
                <td style={{ padding: "18px 20px" }}>
                  <div style={{
                    font: "700 15px/1.3 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>{c.name}</div>
                </td>
                <td style={{ padding: "18px 20px" }}>
                  <a href="#" style={{
                    font: "500 13px/1 var(--font-mono)",
                    color: "var(--pp-primary)",
                    textDecoration: "none",
                  }}>{c.url} ↗</a>
                </td>
                <td style={{ padding: "18px 20px", color: "var(--pp-ink-soft)" }}>{c.target}</td>
                <td style={{ padding: "18px 20px" }}>
                  <span className="pp-pill">{c.price}</span>
                </td>
                <td style={{ padding: "18px 20px", color: "var(--pp-ink)" }}>
                  <span style={{ color: "var(--pp-pain)", marginRight: 6 }}>✕</span>
                  {c.weakness}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Differentiation */}
      <div className="pp-card" style={{ padding: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <div style={{
            font: "700 18px/1.3 var(--font-display)",
            letterSpacing: "-0.012em",
            color: "var(--pp-ink)",
          }}>우리가 이길 수 있는 이유 · 데이터 해자</div>
          <span className="pp-pill" data-tone="violet">AI 도출</span>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${Math.min(idea.moats.length, 3)}, 1fr)`, gap: 16,
        }}>
          {idea.moats.map((m, i) => (
            <div key={i} className="pp-card-soft" style={{ padding: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "var(--pp-pain-bg)",
                color: "var(--pp-pain)",
                display: "flex", alignItems: "center", justifyContent: "center",
                font: "800 14px/1 var(--font-display)",
                marginBottom: 12,
              }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{
                font: "600 15px/1.5 var(--font-base)",
                letterSpacing: "-0.003em",
                color: "var(--pp-ink)",
              }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerdictPanel({ idea }) {
  const bg = idea.verdictTone === "positive" ? "linear-gradient(135deg, #d4f7e0 0%, #b7e9c8 100%)"
           : idea.verdictTone === "violet"   ? "linear-gradient(135deg, #f1ecff 0%, #e2d9ff 100%)"
           : "linear-gradient(135deg, #fff1d6 0%, #ffe1b3 100%)";
  const fg = idea.verdictTone === "positive" ? "#00992f"
           : idea.verdictTone === "violet"   ? "#5034c4"
           : "#b45e00";
  const msg = idea.verdict === "블루오션" ? "국내 직접 경쟁자 0개. 즉시 진입을 권장합니다."
           : idea.verdict === "틈새 존재"  ? "강력한 경쟁자가 있지만, 우리가 진입할 명확한 빈틈이 있습니다."
           :                                  "경쟁자 3개 이상 존재. 진입 전략 재검토가 필요합니다.";

  return (
    <div style={{
      padding: 28, borderRadius: 20,
      background: bg, color: fg,
      display: "flex", alignItems: "center", gap: 24,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 9999,
        background: "rgba(255,255,255,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        font: "900 28px/1 var(--font-display)",
        flexShrink: 0,
      }}>
        {idea.verdict === "블루오션" ? "◎" : idea.verdict === "틈새 존재" ? "◐" : "●"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          font: "700 11px/1 var(--font-base)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 6,
          opacity: 0.7,
        }}>판정 결과</div>
        <div style={{
          font: "800 32px/1.1 var(--font-display)",
          letterSpacing: "-0.022em",
        }}>{idea.verdict}</div>
        <div style={{
          marginTop: 6,
          font: "500 14px/1.5 var(--font-base)",
          opacity: 0.85,
        }}>{msg}</div>
      </div>
    </div>
  );
}

window.Competitors = Competitors;

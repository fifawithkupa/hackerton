// Ideas tab — 3 idea cards
function Ideas({ data, saved, onToggleSave, onPickCompetitors }) {
  const [expanded, setExpanded] = React.useState(() => data.ideas[0]?.id ? { [data.ideas[0].id]: true } : {});
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pp-card-soft" style={{
        padding: 20,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            font: "700 14px/1.4 var(--font-base)",
            color: "var(--pp-ink)",
            marginBottom: 4,
          }}>
            {data.painpoints.length}개 페인포인트에서 {data.ideas.length}개의 실행 가능한 아이디어를 도출했습니다.
          </div>
          <div style={{
            font: "500 13px/1.5 var(--font-base)",
            color: "var(--pp-ink-soft)",
          }}>
            각 아이디어는 타깃·수익모델·MVP·시장규모·경쟁자 판정을 포함합니다. 카드를 클릭해 펼쳐보세요.
          </div>
        </div>
      </div>

      {data.ideas.map(i => (
        <IdeaCard key={i.id} idea={i}
                  painpoint={data.painpoints.find(p => p.id === i.linkedPainpoint)}
                  isOpen={!!expanded[i.id]}
                  onToggle={() => toggle(i.id)}
                  isSaved={!!saved[i.id]}
                  onToggleSave={() => onToggleSave(i.id)}
                  onPickCompetitors={() => onPickCompetitors(i.id)} />
      ))}
    </div>
  );
}

function IdeaCard({ idea, painpoint, isOpen, onToggle, isSaved, onToggleSave, onPickCompetitors }) {
  return (
    <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* HEAD */}
      <button onClick={onToggle} style={{
        all: "unset", cursor: "pointer", display: "block", width: "100%",
        padding: 28,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 24, alignItems: "start" }}>
          <div className="tnum" style={{
            font: "900 32px/1 var(--font-display)",
            letterSpacing: "-0.03em",
            color: "var(--pp-primary)",
            marginTop: 4,
          }}>I{idea.rank}</div>

          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <VerdictBadge verdict={idea.verdict} tone={idea.verdictTone} />
              <span className="pp-pill">
                연결: 페인포인트 #{painpoint?.rank}
              </span>
              <span className="pp-pill">
                <span className="tnum">{painpoint?.empathy.toLocaleString()}</span>건 공감 기반
              </span>
            </div>
            <h3 style={{
              margin: 0,
              font: "800 26px/1.28 var(--font-display)",
              letterSpacing: "-0.022em",
              color: "var(--pp-ink)",
            }}>{idea.title}</h3>
            <p style={{
              margin: "10px 0 0",
              font: "500 16px/1.55 var(--font-base)",
              letterSpacing: "-0.003em",
              color: "var(--pp-ink-soft)",
              maxWidth: 760,
            }}>{idea.oneliner}</p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    className="pp-btn" data-variant="ghost" data-size="sm">
              {isSaved ? "★ 저장됨" : "☆ 저장"}
            </button>
            <span style={{
              width: 36, height: 36, borderRadius: 9999,
              background: "var(--color-fill-alternative)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 200ms ease-out",
              color: "var(--pp-ink-soft)",
              font: "700 14px/1 var(--font-base)",
            }}>⌄</span>
          </div>
        </div>
      </button>

      {/* BODY */}
      {isOpen && (
        <div style={{
          padding: "0 28px 28px 28px",
          borderTop: "1px solid var(--pp-line)",
          paddingTop: 24,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>
            <Field label="타깃 고객"   value={idea.target} />
            <Field label="수익 모델"   value={idea.revenue} />
            <Field label="시장 규모"   value={idea.market} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            {/* MVP */}
            <div className="pp-card-soft" style={{ padding: 20 }}>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}>MVP — 1주일 안에 만들 수 있는 최소 범위</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {idea.mvp.map((m, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "24px 1fr", gap: 10,
                    alignItems: "start",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: "var(--pp-ink)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      font: "700 11px/1 var(--font-base)",
                      flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{
                      font: "500 14px/1.5 var(--font-base)",
                      color: "var(--pp-ink)",
                    }}>{m}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked painpoint quote */}
            <div className="pp-card-soft" style={{
              padding: 20,
              borderLeft: "4px solid var(--pp-pain)",
              borderRadius: "8px 16px 16px 8px",
            }}>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}>해결하는 페인포인트 #{painpoint?.rank}</div>
              <div style={{
                font: "600 16px/1.5 var(--font-display)",
                letterSpacing: "-0.012em",
                color: "var(--pp-ink)",
                marginBottom: 12,
              }}>"{painpoint?.title}"</div>
              <div style={{
                display: "flex", gap: 12,
                font: "500 12px/1 var(--font-base)",
                color: "var(--pp-ink-soft)",
              }}>
                <span>♥ <span className="tnum">{painpoint?.empathy.toLocaleString()}</span></span>
                <span>💬 <span className="tnum">{painpoint?.comments.toLocaleString()}</span></span>
                <Severity level={painpoint?.severity} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="pp-btn" data-variant="ghost" data-size="sm">아이디어 카드 공유</button>
            <button className="pp-btn" data-variant="primary" data-size="sm"
                    onClick={onPickCompetitors}>
              경쟁자·차별점 보기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{
        font: "700 11px/1 var(--font-base)",
        letterSpacing: "0.08em",
        color: "var(--pp-ink-dim)",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>{label}</div>
      <div style={{
        font: "600 15px/1.45 var(--font-base)",
        letterSpacing: "-0.005em",
        color: "var(--pp-ink)",
      }}>{value}</div>
    </div>
  );
}

window.Ideas = Ideas;

// Report — 1-page printable report
function Report({ data }) {
  const lead = data.ideas[0];
  const lp = data.painpoints.find(p => p.id === lead.linkedPainpoint);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px",
        background: "var(--pp-surface-soft)",
        borderRadius: 12,
      }}>
        <span style={{
          font: "700 13px/1 var(--font-base)",
          color: "var(--pp-ink)",
        }}>1페이지 리포트 미리보기</span>
        <span style={{
          font: "500 13px/1 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>· A4 비율 · 워터마크 포함</span>
        <div style={{ flex: 1 }} />
        <button className="pp-btn" data-variant="ghost" data-size="sm">링크 복사</button>
        <button className="pp-btn" data-variant="ghost" data-size="sm">노션으로 보내기</button>
        <button className="pp-btn" data-variant="brand" data-size="sm">PDF 다운로드</button>
      </div>

      {/* The report page */}
      <div style={{
        width: 1000, margin: "0 auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 0 rgba(23,23,25,0.04), 0 12px 36px rgba(23,23,25,0.10)",
        padding: "48px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* watermark */}
        <div style={{
          position: "absolute", right: -40, bottom: -40,
          font: "900 220px/1 var(--font-display)",
          letterSpacing: "-0.05em",
          color: "rgba(112,115,124,0.04)",
          pointerEvents: "none",
        }}>PP.</div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 24,
          paddingBottom: 20,
          borderBottom: "2px solid var(--color-label-strong)",
        }}>
          <div style={{ flex: 1 }}>
            <Wordmark />
            <h1 style={{
              margin: "16px 0 8px",
              font: "800 36px/1.15 var(--font-display)",
              letterSpacing: "-0.025em",
              color: "var(--color-label-strong)",
            }}>
              “{data.keyword}” 산업 페인포인트 리포트
            </h1>
            <div style={{
              font: "500 13px/1.4 var(--font-base)",
              color: "var(--pp-ink-soft)",
            }}>
              발행일: {data.analyzedAt} · 데이터 수집 {data.totalCollected.toLocaleString()}건 (유효 {data.afterFilter.toLocaleString()}건)
            </div>
          </div>
          <VerdictBadge verdict={data.verdict} tone={data.verdictTone} size="lg" />
        </div>

        {/* Section: Top painpoints */}
        <Section title="01  상위 페인포인트">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {data.painpoints.map(p => (
              <div key={p.id} style={{
                padding: 16,
                background: "var(--pp-surface-soft)",
                borderRadius: 12,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 8,
                }}>
                  <span className="tnum" style={{
                    font: "800 14px/1 var(--font-display)",
                    color: "var(--pp-pain)",
                  }}>#{p.rank}</span>
                  <Severity level={p.severity} />
                </div>
                <div style={{
                  font: "700 14px/1.4 var(--font-display)",
                  letterSpacing: "-0.008em",
                  color: "var(--pp-ink)",
                  marginBottom: 8,
                  minHeight: 40,
                }}>"{p.title}"</div>
                <div style={{
                  display: "flex", gap: 10,
                  font: "600 11px/1 var(--font-base)",
                  color: "var(--pp-ink-soft)",
                }}>
                  <span>♥ <span className="tnum" style={{ color: "var(--pp-ink)" }}>{p.empathy.toLocaleString()}</span></span>
                  <span>💬 <span className="tnum" style={{ color: "var(--pp-ink)" }}>{p.comments.toLocaleString()}</span></span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section: Lead idea */}
        <Section title="02  추천 아이디어">
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <span className="tnum" style={{
                  font: "800 14px/1 var(--font-display)",
                  color: "var(--pp-primary)",
                }}>I{lead.rank}</span>
                <VerdictBadge verdict={lead.verdict} tone={lead.verdictTone} />
                <span className="pp-pill">페인포인트 #{lp?.rank} 해결</span>
              </div>
              <h3 style={{
                margin: "0 0 6px",
                font: "800 22px/1.25 var(--font-display)",
                letterSpacing: "-0.018em",
                color: "var(--pp-ink)",
              }}>{lead.title}</h3>
              <p style={{
                margin: "0 0 16px",
                font: "500 14px/1.55 var(--font-base)",
                color: "var(--pp-ink-soft)",
              }}>{lead.oneliner}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MiniField label="타깃 고객" value={lead.target} />
                <MiniField label="수익 모델" value={lead.revenue} />
                <MiniField label="시장 규모" value={lead.market} colspan={2} />
              </div>
            </div>

            <div style={{
              padding: 16,
              background: "var(--pp-surface-soft)",
              borderRadius: 12,
            }}>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>MVP — 1주일 안 출시</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lead.mvp.map((m, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "16px 1fr", gap: 8,
                    font: "500 12px/1.4 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>
                    <span style={{ color: "var(--pp-pain)", fontWeight: 700 }}>0{i + 1}</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Competitors */}
        <Section title="03  경쟁자 요약 + 차별점">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>주요 경쟁자</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {lead.competitors.map((c, i) => (
                  <div key={c.name} style={{
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 8, alignItems: "baseline",
                  }}>
                    <div style={{
                      font: "700 13px/1.3 var(--font-base)",
                      color: "var(--pp-ink)",
                    }}>{c.name}</div>
                    <div style={{
                      font: "500 11px/1.4 var(--font-base)",
                      color: "var(--pp-ink-soft)",
                    }}>{c.weakness}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-pain)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>우리만의 차별점</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lead.moats.map((m, i) => (
                  <div key={i} style={{
                    padding: "10px 12px",
                    background: "var(--pp-pain-bg)",
                    borderRadius: 8,
                    font: "600 12px/1.4 var(--font-base)",
                    color: "var(--pp-pain)",
                  }}>
                    {String(i + 1).padStart(2, "0")} · {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid var(--pp-line)",
          display: "flex", alignItems: "center",
          font: "500 11px/1.4 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>
          <span>PAINPOINT v1.0 · 실제 커뮤니티 불만 기반 창업 아이디어 발굴 플랫폼</span>
          <div style={{ flex: 1 }} />
          <span>painpoint.kr / r/{data.keyword.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{
        margin: "0 0 16px",
        font: "800 12px/1 var(--font-base)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-label-strong)",
      }}>{title}</h2>
      {children}
    </section>
  );
}

function MiniField({ label, value, colspan }) {
  return (
    <div style={{ gridColumn: colspan ? `span ${colspan}` : undefined }}>
      <div style={{
        font: "700 10px/1 var(--font-base)",
        letterSpacing: "0.08em",
        color: "var(--pp-ink-dim)",
        textTransform: "uppercase",
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        font: "600 13px/1.4 var(--font-base)",
        color: "var(--pp-ink)",
      }}>{value}</div>
    </div>
  );
}

window.Report = Report;

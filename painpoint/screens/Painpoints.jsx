// Painpoints tab — ranked list with rich data
function Painpoints({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top summary bar */}
      <div className="pp-card-soft" style={{
        padding: 20,
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            font: "700 14px/1.4 var(--font-base)",
            color: "var(--pp-ink)",
            marginBottom: 4,
          }}>
            상위 {data.painpoints.length}개 페인포인트가 발견되었습니다.
          </div>
          <div style={{
            font: "500 13px/1.5 var(--font-base)",
            color: "var(--pp-ink-soft)",
          }}>
            공감 수 40% · 댓글 수 25% · 최신성 20% · 반복 등장 15%를 가중 평균해 순위를 매겼습니다.
          </div>
        </div>
        <button className="pp-btn" data-variant="ghost" data-size="sm">정렬: 공감 수 순 ▾</button>
      </div>

      {data.painpoints.map(p => <PainpointCard key={p.id} p={p} />)}
    </div>
  );
}

function PainpointCard({ p }) {
  const [showAll, setShowAll] = React.useState(false);
  const sevLabel = { high: "심각도 상", mid: "심각도 중", low: "심각도 하" }[p.severity];
  const sevTone  = { high: "pain", mid: "warn", low: "primary" }[p.severity];
  const totalSrc = Object.values(p.sources).reduce((a, b) => a + b, 0);
  const sourceOrder = ["reddit", "naver", "youtube"];
  const platformCount = sourceOrder.filter(id => (p.sources[id] || 0) > 0).length;
  const sourceLabel = { reddit: "레딧", naver: "네이버", youtube: "유튜브 댓글" };

  return (
    <div className="pp-card" style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 360px", gap: 24 }}>
        {/* —— rank —— */}
        <div>
          <div className="tnum" style={{
            font: "900 56px/1 var(--font-display)",
            letterSpacing: "-0.04em",
            color: p.severity === "high" ? "var(--pp-pain)" : "var(--pp-ink)",
          }}>#{p.rank}</div>
        </div>

        {/* —— main —— */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            marginBottom: 12,
          }}>
            <span className="pp-pill" data-tone={sevTone}>
              <Severity level={p.severity} /> {sevLabel}
            </span>
            <span className="pp-pill" data-tone="primary">
              ♥ <span className="tnum">{p.empathy.toLocaleString()}</span> 공감
            </span>
            <span className="pp-pill">
              💬 <span className="tnum">{p.comments.toLocaleString()}</span> 댓글
            </span>
            <span className="pp-pill">
              <span className="tnum">{totalSrc}</span>개 플랫폼 등장
            </span>
          </div>
          <h3 style={{
            margin: 0,
            font: "700 24px/1.32 var(--font-display)",
            letterSpacing: "-0.018em",
            color: "var(--pp-ink)",
          }}>"{p.title}"</h3>
          <p style={{
            margin: "10px 0 20px",
            font: "500 15px/1.6 var(--font-base)",
            letterSpacing: "-0.003em",
            color: "var(--pp-ink-soft)",
            maxWidth: 640,
          }}>{p.summary}</p>

          {/* sample posts */}
          <div style={{
            font: "700 11px/1 var(--font-base)",
            letterSpacing: "0.08em",
            color: "var(--pp-ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>대표 글 샘플</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.samples.map((s, i) => {
              const href =
                s.link && s.link !== "#" && /^https?:\/\//i.test(s.link) ? s.link : null;
              const rowStyle = {
                display: "grid",
                gridTemplateColumns: "20px 80px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--pp-surface-soft)",
                textDecoration: "none",
                color: "inherit",
                transition: "background 150ms ease-out",
                cursor: href ? "pointer" : "default",
              };
              const inner = (
                <>
                  <SourceGlyph id={s.src} size={20} />
                  <span style={{
                    font: "600 12px/1 var(--font-base)",
                    color: "var(--pp-ink-soft)",
                  }}>{window.SOURCE_BRAND[s.src]?.name || s.src}</span>
                  <span style={{
                    font: "500 14px/1.4 var(--font-base)",
                    color: "var(--pp-ink)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{s.title}</span>
                  <span className="tnum" style={{
                    font: "700 12px/1 var(--font-base)",
                    color: "var(--pp-pain)",
                  }}>↑ {s.up}</span>
                </>
              );
              const hoverOn = (e) => {
                e.currentTarget.style.background = "var(--color-fill-normal)";
              };
              const hoverOff = (e) => {
                e.currentTarget.style.background = "var(--pp-surface-soft)";
              };
              if (href) {
                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={rowStyle}
                    onMouseEnter={hoverOn}
                    onMouseLeave={hoverOff}
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <div
                  key={i}
                  style={rowStyle}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>

        {/* —— right: source + emotion breakdown —— */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* source breakdown */}
          <div>
            <div style={{
              font: "700 11px/1 var(--font-base)",
              letterSpacing: "0.08em",
              color: "var(--pp-ink-dim)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>플랫폼별 등장</div>
            <div style={{
              display: "flex", borderRadius: 6, overflow: "hidden",
              height: 8, marginBottom: 12,
            }}>
              {sourceOrder.map(id => {
                const v = p.sources[id] || 0;
                const pct = (v / totalSrc) * 100;
                if (pct < 0.5) return null;
                return (
                  <div key={id} style={{
                    width: `${pct}%`,
                    background: {
                      reddit: "#FF4500", naver: "#03C75A", youtube: "#FF0000",
                    }[id],
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sourceOrder.map(id => {
                const v = p.sources[id] || 0;
                const pct = ((v / totalSrc) * 100).toFixed(0);
                return (
                  <div key={id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    font: "500 12px/1.4 var(--font-base)",
                  }}>
                    <SourceGlyph id={id} size={16} />
                    <span style={{ color: "var(--pp-ink-soft)", flex: 1 }}>
                      {sourceLabel[id]}
                    </span>
                    <span className="tnum" style={{ color: "var(--pp-ink)", fontWeight: 600 }}>
                      {v}
                    </span>
                    <span className="tnum" style={{
                      color: "var(--pp-ink-dim)", width: 32, textAlign: "right",
                    }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* emotion */}
          <div>
            <div style={{
              font: "700 11px/1 var(--font-base)",
              letterSpacing: "0.08em",
              color: "var(--pp-ink-dim)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>감정 분포</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(p.emotions).map(([emo, pct]) => (
                <div key={emo}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    font: "500 12px/1 var(--font-base)",
                    marginBottom: 4,
                  }}>
                    <span style={{ color: "var(--pp-ink)" }}>{emo}</span>
                    <span className="tnum" style={{ color: "var(--pp-ink-soft)" }}>{pct}%</span>
                  </div>
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: "var(--color-fill-alternative)",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: "var(--pp-pain)",
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Painpoints = Painpoints;

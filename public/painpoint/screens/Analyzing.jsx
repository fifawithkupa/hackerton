// Analyzing — live loading screen
const ANALYZE_STEPS = [
  { id: 1, t: "키워드 분석",     d: "동의어·관련 산업 용어 확장" },
  { id: 2, t: "커뮤니티 수집",   d: "6개 플랫폼에서 불만 글 크롤링" },
  { id: 3, t: "전처리·노이즈 제거", d: "스팸·광고·중복 글 제거" },
  { id: 4, t: "임베딩·클러스터링", d: "유사 불만을 군집으로 묶기" },
  { id: 5, t: "아이디어 생성",   d: "GPT-4o로 실행 가능한 아이디어 도출" },
  { id: 6, t: "경쟁자 자동 조사", d: "Perplexity API · Google Search" },
];

function Analyzing({ params, onDone, onCancel }) {
  const [elapsed, setElapsed]   = React.useState(0);
  const [stepIdx, setStepIdx]   = React.useState(0);
  const [fetched, setFetched]   = React.useState(false);
  const [postCount, setPostCount] = React.useState(0);
  const [error, setError]       = React.useState(null);

  // tick
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 0.1), 100);
    return () => clearInterval(t);
  }, []);

  // step progression (애니메이션)
  React.useEffect(() => {
    const ms = [400, 800, 1200, 1600, 2000, 2400];
    const timers = ANALYZE_STEPS.map((_, i) =>
      setTimeout(() => setStepIdx(i + 1), ms[i] || 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // 실제 Reddit 크롤링 API 호출
  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(params.keyword)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        window.PP_DATA = data;
        setPostCount(data.result.totalCollected);
        setFetched(true);
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => controller.abort();
  }, [params.keyword]);

  // fetch 완료 + 최소 2.5초 애니메이션 후 이동
  React.useEffect(() => {
    if (!fetched) return;
    const delay = Math.max(0, 2500 - elapsed * 1000);
    const id = setTimeout(onDone, delay);
    return () => clearTimeout(id);
  }, [fetched]);

  const log = window.PP_DATA?.result?.log || [];
  const totalCollected = fetched ? postCount : Math.floor(elapsed * 8);

  return (
    <main className="fade-in" style={{
      maxWidth: 1180, margin: "0 auto",
      padding: "56px 40px 80px",
    }}>
      {/* top status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 24,
      }}>
        <button onClick={onCancel} className="pp-btn" data-variant="ghost" data-size="sm">
          ← 취소
        </button>
        <span style={{ flex: 1 }} />
        <span style={{
          font: "600 12px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>경과 시간</span>
        <span className="tnum" style={{
          font: "700 14px/1 var(--font-mono)",
          color: "var(--pp-ink)",
        }}>{elapsed.toFixed(1)}s</span>
      </div>

      {/* big keyword */}
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12,
        marginBottom: 8,
      }}>
        <span style={{
          font: "600 13px/1 var(--font-base)",
          letterSpacing: "0.02em",
          color: "var(--pp-pain)",
          textTransform: "uppercase",
        }}>분석 중</span>
        <span style={{
          width: 6, height: 6, borderRadius: 9999,
          background: "var(--pp-pain)",
          animation: "pulse 1s ease-out infinite",
        }} />
      </div>
      <h1 style={{
        margin: 0,
        font: "800 56px/1.1 var(--font-display)",
        letterSpacing: "-0.03em",
        color: "var(--color-label-strong)",
      }}>
        “{params.keyword}” 키워드 페인포인트 분석
      </h1>

      <div style={{
        marginTop: 48,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
      }}>
        {/* —— LEFT: step list —— */}
        <div className="pp-card" style={{ padding: 28 }}>
          <div style={{
            font: "700 13px/1 var(--font-base)",
            letterSpacing: "0.02em",
            color: "var(--pp-ink-dim)",
            textTransform: "uppercase",
            marginBottom: 20,
          }}>분석 단계</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ANALYZE_STEPS.map((s, i) => {
              const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "pending";
              const color = state === "done" ? "var(--pp-positive)"
                          : state === "active" ? "var(--pp-pain)"
                          : "var(--pp-line-strong)";
              return (
                <div key={s.id} style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr",
                  gap: 12, alignItems: "start",
                  padding: "12px 0",
                  borderBottom: i < ANALYZE_STEPS.length - 1 ? "1px solid var(--pp-line)" : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9999,
                    background: state === "pending" ? "var(--color-fill-alternative)" : color,
                    color: state === "pending" ? "var(--pp-ink-dim)" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    font: "700 12px/1 var(--font-base)",
                    transition: "all 200ms ease-out",
                    flexShrink: 0,
                  }}>
                    {state === "done" ? "✓" : state === "active"
                      ? <span style={{
                          width: 10, height: 10, borderRadius: 9999,
                          background: "#fff",
                          animation: "pulse 1s ease-out infinite",
                        }} />
                      : s.id}
                  </div>
                  <div>
                    <div style={{
                      font: "700 15px/1.4 var(--font-base)",
                      letterSpacing: "-0.005em",
                      color: state === "pending" ? "var(--pp-ink-dim)" : "var(--pp-ink)",
                    }}>{s.t}</div>
                    <div style={{
                      font: "500 12px/1.4 var(--font-base)",
                      color: "var(--pp-ink-soft)",
                      marginTop: 2,
                    }}>{s.d}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* —— RIGHT: live log + counter —— */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* counter card */}
          <div className="pp-card" style={{
            padding: 28,
            background: "var(--color-label-strong)",
            color: "#fff",
            border: "none",
          }}>
            <div style={{
              font: "700 11px/1 var(--font-base)",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>실시간 수집량</div>
            <div className="tnum" style={{
              font: "800 72px/1 var(--font-display)",
              letterSpacing: "-0.03em",
            }}>{totalCollected.toLocaleString()}</div>
            <div style={{
              marginTop: 8,
              font: "500 13px/1 var(--font-base)",
              color: "rgba(255,255,255,0.6)",
            }}>건의 불만·고민 수집됨</div>

            <div style={{
              marginTop: 24, paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
            }}>
              <div>
                <div style={{ font: "500 11px/1 var(--font-base)", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>레딧</div>
                <div className="tnum" style={{ font: "700 16px/1 var(--font-base)" }}>
                  {fetched ? postCount.toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* live log */}
          <div className="pp-card pp-log" style={{ padding: 20, minHeight: 200 }}>
            <div style={{ marginBottom: 8, color: "var(--pp-ink-dim)" }}>
              $ painpoint collect --keyword "{params.keyword}"
            </div>
            {error && (
              <div style={{ color: "var(--pp-pain)", marginTop: 8 }}>
                ✗ 오류: {error}
              </div>
            )}
            {fetched ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ok">✓</span>
                <SourceGlyph id="reddit" size={14} />
                <span className="src">레딧</span>
                <span>— Reddit 검색: "{params.keyword}" →</span>
                <span className="num">{postCount}</span>
                <span>posts</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--pp-pain)" }}>›</span>
                <SourceGlyph id="reddit" size={14} />
                <span>레딧 — "{params.keyword}" 검색 중</span>
                <span style={{ marginLeft: 4, animation: "pulse 1s ease-out infinite" }}>▌</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

window.Analyzing = Analyzing;

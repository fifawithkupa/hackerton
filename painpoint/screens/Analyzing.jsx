// Analyzing — live loading screen
const ANALYZE_STEPS = [
  { id: 1, t: "키워드 분석",     d: "동의어·관련 산업 용어 확장" },
  { id: 2, t: "커뮤니티 수집",   d: "6개 플랫폼에서 불만 글 크롤링" },
  { id: 3, t: "전처리·노이즈 제거", d: "스팸·광고·중복 글 제거" },
  { id: 4, t: "Gemini 클러스터링", d: "수집 글을 3~5개 페인포인트로 압축" },
  { id: 5, t: "아이디어 생성",   d: "각 페인포인트별 카드 — 타깃·수익·MVP" },
  { id: 6, t: "경쟁자·시장 판정", d: "Gemini — 경쟁자 3곳 + 블루오션/틈새/레드오션" },
];

function ppSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Analyzing({ params, onFinish, onCancel }) {
  const D = window.PP_DATA;
  const log = D.result.log;
  const useAi =
    typeof window.hasOpenAiConfigured === "function" && window.hasOpenAiConfigured();

  const sourcesKey = React.useMemo(
    () => JSON.stringify(params.sources || {}),
    [params.sources],
  );

  const [elapsed, setElapsed] = React.useState(0);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [logIdx, setLogIdx]  = React.useState(0);

  // tick
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 0.1), 100);
    return () => clearInterval(t);
  }, []);

  // 데모 모드: 단계·로그·완료 타이머
  React.useEffect(() => {
    if (useAi) return;

    const ms = [600, 900, 1400, 1700, 2400, 2900, 3400];
    const stepTimers = ANALYZE_STEPS.map((_, i) =>
      setTimeout(() => setStepIdx(i + 1), ms[i] || 4000)
    );

    const logTimers = log.map((entry, i) =>
      setTimeout(() => setLogIdx(i + 1), entry.d * 1000)
    );

    const finishId = setTimeout(() => onFinish(null), 4200);

    return () => {
      stepTimers.forEach(clearTimeout);
      logTimers.forEach(clearTimeout);
      clearTimeout(finishId);
    };
  }, [useAi, onFinish]);

  // Gemini 모드: 수집 로그는 동일하게 재생, 클러스터링·아이디어는 실제 API
  React.useEffect(() => {
    if (!useAi) return;

    let cancelled = false;
    const logTimers = log.map((entry, i) =>
      setTimeout(() => { if (!cancelled) setLogIdx(i + 1); }, entry.d * 1000)
    );

    (async () => {
      try {
        const health = typeof window.checkAnalysisServer === "function"
          ? await window.checkAnalysisServer()
          : { ok: true };
        if (!health.ok && !cancelled) {
          if (health.reason === "old_server" || health.reason === "health_failed") {
            showToast("분석 서버가 옛 버전입니다. node painpoint/dev-server.mjs 를 다시 실행하세요.", "default");
          } else if (health.reason === "offline") {
            showToast("분석 서버에 연결할 수 없습니다. node painpoint/dev-server.mjs 실행 후 8787 포트로 접속하세요.", "default");
          }
        }
        await ppSleep(280);   if (cancelled) return; setStepIdx(1);
        await ppSleep(380);   if (cancelled) return; setStepIdx(2);
        await ppSleep(420);   if (cancelled) return; setStepIdx(3);
        await ppSleep(320);   if (cancelled) return; setStepIdx(4);
        await ppSleep(220);   if (cancelled) return; setStepIdx(5);
        const result = await window.runPainpointAnalysis(params.keyword, params.sources);
        if (cancelled) return;
        if (!result) {
          showToast("GPT 결과 없음 — 목 데이터를 표시합니다", "default");
        }
        setStepIdx(ANALYZE_STEPS.length);
        onFinish(result);
      } catch (e) {
        console.error(e);
        const line =
          typeof window.interpretAnalysisError === "function"
            ? window.interpretAnalysisError(e.message)
            : typeof window.interpretOpenAiAnalysisError === "function"
              ? window.interpretOpenAiAnalysisError(e.message)
              : "Gemini 분석 실패 — 목 데이터를 표시합니다";
        showToast(line, "default");
        if (!cancelled) {
          setStepIdx(ANALYZE_STEPS.length);
          onFinish(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      logTimers.forEach(clearTimeout);
    };
  }, [useAi, params.keyword, sourcesKey, onFinish]);

  const totalCollected = log.slice(0, logIdx).reduce((a, b) => a + b.n, 0);

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
              {log.slice(0, 3).map(l => (
                <div key={l.src}>
                  <div style={{
                    font: "500 11px/1 var(--font-base)",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 4,
                  }}>{l.src}</div>
                  <div className="tnum" style={{
                    font: "700 16px/1 var(--font-base)",
                  }}>
                    {logIdx > log.indexOf(l) ? l.n.toLocaleString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* live log */}
          <div className="pp-card pp-log" style={{ padding: 20, minHeight: 200 }}>
            <div style={{ marginBottom: 8, color: "var(--pp-ink-dim)" }}>
              $ painpoint collect --keyword "{params.keyword}"
            </div>
            {log.slice(0, logIdx).map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="ok">✓</span>
                <SourceGlyph id={l.id} size={14} />
                <span className="src">{l.src}</span>
                <span>— {l.t} →</span>
                <span className="num">{l.n}</span>
                <span>posts</span>
              </div>
            ))}
            {logIdx < log.length && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--pp-pain)" }}>›</span>
                <SourceGlyph id={log[logIdx]?.id} size={14} />
                <span>{log[logIdx]?.src} — 연결 중</span>
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

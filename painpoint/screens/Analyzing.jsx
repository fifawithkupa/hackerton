// Analyzing — Reddit + 네이버 실시간 수집 + Gemini 분석 (통합)
const ANALYZE_STEPS = [
  { id: 1, t: "키워드 분석",       d: "동의어·관련 산업 용어 확장" },
  { id: 2, t: "커뮤니티 수집",     d: "네이버(블로그·카페·지식인) + 유튜브 댓글 실시간 수집" },
  { id: 3, t: "전처리·노이즈 제거", d: "스팸·광고·중복 글 제거" },
  { id: 4, t: "Gemini 클러스터링", d: "수집 글을 3~5개 페인포인트로 압축" },
  { id: 5, t: "아이디어 생성",     d: "각 페인포인트별 카드 — 타깃·수익·MVP" },
  { id: 6, t: "경쟁자·시장 판정",  d: "Gemini — 경쟁자 3곳 + 블루오션/틈새/레드오션" },
];

function ppSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Analyzing({ params, onFinish, onCancel }) {
  const fallbackLog = window.PP_DATA?.result?.log || [];
  const clientAiConfigured =
    typeof window.hasOpenAiConfigured === "function" && window.hasOpenAiConfigured();

  const [elapsed, setElapsed] = React.useState(0);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [log, setLog] = React.useState(fallbackLog);
  const [logIdx, setLogIdx] = React.useState(0);
  const [postCount, setPostCount] = React.useState(0);
  const [collectDone, setCollectDone] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ppSleep(200);
        if (cancelled) return;
        setStepIdx(1);

        // sources 파라미터 빌드
        const enabledSources = params.sources && typeof params.sources === "object"
          ? Object.entries(params.sources).filter(([, on]) => on).map(([id]) => id)
          : ["naver", "youtube"];
        const sourcesParam = enabledSources.join(",") || "naver,youtube";

        const searchRes = await fetch(
          `/api/search?q=${encodeURIComponent(params.keyword)}&sources=${encodeURIComponent(sourcesParam)}`,
        );
        const searchData = await searchRes.json();
        if (!searchRes.ok || searchData.error) {
          throw new Error(searchData.error || `수집 실패 (${searchRes.status})`);
        }

        window.PP_DATA = {
          ...searchData,
          result: searchData.result,
        };
        window._ssatisCollectedPosts = searchData.collectedPosts || [];
        const n = searchData.result?.totalCollected || 0;
        window._ssatisCollectMeta = {
          source: sourcesParam,
          totalCollected: n,
          afterFilter: searchData.result?.afterFilter ?? n,
          log: searchData.result?.log || [],
        };
        setPostCount(n);
        setLog(searchData.result?.log || fallbackLog);
        setLogIdx(searchData.result?.log?.length || 1);
        setCollectDone(true);
        if (cancelled) return;

        setStepIdx(2);
        await ppSleep(400);
        if (cancelled) return;
        setStepIdx(3);

        const health =
          typeof window.checkAnalysisServer === "function"
            ? await window.checkAnalysisServer()
            : { ok: false, keyLoaded: false };
        const useAi = health.ok && health.keyLoaded;

        if (!useAi && !cancelled) {
          if (health.reason === "old_server" || health.reason === "health_failed") {
            showToast(
              "분석 API가 응답하지 않습니다. Vercel 배포 시 GEMINI_API_KEY 환경변수를 확인하세요.",
              "default",
            );
          } else if (health.reason === "offline") {
            showToast(
              "분석 API에 연결할 수 없습니다. 배포 URL에서 /api/ssatis-health 를 확인하세요.",
              "default",
            );
          } else if (!health.keyLoaded) {
            showToast(
              "서버에 Gemini 키가 없습니다. Vercel Settings → Environment Variables에 GEMINI_API_KEY를 추가하세요.",
              "default",
            );
          }
        }

        if (useAi) {

          await ppSleep(300);
          if (cancelled) return;
          setStepIdx(4);
          await ppSleep(250);
          if (cancelled) return;
          setStepIdx(5);

          const result = await window.runPainpointAnalysis(
            params.keyword,
            params.sources,
          );
          if (cancelled) return;

          if (!result) {
            showToast("Gemini 결과 없음 — 수집 데이터를 표시합니다", "default");
            setStepIdx(ANALYZE_STEPS.length);
            onFinish(null);
            return;
          }

          setStepIdx(ANALYZE_STEPS.length);
          onFinish(result);
          return;
        }

        await ppSleep(600);
        if (cancelled) return;
        setStepIdx(ANALYZE_STEPS.length);
        onFinish(null);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError(e.message || String(e));
        showToast(
          (e.message || "수집 실패") +
            " — /api/search 가 동작하는지, Vercel Functions 로그를 확인하세요.",
          "default",
        );
        try {
          setStepIdx(4);
          const result = await window.runPainpointAnalysis(
            params.keyword,
            params.sources,
          );
          setStepIdx(ANALYZE_STEPS.length);
          onFinish(result || null);
        } catch (geminiErr) {
          const line =
            typeof window.interpretAnalysisError === "function"
              ? window.interpretAnalysisError(geminiErr.message)
              : "Gemini 분석 실패";
          showToast(line, "default");
          setStepIdx(ANALYZE_STEPS.length);
          onFinish(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.keyword, params.sources, clientAiConfigured, onFinish]);

  const totalCollected = collectDone
    ? postCount
    : log.slice(0, logIdx).reduce((a, b) => a + (b.n || 0), 0);

  return (
    <main
      className="fade-in"
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "56px 40px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button onClick={onCancel} className="pp-btn" data-variant="ghost" data-size="sm">
          ← 취소
        </button>
        <span style={{ flex: 1 }} />
        <span
          style={{
            font: "600 12px/1 var(--font-base)",
            color: "var(--pp-ink-dim)",
          }}
        >
          경과 시간
        </span>
        <span
          className="tnum"
          style={{
            font: "700 14px/1 var(--font-mono)",
            color: "var(--pp-ink)",
          }}
        >
          {elapsed.toFixed(1)}s
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            font: "600 13px/1 var(--font-base)",
            letterSpacing: "0.02em",
            color: "var(--pp-pain)",
            textTransform: "uppercase",
          }}
        >
          분석 중
        </span>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "var(--pp-pain)",
            animation: "pulse 1s ease-out infinite",
          }}
        />
      </div>
      <h1
        style={{
          margin: 0,
          font: "800 56px/1.1 var(--font-display)",
          letterSpacing: "-0.03em",
          color: "var(--color-label-strong)",
        }}
      >
        "{params.keyword}" 키워드 페인포인트 분석
      </h1>

      <div
        style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* 분석 단계 */}
        <div className="pp-card" style={{ padding: 28 }}>
          <div
            style={{
              font: "700 13px/1 var(--font-base)",
              letterSpacing: "0.02em",
              color: "var(--pp-ink-dim)",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            분석 단계
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ANALYZE_STEPS.map((s, i) => {
              const state =
                i < stepIdx ? "done" : i === stepIdx ? "active" : "pending";
              const color =
                state === "done"
                  ? "var(--pp-positive)"
                  : state === "active"
                    ? "var(--pp-pain)"
                    : "var(--pp-line-strong)";
              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr",
                    gap: 12,
                    alignItems: "start",
                    padding: "12px 0",
                    borderBottom:
                      i < ANALYZE_STEPS.length - 1
                        ? "1px solid var(--pp-line)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9999,
                      background:
                        state === "pending"
                          ? "var(--color-fill-alternative)"
                          : color,
                      color: state === "pending" ? "var(--pp-ink-dim)" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: "700 12px/1 var(--font-base)",
                      flexShrink: 0,
                    }}
                  >
                    {state === "done"
                      ? "✓"
                      : state === "active"
                        ? (
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 9999,
                              background: "#fff",
                              animation: "pulse 1s ease-out infinite",
                            }}
                          />
                        )
                        : s.id}
                  </div>
                  <div>
                    <div
                      style={{
                        font: "700 15px/1.4 var(--font-base)",
                        color:
                          state === "pending"
                            ? "var(--pp-ink-dim)"
                            : "var(--pp-ink)",
                      }}
                    >
                      {s.t}
                    </div>
                    <div
                      style={{
                        font: "500 12px/1.4 var(--font-base)",
                        color: "var(--pp-ink-soft)",
                        marginTop: 2,
                      }}
                    >
                      {s.d}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 실시간 수집량 카드 */}
          <div
            className="pp-card"
            style={{
              padding: 28,
              background: "var(--color-label-strong)",
              color: "#fff",
              border: "none",
            }}
          >
            <div
              style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              실시간 수집량
            </div>
            <div
              className="tnum"
              style={{
                font: "800 72px/1 var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              {totalCollected.toLocaleString()}
            </div>
            <div
              style={{
                marginTop: 8,
                font: "500 13px/1 var(--font-base)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              건의 불만·고민 수집됨
            </div>

            {/* 소스별 수집량 */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {log.slice(0, 3).map((l) => (
                <div key={l.src + (l.id || "")}>
                  <div
                    style={{
                      font: "500 11px/1 var(--font-base)",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 4,
                    }}
                  >
                    {l.src}
                  </div>
                  <div
                    className="tnum"
                    style={{ font: "700 16px/1 var(--font-base)" }}
                  >
                    {collectDone ? l.n.toLocaleString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 수집 로그 터미널 */}
          <div className="pp-card pp-log" style={{ padding: 20, minHeight: 200 }}>
            <div style={{ marginBottom: 8, color: "var(--pp-ink-dim)" }}>
              $ painpoint collect --keyword "{params.keyword}"
            </div>
            {error && (
              <div style={{ color: "var(--pp-pain)", marginBottom: 8 }}>
                ✗ {error}
              </div>
            )}
            {log.slice(0, logIdx).map((l, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span className="ok">✓</span>
                <SourceGlyph id={l.id} size={14} />
                <span className="src">{l.src}</span>
                <span>— {l.t} →</span>
                <span className="num">{l.n}</span>
                <span>posts</span>
              </div>
            ))}
            {!collectDone && !error && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ color: "var(--pp-pain)" }}>›</span>
                <span>네이버 + 유튜브 — "{params.keyword}" 수집 중</span>
                <span
                  style={{
                    marginLeft: 4,
                    animation: "pulse 1s ease-out infinite",
                  }}
                >
                  ▌
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

window.Analyzing = Analyzing;

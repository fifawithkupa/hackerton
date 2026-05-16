// Results — header + tabs shell
function Results({ params, analysisResult, existingReportId, user, onBack }) {
  const fallback = window.PP_DATA.result;
  const D = React.useMemo(() => {
    if (!analysisResult) return { ...fallback, keyword: params.keyword || fallback.keyword };
    // Gemini 결과에 ideas가 없으면 fallback 아이디어 주입
    if (!analysisResult.ideas?.length && fallback.ideas?.length) {
      return { ...analysisResult, ideas: fallback.ideas };
    }
    return analysisResult;
  }, [analysisResult, params.keyword]);

  const [tab, setTab] = React.useState("painpoints");
  const [selectedIdea, setSelectedIdea] = React.useState(D.ideas[0]?.id || null);
  const [savedIdeas, setSavedIdeas] = React.useState({});
  const [reportSaved, setReportSaved] = React.useState(false);
  const [dbReportId, setDbReportId] = React.useState(null);
  // existingReportId를 ref로 추적해 저장 스킵 여부를 동기적으로 판단
  const existingReportIdRef = React.useRef(existingReportId);
  existingReportIdRef.current = existingReportId;

  React.useEffect(() => {
    setSelectedIdea(D.ideas[0]?.id);
  }, [D]);

  // 새 분석 결과만 Supabase에 저장 (기존 리포트 재열기는 저장 안 함)
  React.useEffect(() => {
    if (!user || !analysisResult || existingReportIdRef.current) return;
    SupaReports.save(user.id, {
      keyword:      D.keyword,
      verdict:      D.verdict,
      verdict_tone: D.verdictTone,
      collected:    D.totalCollected,
      ideas_count:  D.ideas.length,
      result_json:  D,
    }).then(({ data, error }) => {
      if (error) {
        console.error("[SSATIS] 리포트 저장 실패:", error);
        showToast("리포트 저장 실패: " + (error.message || "알 수 없는 오류"), "error");
      } else if (data) {
        setDbReportId(data.id);
      }
    });
  }, [user?.id, analysisResult]);

  const toggleSaved = (id) => {
    setSavedIdeas(s => {
      const next = { ...s, [id]: !s[id] };
      showToast(next[id] ? "아이디어가 저장됐어요 ★" : "저장을 해제했습니다", next[id] ? "success" : "default");
      return next;
    });
  };

  const handleSaveReport = async () => {
    const next = !reportSaved;
    setReportSaved(next);
    if (dbReportId) await SupaReports.toggleStar(dbReportId, next);
    showToast(next ? "리포트가 저장됐어요 ★" : "리포트 저장을 해제했습니다", next ? "success" : "default");
  };

  const handleShare = () => {
    const text = `SSATIS 분석 결과 — "${D.keyword}" 산업 페인포인트 리포트`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showToast("링크가 클립보드에 복사됐어요!", "success"));
    } else {
      showToast("공유 링크: " + text, "default");
    }
  };

  const handlePDF = () => {
    setTab("report");
    setTimeout(() => window.print(), 300);
  };

  const hasIdeas = D.ideas.length > 0;
  const collectedSources = React.useMemo(() => {
    const fromPp = window.PP_DATA?.sources;
    if (Array.isArray(fromPp) && fromPp.length) return fromPp;
    return (D.log || []).map((l) => ({
      id: l.id,
      name: l.src,
      posts: l.n,
    }));
  }, [D.log]);
  const tabs = [
    { id: "painpoints",  label: "페인포인트",     count: D.painpoints.length },
    ...(hasIdeas ? [
      { id: "ideas",       label: "아이디어",       count: D.ideas.length },
      { id: "competitors", label: "경쟁자·차별점", count: D.ideas.reduce((a, i) => a + i.competitors.length, 0) },
    ] : []),
    { id: "report",      label: "리포트" },
  ];

  return (
    <main className="fade-in" style={{
      maxWidth: 1280, margin: "0 auto",
      padding: "32px 40px 80px",
    }}>
      {/* —— breadcrumb / back —— */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 16,
        font: "500 13px/1 var(--font-base)",
        color: "var(--pp-ink-soft)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 0, color: "inherit", font: "inherit",
          transition: "color 100ms ease-out",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--pp-ink)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--pp-ink-soft)"}>
          탐색
        </button>
        <span>›</span>
        <span>분석 결과</span>
        <span>›</span>
        <span style={{ color: "var(--pp-ink)", fontWeight: 600 }}>"{D.keyword}"</span>
      </div>

      {/* —— header —— */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 24,
        marginBottom: 28,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 8,
          }}>
            <VerdictBadge verdict={D.verdict} tone={D.verdictTone} size="lg" />
            <span style={{
              font: "500 13px/1 var(--font-base)",
              color: "var(--pp-ink-dim)",
            }}>분석 완료 · {D.analyzedAt}</span>
          </div>
          <h1 style={{
            margin: 0,
            font: "800 44px/1.12 var(--font-display)",
            letterSpacing: "-0.028em",
            color: "var(--color-label-strong)",
          }}>
            "{D.keyword}" 산업 페인포인트 리포트
          </h1>
          <div style={{
            marginTop: 12,
            display: "flex", gap: 28, flexWrap: "wrap",
          }}>
            <Stat label="수집 글" value={D.totalCollected.toLocaleString()} suffix="건" />
            <Stat label="유효 글 (필터 후)" value={D.afterFilter.toLocaleString()} suffix="건" />
            <Stat label="페인포인트" value={D.painpoints.length} />
            <Stat label="생성된 아이디어" value={D.ideas.length} />
            <Stat label="조사된 경쟁자" value={D.ideas.reduce((a,i)=>a+i.competitors.length, 0)} />
          </div>
          {collectedSources.length > 0 && (
            <div style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}>
              <span style={{
                font: "600 12px/1 var(--font-base)",
                color: "var(--pp-ink-dim)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                marginRight: 4,
              }}>
                수집 소스
              </span>
              {collectedSources.map((s) => (
                <span key={s.id} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 9999,
                  border: "1px solid var(--pp-line)",
                  background: "var(--pp-surface-soft)",
                  font: "600 12px/1 var(--font-base)",
                  color: "var(--pp-ink)",
                }}>
                  <SourceGlyph id={s.id} size={16} />
                  {s.name}
                  <span className="tnum" style={{ color: "var(--pp-ink-soft)" }}>
                    {(s.posts ?? 0).toLocaleString()}건
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="pp-btn" data-variant="ghost" data-size="sm"
                  onClick={handleSaveReport}>
            {reportSaved ? "★ 저장됨" : "☆ 저장"}
          </button>
          <button className="pp-btn" data-variant="ghost" data-size="sm" onClick={handleShare}>
            ↗ 공유
          </button>
          <button className="pp-btn" data-variant="brand" data-size="sm"
                  onClick={handlePDF}>
            PDF 다운로드
          </button>
        </div>
      </div>

      {/* —— tabs —— */}
      <div className="pp-tabs" style={{ marginBottom: 28 }}>
        {tabs.map(t => (
          <button key={t.id} className="pp-tab"
                  data-active={tab === t.id}
                  onClick={() => setTab(t.id)}>
            {t.label}
            {t.count != null && <span className="count tnum">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* —— content —— */}
      {tab === "painpoints"  && <Painpoints  data={D} />}
      {tab === "ideas"       && <Ideas       data={D} saved={savedIdeas} onToggleSave={toggleSaved}
                                              onPickCompetitors={(id) => { setSelectedIdea(id); setTab("competitors"); }} />}
      {tab === "competitors" && <Competitors data={D} selectedId={selectedIdea} onSelect={setSelectedIdea} />}
      {tab === "report"      && <Report      data={D} user={user} />}
    </main>
  );
}

window.Results = Results;

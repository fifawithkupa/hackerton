// Dashboard — 내 리포트 (Supabase 연동)
function Dashboard({ user, onNav, onOpenReport }) {
  const [reports, setReports]   = React.useState([]);
  const [loading, setLoading]   = React.useState(true);
  const [view,    setView]      = React.useState("grid");
  const [filter,  setFilter]    = React.useState("all");

  // 리포트 로드
  React.useEffect(() => {
    if (!user) return;
    SupaReports.list(user.id).then(({ data, error }) => {
      if (error) {
        console.error("[SSATIS] 리포트 목록 로드 실패:", error);
        const isAuthError = error.message?.toLowerCase().includes("jwt") ||
                            error.code === "PGRST301" ||
                            error.status === 401;
        if (isAuthError) {
          showToast("세션이 만료됐습니다. 다시 로그인해 주세요.", "error");
        } else {
          showToast("리포트 불러오기 실패: " + error.message, "error");
        }
      } else {
        setReports(data || []);
      }
      setLoading(false);
    });
  }, [user?.id]);

  const filtered = reports.filter(r =>
    filter === "all"    ? true :
    filter === "saved"  ? r.starred :
    r.share === "공개"
  );

  const toggleStar = async (r) => {
    const next = !r.starred;
    setReports(rs => rs.map(x => x.id === r.id ? { ...x, starred: next } : x));
    await SupaReports.toggleStar(r.id, next);
    showToast(next ? "리포트를 저장했어요 ★" : "저장을 해제했습니다");
  };

  const deleteReport = async (r) => {
    if (!confirm(`"${r.keyword}" 리포트를 삭제할까요?`)) return;
    setReports(rs => rs.filter(x => x.id !== r.id));
    await SupaReports.delete(r.id);
    showToast("리포트가 삭제됐습니다");
  };

  const usage = {
    used:  reports.length,
    total: user?.plan === "Free" ? 3 : "∞",
  };

  // 날짜 포맷 (ISO → YYYY-MM-DD)
  const fmt = (iso) => iso ? iso.slice(0, 10) : "";

  return (
    <main className="fade-in" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 40px 80px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1 var(--font-base)", color: "var(--pp-ink-dim)", marginBottom: 8 }}>
            안녕하세요, {user?.name}님
          </div>
          <h1 style={{ margin: 0, font: "800 40px/1.1 var(--font-display)", letterSpacing: "-0.025em", color: "var(--color-label-strong)" }}>
            내 리포트
          </h1>
        </div>
        <button onClick={() => onNav("landing")} className="pp-btn" data-variant="primary">
          + 새 분석 시작
        </button>
      </div>

      {/* usage strip */}
      <div className="pp-card-soft" style={{
        padding: 20, marginBottom: 24,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
        alignItems: "center",
      }}>
        <Stat label="이번 달 리포트" value={`${usage.used} / ${usage.total}`} />
        <Stat label="저장된 아이디어" value={reports.filter(r => r.starred).length} />
        <Stat label="공유 중인 리포트" value={reports.filter(r => r.share === "공개").length} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {user?.plan === "Free" && (
            <>
              <div style={{
                width: "100%", height: 6, borderRadius: 4,
                background: "var(--color-fill-alternative)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min((usage.used / 3) * 100, 100)}%`, height: "100%",
                  background: usage.used >= 3 ? "var(--pp-neg)" : "var(--pp-pain)",
                  transition: "width 600ms ease-out",
                }} />
              </div>
              <button onClick={() => onNav("pricing")} className="pp-btn" data-variant="brand" data-size="sm">
                Pro로 업그레이드
              </button>
            </>
          )}
        </div>
      </div>

      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div className="pp-tabs" style={{ borderBottom: "none" }}>
          {[
            { id: "all",    label: "전체",   count: reports.length },
            { id: "saved",  label: "저장됨", count: reports.filter(r => r.starred).length },
            { id: "public", label: "공유 중", count: reports.filter(r => r.share === "공개").length },
          ].map(t => (
            <button key={t.id} className="pp-tab" data-active={filter === t.id} onClick={() => setFilter(t.id)}>
              {t.label}
              <span className="count tnum">{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", padding: 4, background: "var(--pp-surface-soft)", borderRadius: 8 }}>
          {[{ id: "grid", glyph: "▦" }, { id: "list", glyph: "≡" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              all: "unset", cursor: "pointer",
              padding: "6px 12px", borderRadius: 6,
              background: view === v.id ? "#fff" : "transparent",
              boxShadow: view === v.id ? "0 1px 2px rgba(23,23,25,0.06)" : "none",
              font: "600 13px/1 var(--font-base)",
              color: view === v.id ? "var(--pp-ink)" : "var(--pp-ink-soft)",
            }}>{v.glyph}</button>
          ))}
        </div>
      </div>

      {/* loading */}
      {loading && (
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--pp-ink-dim)", font: "500 14px/1 var(--font-base)" }}>
          리포트 불러오는 중…
        </div>
      )}

      {/* content */}
      {!loading && view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map(r => (
            <div key={r.id} className="pp-card" style={{
              padding: 24, cursor: "pointer",
              transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
              position: "relative",
            }}
            onClick={() => onOpenReport(r)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(23,23,25,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <VerdictBadge verdict={r.verdict} tone={r.verdict_tone} />
                <span style={{ font: "500 11px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>{fmt(r.created_at)}</span>
              </div>
              <div style={{ font: "800 22px/1.2 var(--font-display)", letterSpacing: "-0.018em", color: "var(--pp-ink)", marginBottom: 16 }}>
                "{r.keyword}"
              </div>
              <div style={{ display: "flex", gap: 16, paddingTop: 16, borderTop: "1px solid var(--pp-line)" }}>
                <Stat label="수집" value={(r.collected || 0).toLocaleString()} />
                <Stat label="아이디어" value={r.ideas_count || 0} />
                <div style={{ flex: 1 }} />
                <button onClick={e => { e.stopPropagation(); toggleStar(r); }} style={{
                  all: "unset", cursor: "pointer",
                  font: "700 16px/1 var(--font-base)",
                  color: r.starred ? "var(--pp-pain)" : "var(--pp-ink-dim)",
                }}>{r.starred ? "★" : "☆"}</button>
              </div>
            </div>
          ))}

          {/* 새 분석 카드 */}
          <button onClick={() => onNav("landing")} style={{
            all: "unset", cursor: "pointer",
            padding: 24, borderRadius: 20,
            border: "1.5px dashed var(--pp-line-strong)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: 200,
            color: "var(--pp-ink-soft)",
            transition: "all 150ms ease-out",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--pp-ink)"; e.currentTarget.style.color = "var(--pp-ink)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--pp-line-strong)"; e.currentTarget.style.color = "var(--pp-ink-soft)"; }}>
            <div style={{
              width: 48, height: 48, borderRadius: 9999,
              background: "var(--pp-surface-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              font: "700 22px/1 var(--font-base)", marginBottom: 12,
            }}>+</div>
            <div style={{ font: "600 15px/1.4 var(--font-base)", textAlign: "center" }}>새 키워드 분석</div>
          </button>
        </div>
      )}

      {!loading && view === "list" && (
        <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--pp-surface-soft)" }}>
                {["키워드", "분석일", "판정", "수집", "아이디어", "공유", ""].map((h, i) => (
                  <th key={h + i} style={{
                    font: "700 11px/1 var(--font-base)", letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--pp-ink-dim)",
                    textAlign: i >= 3 && i <= 4 ? "right" : "left",
                    padding: "14px 20px",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
                  cursor: "pointer",
                }} onClick={() => onOpenReport(r)}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ font: "700 15px/1.3 var(--font-base)", color: "var(--pp-ink)", display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); toggleStar(r); }} style={{
                        all: "unset", cursor: "pointer", color: r.starred ? "var(--pp-pain)" : "var(--pp-ink-dim)",
                      }}>{r.starred ? "★" : "☆"}</button>
                      "{r.keyword}"
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", color: "var(--pp-ink-soft)" }}>{fmt(r.created_at)}</td>
                  <td style={{ padding: "16px 20px" }}><VerdictBadge verdict={r.verdict} tone={r.verdict_tone} /></td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }} className="tnum">{(r.collected || 0).toLocaleString()}</td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }} className="tnum">{r.ideas_count || 0}</td>
                  <td style={{ padding: "16px 20px" }}><span className="pp-pill">{r.share || "비공개"}</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <button onClick={e => { e.stopPropagation(); deleteReport(r); }} style={{
                      all: "unset", cursor: "pointer",
                      font: "500 12px/1 var(--font-base)", color: "var(--pp-neg)",
                    }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--pp-ink-dim)", font: "500 14px/1 var(--font-base)" }}>
              리포트가 없습니다.
            </div>
          )}
        </div>
      )}
    </main>
  );
}

window.Dashboard = Dashboard;

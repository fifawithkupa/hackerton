// SavedIdeas — collection of starred ideas
const DEFAULT_SAVED = [
  { id: "s1", title: "면접 피드백 자동 생성 SaaS", kw: "HR",       savedAt: "2025-11-14", verdict: "틈새 존재", tone: "violet",   note: "B2B 영업 가능성 높음. 인사 담당자 인터뷰 필요." },
  { id: "s2", title: "월세 갱신 협상 AI 코치",        kw: "부동산",   savedAt: "2025-11-12", verdict: "블루오션",  tone: "positive", note: "1인 가구 타깃, 모바일 우선." },
  { id: "s3", title: "원격 진료 처방전 자동 발급",     kw: "원격의료", savedAt: "2025-11-09", verdict: "틈새 존재", tone: "violet",   note: "규제 확인 필수. 1차 의료기관 PoC." },
  { id: "s4", title: "유아 영어 학원비 자동 비교",     kw: "유아교육", savedAt: "2025-11-04", verdict: "블루오션",  tone: "positive", note: "" },
];

function loadSaved() {
  try {
    const raw = localStorage.getItem("ssatis_saved_ideas");
    return raw ? JSON.parse(raw) : DEFAULT_SAVED;
  } catch {
    return DEFAULT_SAVED;
  }
}

function SavedIdeas({ onAnalyze }) {
  const [ideas, setIdeas] = React.useState(loadSaved);
  const [editingNote, setEditingNote] = React.useState(null);
  const [noteText, setNoteText] = React.useState("");

  const save = (updated) => {
    setIdeas(updated);
    try { localStorage.setItem("ssatis_saved_ideas", JSON.stringify(updated)); } catch {}
  };

  const removeIdea = (id) => {
    const updated = ideas.filter(s => s.id !== id);
    save(updated);
    showToast("아이디어 저장을 해제했습니다", "default");
  };

  const startEditNote = (s) => {
    setEditingNote(s.id);
    setNoteText(s.note);
  };

  const saveNote = (id) => {
    const updated = ideas.map(s => s.id === id ? { ...s, note: noteText } : s);
    save(updated);
    setEditingNote(null);
    showToast("메모가 저장됐어요", "success");
  };

  const exportCSV = () => {
    const header = "제목,키워드,판정,저장일,메모";
    const rows = ideas.map(s => `"${s.title}","${s.kw}","${s.verdict}","${s.savedAt}","${s.note}"`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ssatis-ideas.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV 다운로드를 시작합니다", "success");
  };

  return (
    <main className="fade-in" style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 40px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0,
            font: "800 40px/1.1 var(--font-display)",
            letterSpacing: "-0.025em",
          }}>저장된 아이디어</h1>
          <p style={{
            margin: "8px 0 0",
            font: "500 14px/1.5 var(--font-base)",
            color: "var(--pp-ink-soft)",
          }}>
            여러 리포트에서 좋아한 아이디어를 모아 봅니다. 메모를 추가해 컬렉션처럼 관리하세요.
          </p>
        </div>
        <button className="pp-btn" data-variant="ghost" data-size="sm" onClick={exportCSV}>
          CSV 내보내기
        </button>
      </div>

      {ideas.length === 0 ? (
        <div style={{
          padding: "80px 40px", textAlign: "center",
          color: "var(--pp-ink-soft)",
          font: "500 16px/1.5 var(--font-base)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>☆</div>
          저장된 아이디어가 없습니다.<br />
          분석 결과에서 아이디어를 저장해보세요.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ideas.map(s => (
            <div key={s.id} className="pp-card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <VerdictBadge verdict={s.verdict} tone={s.tone} />
                    <span className="pp-pill">"{s.kw}" 리포트에서</span>
                    <span className="pp-pill">{s.savedAt} 저장</span>
                  </div>
                  <h3 style={{
                    margin: "0 0 8px",
                    font: "700 20px/1.3 var(--font-display)",
                    letterSpacing: "-0.014em",
                  }}>{s.title}</h3>

                  {editingNote === s.id ? (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%", resize: "vertical",
                          border: "1px solid var(--pp-line-strong)",
                          borderRadius: 8, padding: "10px 12px",
                          font: "500 13px/1.5 var(--font-base)",
                          color: "var(--pp-ink)",
                          outline: "none", boxSizing: "border-box",
                        }}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button className="pp-btn" data-variant="primary" data-size="sm"
                                onClick={() => saveNote(s.id)}>저장</button>
                        <button className="pp-btn" data-variant="ghost" data-size="sm"
                                onClick={() => setEditingNote(null)}>취소</button>
                      </div>
                    </div>
                  ) : s.note ? (
                    <div style={{
                      padding: "10px 14px",
                      borderLeft: "3px solid var(--pp-pain)",
                      background: "var(--pp-surface-soft)",
                      borderRadius: "0 8px 8px 0",
                      font: "500 13px/1.5 var(--font-base)",
                      color: "var(--pp-ink-soft)",
                      cursor: "pointer",
                    }} onClick={() => startEditNote(s)}>
                      📝 {s.note}
                    </div>
                  ) : (
                    <button className="pp-btn" data-variant="ghost" data-size="sm"
                            style={{ marginTop: 4 }}
                            onClick={() => startEditNote(s)}>
                      + 메모 추가
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button onClick={() => onAnalyze(s.kw)} className="pp-btn"
                          data-variant="primary" data-size="sm">리포트 열기</button>
                  <button className="pp-btn" data-variant="ghost" data-size="sm"
                          onClick={() => {
                            const text = `${s.title} (${s.verdict}) — SSATIS 분석`;
                            navigator.clipboard?.writeText(text).then(() => showToast("복사됐어요!", "success"));
                          }}>공유</button>
                  <button className="pp-btn" data-variant="ghost" data-size="sm"
                          style={{ color: "var(--pp-neg)" }}
                          onClick={() => removeIdea(s.id)}>★ 해제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

window.SavedIdeas = SavedIdeas;

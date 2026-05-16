// Empty state — no data for the keyword (also: 404)
function EmptyState({ keyword, onBack, onTry }) {
  const suggestions = [
    "HR 채용",
    "원격 의료",
    "프리랜서 정산",
    "구독 해지",
    "이커머스 정산",
  ];

  return (
    <main className="fade-in" style={{
      maxWidth: 760, margin: "0 auto",
      padding: "120px 40px",
      textAlign: "center",
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 9999,
        background: "var(--pp-surface-soft)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
      }}>
        <span style={{
          font: "800 40px/1 var(--font-display)",
          color: "var(--pp-ink-dim)",
        }}>!</span>
      </div>
      <h1 style={{
        margin: "0 0 12px",
        font: "800 36px/1.2 var(--font-display)",
        letterSpacing: "-0.022em",
      }}>
        “{keyword}” 키워드는<br />
        불만 데이터가 부족합니다
      </h1>
      <p style={{
        margin: "0 0 32px",
        font: "500 16px/1.55 var(--font-base)",
        color: "var(--pp-ink-soft)",
      }}>
        지난 30일 동안 공감 5 이상을 받은 글이 충분히 발견되지 않았습니다.
        더 넓은 키워드나 상위 산업군 키워드로 다시 시도해보세요.
      </p>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
        justifyContent: "center", marginBottom: 32,
      }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => onTry(s)} style={{
            padding: "10px 16px", borderRadius: 9999,
            border: "1px solid var(--pp-line)",
            background: "#fff", cursor: "pointer",
            font: "600 13px/1 var(--font-base)",
            color: "var(--pp-ink)",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={onBack} className="pp-btn" data-variant="ghost">
          ← 돌아가기
        </button>
        <button className="pp-btn" data-variant="primary">
          이 키워드 알림 설정하기
        </button>
      </div>
    </main>
  );
}

// 404 — page not found
function NotFound({ onHome }) {
  return (
    <main className="fade-in" style={{
      maxWidth: 760, margin: "0 auto",
      padding: "120px 40px", textAlign: "center",
    }}>
      <div className="tnum" style={{
        font: "900 144px/1 var(--font-display)",
        letterSpacing: "-0.06em",
        color: "var(--pp-ink)",
      }}>404</div>
      <h1 style={{
        margin: "16px 0 12px",
        font: "800 32px/1.2 var(--font-display)",
        letterSpacing: "-0.022em",
      }}>이 페이지를 찾을 수 없습니다</h1>
      <p style={{
        margin: "0 0 32px",
        font: "500 16px/1.55 var(--font-base)",
        color: "var(--pp-ink-soft)",
      }}>
        링크가 만료되었거나 잘못된 주소입니다. 메인으로 돌아가 다시 시도해주세요.
      </p>
      <button onClick={onHome} className="pp-btn" data-variant="primary">
        홈으로 →
      </button>
    </main>
  );
}

window.EmptyState = EmptyState;
window.NotFound = NotFound;

// Trends — weekly painpoint trends across industries
const TREND_INDUSTRIES = [
  { id: "all",     name: "전체" },
  { id: "hr",      name: "HR · 채용" },
  { id: "real",    name: "부동산" },
  { id: "health",  name: "헬스케어" },
  { id: "edu",     name: "교육" },
  { id: "fin",     name: "금융" },
  { id: "retail",  name: "이커머스" },
];

const TREND_ROWS = [
  { rank: 1, kw: "면접 피드백 부재",        ind: "HR · 채용",   d: "+182%", empathy: 1247, plat: "Reddit · YouTube",  spark: [3,5,4,7,9,12,18,22] },
  { rank: 2, kw: "월세 갱신 협상 가이드 부재", ind: "부동산",    d: "+154%", empathy:  982, plat: "네이버 카페 · X",    spark: [2,4,3,6,8,11,15,19] },
  { rank: 3, kw: "원격 진료 처방전 발급",      ind: "헬스케어",  d: "+128%", empathy:  871, plat: "Reddit · X",         spark: [4,4,5,8,10,12,15,17] },
  { rank: 4, kw: "JD와 실제 업무 불일치",      ind: "HR · 채용", d: "+96%",  empathy:  834, plat: "Reddit · 네이버 카페", spark: [5,6,7,8,9,10,11,12] },
  { rank: 5, kw: "학원비 환불 분쟁",           ind: "교육",     d: "+84%",  empathy:  712, plat: "네이버 카페",         spark: [3,3,4,5,6,8,10,11] },
  { rank: 6, kw: "P2P 대출 사기 피해",         ind: "금융",     d: "+71%",  empathy:  649, plat: "Reddit · YouTube",   spark: [4,5,6,5,7,8,9,11] },
  { rank: 7, kw: "한국 셀러 정산 지연",         ind: "이커머스", d: "+58%",  empathy:  541, plat: "네이버 카페 · X",     spark: [2,3,4,5,6,7,8,9] },
  { rank: 8, kw: "이력서 작성 시간 과다",       ind: "HR · 채용", d: "+47%",  empathy:  612, plat: "네이버 카페",         spark: [5,6,5,6,7,7,8,9] },
];

function Trends({ onAnalyze, user, onNav }) {
  const [ind, setInd] = React.useState("all");
  const isFree = !user || user.plan === "Free";
  const fullList = ind === "all" ? TREND_ROWS : TREND_ROWS.filter(r =>
    r.ind === TREND_INDUSTRIES.find(i => i.id === ind)?.name
  );
  const filtered = isFree ? fullList.slice(0, 3) : fullList;
  const lockedCount = fullList.length - filtered.length;

  return (
    <main className="fade-in" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 80px" }}>
      {/* header */}
      <div style={{ marginBottom: 32 }}>
        <div className="pp-pill" data-tone="pain" style={{ marginBottom: 16 }}>
          매주 월요일 09:00 갱신 · 최근 7일 기준
        </div>
        <h1 style={{
          margin: 0,
          font: "800 56px/1.08 var(--font-display)",
          letterSpacing: "-0.03em",
          color: "var(--color-label-strong)",
        }}>이번 주 페인포인트 트렌드</h1>
        <p style={{
          margin: "16px 0 0",
          font: "500 17px/1.5 var(--font-base)",
          color: "var(--pp-ink-soft)",
          maxWidth: 720,
        }}>
          지난 주 대비 공감 수가 가장 많이 증가한 페인포인트입니다. 클릭하면 해당 키워드로 분석을 시작합니다.
        </p>
        {isFree && (
          <div style={{
            marginTop: 20,
            padding: "12px 16px",
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "var(--pp-pain-bg)",
            borderRadius: 10,
            font: "600 13px/1.4 var(--font-base)",
            color: "var(--pp-pain)",
          }}>
            🔒 Free 플랜은 Top 3까지 공개됩니다. Pro로 업그레이드하면 전체 순위를 확인할 수 있습니다.
            <button onClick={() => onNav && onNav("pricing")} className="pp-btn"
                    data-variant="brand" data-size="sm">
              Pro로 보기 →
            </button>
          </div>
        )}
      </div>

      {/* industry tabs */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: "1px solid var(--pp-line)",
      }}>
        {TREND_INDUSTRIES.map(i => (
          <button key={i.id} onClick={() => setInd(i.id)} style={{
            all: "unset", cursor: "pointer",
            padding: "8px 14px", borderRadius: 9999,
            font: "600 13px/1 var(--font-base)",
            background: ind === i.id ? "var(--color-label-strong)" : "transparent",
            color: ind === i.id ? "#fff" : "var(--pp-ink-soft)",
            border: ind === i.id ? "none" : "1px solid var(--pp-line)",
          }}>{i.name}</button>
        ))}
      </div>

      {/* top 3 — featured */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {filtered.slice(0, 3).map(r => (
          <button key={r.rank} onClick={() => onAnalyze(r.kw)} className="pp-card"
                  style={{
                    all: "unset", cursor: "pointer", display: "block",
                    padding: 24, boxSizing: "border-box",
                    background: r.rank === 1 ? "var(--color-label-strong)" : "#fff",
                    color: r.rank === 1 ? "#fff" : "inherit",
                    borderRadius: 20,
                    border: r.rank === 1 ? "none" : "1px solid var(--pp-line)",
                  }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div className="tnum" style={{
                font: "900 48px/1 var(--font-display)",
                letterSpacing: "-0.03em",
                color: r.rank === 1 ? "var(--pp-pain)" : "var(--pp-ink)",
              }}>#{r.rank}</div>
              <span className="pp-pill" data-tone={r.rank === 1 ? "pain" : "positive"}>
                ▲ {r.d}
              </span>
            </div>
            <div style={{
              font: "700 20px/1.3 var(--font-display)",
              letterSpacing: "-0.014em",
              marginBottom: 8,
              minHeight: 52,
            }}>"{r.kw}"</div>
            <div style={{
              font: "500 12px/1.4 var(--font-base)",
              color: r.rank === 1 ? "rgba(255,255,255,0.6)" : "var(--pp-ink-soft)",
              marginBottom: 16,
            }}>{r.ind} · {r.plat}</div>
            <Sparkline values={r.spark} color={r.rank === 1 ? "#FF5C1F" : "var(--pp-primary)"}
                       bg={r.rank === 1 ? "rgba(255,255,255,0.08)" : "var(--pp-surface-soft)"} />
          </button>
        ))}
      </div>

      {/* full table */}
      <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--pp-surface-soft)" }}>
              {["#", "키워드", "산업", "증가율", "공감", "주요 플랫폼", "추이", ""].map((h, i) => (
                <th key={h} style={{
                  font: "700 11px/1 var(--font-base)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--pp-ink-dim)",
                  textAlign: ["#", "증가율", "공감"].includes(h) ? "right" : "left",
                  padding: "14px 20px",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.rank} style={{
                borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
              }}>
                <td className="tnum" style={{ padding: "16px 20px", textAlign: "right",
                                              font: "700 14px/1 var(--font-base)",
                                              color: "var(--pp-ink)" }}>{r.rank}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{
                    font: "600 14px/1.3 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>"{r.kw}"</div>
                </td>
                <td style={{ padding: "16px 20px", color: "var(--pp-ink-soft)" }}>{r.ind}</td>
                <td className="tnum" style={{
                  padding: "16px 20px", textAlign: "right",
                  font: "700 14px/1 var(--font-base)",
                  color: "var(--color-atomic-green-40)",
                }}>{r.d}</td>
                <td className="tnum" style={{ padding: "16px 20px", textAlign: "right", color: "var(--pp-ink)" }}>
                  {r.empathy.toLocaleString()}
                </td>
                <td style={{ padding: "16px 20px", color: "var(--pp-ink-soft)",
                             font: "500 12px/1 var(--font-base)" }}>{r.plat}</td>
                <td style={{ padding: "12px 20px", width: 100 }}>
                  <Sparkline values={r.spark} mini />
                </td>
                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                  <button onClick={() => onAnalyze(r.kw)} className="pp-btn"
                          data-variant="ghost" data-size="sm">분석 →</button>
                </td>
              </tr>
            ))}
            {isFree && lockedCount > 0 && fullList.slice(filtered.length).map((r, i) => (
              <tr key={`locked-${r.rank}`} style={{
                borderTop: "1px solid var(--pp-line)",
                background: i % 2 === 0 ? "transparent" : "var(--pp-surface-soft)",
                filter: "blur(4px)",
                userSelect: "none", pointerEvents: "none",
                opacity: 0.6,
              }}>
                <td className="tnum" style={{ padding: "16px 20px", textAlign: "right",
                                              font: "700 14px/1 var(--font-base)",
                                              color: "var(--pp-ink)" }}>{r.rank}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{
                    font: "600 14px/1.3 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>"{r.kw}"</div>
                </td>
                <td style={{ padding: "16px 20px", color: "var(--pp-ink-soft)" }}>{r.ind}</td>
                <td className="tnum" style={{
                  padding: "16px 20px", textAlign: "right",
                  font: "700 14px/1 var(--font-base)",
                  color: "var(--color-atomic-green-40)",
                }}>{r.d}</td>
                <td className="tnum" style={{ padding: "16px 20px", textAlign: "right", color: "var(--pp-ink)" }}>
                  {r.empathy.toLocaleString()}
                </td>
                <td style={{ padding: "16px 20px", color: "var(--pp-ink-soft)",
                             font: "500 12px/1 var(--font-base)" }}>{r.plat}</td>
                <td style={{ padding: "12px 20px", width: 100 }}>
                  <Sparkline values={r.spark} mini />
                </td>
                <td style={{ padding: "16px 20px", textAlign: "right" }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isFree && lockedCount > 0 && (
          <div style={{
            position: "relative",
            padding: "24px 28px",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)",
            marginTop: -100,
            paddingTop: 100,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                font: "800 18px/1.3 var(--font-display)",
                letterSpacing: "-0.012em",
                color: "var(--pp-ink)",
                marginBottom: 4,
              }}>나머지 {lockedCount}개 트렌드 잠금 해제</div>
              <div style={{
                font: "500 13px/1.5 var(--font-base)",
                color: "var(--pp-ink-soft)",
              }}>Pro 플랜에서 전체 트렌드 + 업종별 필터 + 주간 뉴스레터를 함께 이용하세요.</div>
            </div>
            <button onClick={() => onNav && onNav("pricing")} className="pp-btn" data-variant="primary">
              Pro로 업그레이드 →
            </button>
          </div>
        )}
      </div>

      {/* subscribe band */}
      <SubscribeBand />
    </main>
  );
}

function Sparkline({ values, color = "var(--pp-primary)", bg = "var(--pp-surface-soft)", mini = false }) {
  const w = mini ? 80 : 280;
  const h = mini ? 28 : 60;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = 4;
  const xs = values.map((_, i) => pad + (i / (values.length - 1)) * (w - pad * 2));
  const ys = values.map(v => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const area = `${path} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block", background: mini ? "transparent" : bg, borderRadius: 8 }}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth={mini ? 1.5 : 2} strokeLinecap="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={mini ? 2 : 3} fill={color} />
    </svg>
  );
}

function SubscribeBand() {
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);

  const subscribe = () => {
    if (!email.includes("@")) {
      showToast("올바른 이메일 주소를 입력해주세요", "error");
      return;
    }
    setDone(true);
    showToast("구독 완료! 매주 월요일 09:00에 보내드립니다 🎉", "success");
  };

  return (
    <div style={{
      marginTop: 32, padding: 32, borderRadius: 20,
      background: "var(--pp-surface-soft)",
      display: "flex", alignItems: "center", gap: 24,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          font: "800 24px/1.2 var(--font-display)",
          letterSpacing: "-0.018em",
          color: "var(--pp-ink)",
          marginBottom: 6,
        }}>매주 월요일 09:00, 인박스로 받기</div>
        <div style={{
          font: "500 14px/1.5 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>업종별 Top 10 페인포인트와 AI가 도출한 아이디어 1개를 큐레이션해 보냅니다.</div>
      </div>
      {done ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 20px", borderRadius: 12,
          background: "var(--color-atomic-green-95)",
          color: "var(--color-atomic-green-40)",
          font: "700 14px/1 var(--font-base)",
        }}>✓ 구독됐어요!</div>
      ) : (
        <div className="pp-search" style={{ width: 380, height: 52, padding: "0 4px 0 18px" }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && subscribe()}
            placeholder="이메일 입력"
          />
          <button className="pp-btn" data-variant="primary" data-size="sm" onClick={subscribe}>구독</button>
        </div>
      )}
    </div>
  );
}

window.Trends = Trends;

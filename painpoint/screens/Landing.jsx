// Landing — keyword search entry
function Landing({ onSearch, user }) {
  const D = window.PP_DATA;
  const [kw, setKw] = React.useState("");
  const [sources, setSources] = React.useState(
    Object.fromEntries(D.sources.map(s => [s.id, s.defaultOn]))
  );
  const toggle = (id) => setSources(s => ({ ...s, [id]: !s[id] }));

  const submit = (override) => {
    const value = (override ?? kw).trim() || "HR";
    onSearch({ keyword: value, sources });
  };
  const onKeyDown = (e) => { if (e.key === "Enter") submit(); };

  const liveSources = D.sources.filter((s) => s.live);
  const sourcesOn = liveSources.filter((s) => sources[s.id]).length;
  const sourcesTotal = liveSources.length;

  return (
    <main className="fade-in" style={{
      maxWidth: 1180, margin: "0 auto",
      padding: "72px 40px 120px",
    }}>
      {/* —— eyebrow —— */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 12px 6px 8px",
        borderRadius: 9999,
        background: "var(--pp-pain-bg)",
        color: "var(--pp-pain)",
        font: "600 12px/1 var(--font-base)",
        letterSpacing: "0.01em",
        marginBottom: 24,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 9999,
          background: "var(--pp-pain)",
          animation: "pulse 2s ease-out infinite",
        }} />
        실시간 커뮤니티 데이터 기반 · 검증된 페인포인트만
      </div>

      {/* —— hero —— */}
      <h1 style={{
        font: "800 64px/1.08 var(--font-display)",
        letterSpacing: "-0.034em",
        margin: 0,
        color: "var(--color-label-strong)",
      }}>
        실제 불만에서<br />
        창업 아이디어를{" "}
        <em style={{
          fontStyle: "normal",
          background: "linear-gradient(180deg, transparent 65%, rgba(255,92,31,0.22) 65%)",
          padding: "0 4px",
        }}>발견</em>합니다.
      </h1>
      <p style={{
        margin: "24px 0 48px",
        font: "500 19px/1.55 var(--font-base)",
        letterSpacing: "-0.005em",
        color: "var(--pp-ink-soft)",
        maxWidth: 720,
      }}>
        실시간 커뮤니티 데이터에서 검증된 페인포인트를 발견하고,
        실행 가능한 아이디어·경쟁자·차별점까지 한 번에 제공합니다.
      </p>

      {/* —— search bar —— */}
      <div className="pp-search" style={{ maxWidth: 820 }}>
        <span style={{ fontSize: 20, color: "var(--pp-ink-soft)" }}>⌕</span>
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="키워드 또는 산업군 입력  (예: HR, 부동산, 의료)"
          autoFocus
        />
        <button className="pp-btn" data-variant="primary" onClick={() => submit()}>
          {user ? "분석 시작 →" : "무료로 시작하기 →"}
        </button>
      </div>

      {/* —— source toggles —— */}
      <div style={{
        marginTop: 24,
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          font: "600 12px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          marginRight: 4,
        }}>
          수집 소스 · {sourcesOn} / {sourcesTotal} (실시간)
        </span>
        {D.sources.map(s => {
          const on = sources[s.id];
          const isLive = Boolean(s.live);
          return (
            <button key={s.id}
              onClick={() => isLive && toggle(s.id)}
              disabled={!isLive}
              title={isLive ? undefined : "준비 중 — 현재는 네이버·유튜브만 실시간 수집됩니다"}
              style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 34, padding: "0 14px",
              borderRadius: 9999,
              border: on && isLive ? "1px solid var(--color-label-strong)" : "1px solid var(--pp-line)",
              background: on && isLive ? "var(--color-label-strong)" : "#fff",
              color: !isLive ? "var(--pp-ink-dim)" : on ? "#fff" : "var(--pp-ink-soft)",
              font: "600 13px/1 var(--font-base)",
              letterSpacing: "0.005em",
              cursor: isLive ? "pointer" : "not-allowed",
              opacity: isLive ? 1 : 0.55,
              transition: "all 150ms ease-out",
            }}>
              <SourceGlyph id={s.id} size={18} />
              {s.name}
              {!isLive && (
                <span style={{
                  font: "700 9px/1 var(--font-base)",
                  letterSpacing: "0.06em",
                  color: "var(--pp-ink-dim)",
                }}>준비 중</span>
              )}
              {isLive && !s.free && (
                <span style={{
                  font: "700 9px/1 var(--font-base)",
                  letterSpacing: "0.06em",
                  color: on ? "rgba(255,255,255,0.6)" : "var(--pp-ink-dim)",
                }}>API</span>
              )}
            </button>
          );
        })}
      </div>

      {/* —— trending keywords —— */}
      <div style={{
        marginTop: 16,
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{
          font: "600 12px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          marginRight: 4,
        }}>
          이번 주 급상승
        </span>
        {D.trendingKeywords.map(t => (
          <button key={t.kw} onClick={() => submit(t.kw)} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            height: 34, padding: "0 14px",
            borderRadius: 9999,
            border: "1px solid var(--pp-line)",
            background: "#fff", cursor: "pointer",
            font: "600 13px/1 var(--font-base)",
            color: "var(--pp-ink)",
            transition: "all 150ms ease-out",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-fill-normal)"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            {t.kw}
            <span style={{
              font: "700 11px/1 var(--font-base)",
              color: "var(--color-atomic-green-40)",
            }}>{t.delta}</span>
          </button>
        ))}
      </div>

      {/* —— how it works strip —— */}
      <div style={{
        marginTop: 96,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        borderTop: "1px solid var(--pp-line)",
        paddingTop: 48,
      }}>
        {[
          { n: "01", t: "수집",        d: "네이버(블로그·카페·지식인) · 유튜브 댓글에서 키워드 관련 불만 글을 실시간 수집합니다." },
          { n: "02", t: "클러스터링",  d: "공감 수·댓글 수·반복 등장으로 가중치를 매겨 상위 페인포인트 3~5개로 압축합니다." },
          { n: "03", t: "아이디어",    d: "각 페인포인트에 대해 타깃·수익모델·MVP까지 포함한 실행 가능한 아이디어를 생성합니다." },
          { n: "04", t: "경쟁·차별점", d: "국내·해외 경쟁자를 자동 조사해 블루오션 / 틈새 / 레드오션을 판정하고 차별점을 제시합니다." },
        ].map(s => (
          <div key={s.n} style={{ padding: "0 24px 0 0" }}>
            <div style={{
              font: "800 11px/1 var(--font-base)",
              letterSpacing: "0.08em",
              color: "var(--pp-pain)",
              marginBottom: 12,
            }}>{s.n}</div>
            <div style={{
              font: "700 18px/1.3 var(--font-display)",
              letterSpacing: "-0.015em",
              color: "var(--pp-ink)",
              marginBottom: 8,
            }}>{s.t}</div>
            <p style={{
              font: "500 13px/1.6 var(--font-base)",
              letterSpacing: "0.005em",
              color: "var(--pp-ink-soft)",
              margin: 0,
            }}>{s.d}</p>
          </div>
        ))}
      </div>

      {/* —— social proof / live ticker —— */}
      <div style={{
        marginTop: 48,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
      }}>
        <AnimStat label="분석 완료된 키워드" value={12481} />
        <AnimStat label="발견된 페인포인트"  value={48927} />
        <AnimStat label="생성된 아이디어"    value={187442} />
        <AnimStat label="다운로드된 리포트"  value={31206} />
      </div>

      {/* —— testimonials —— */}
      <div style={{
        marginTop: 80,
        borderTop: "1px solid var(--pp-line)",
        paddingTop: 48,
      }}>
        <div style={{
          font: "700 12px/1 var(--font-base)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--pp-ink-dim)",
          marginBottom: 28,
          textAlign: "center",
        }}>실제 사용자 후기</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { q: "\"아이디어 검증에 2주 걸리던 게 2시간으로 줄었어요. 이게 진짜 창업 도구다.\"", name: "김*형", role: "서울대 창업지원단 졸업팀" },
            { q: "\"경쟁자 조사 파트가 특히 좋았습니다. 내가 놓친 경쟁자를 세 개나 발견했어요.\"", name: "이*연", role: "Y Combinator 인터뷰 준비 중" },
            { q: "\"무료 플랜만으로도 첫 MVP 방향 잡는데 충분했습니다. Pro로 업그레이드 고민 중.\"", name: "박*우", role: "사이드 프로젝트 개발자" },
          ].map((t, i) => (
            <div key={i} className="pp-card-soft" style={{ padding: 24 }}>
              <div style={{
                font: "500 14px/1.65 var(--font-base)",
                color: "var(--pp-ink)",
                marginBottom: 16,
              }}>{t.q}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 9999,
                  background: ["#0066FF", "#6541F2", "#FF5C1F"][i],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", font: "700 14px/1 var(--font-base)",
                  flexShrink: 0,
                }}>{t.name[0]}</span>
                <div>
                  <div style={{ font: "700 13px/1.3 var(--font-base)", color: "var(--pp-ink)" }}>{t.name}</div>
                  <div style={{ font: "500 12px/1.3 var(--font-base)", color: "var(--pp-ink-soft)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* —— CTA band —— */}
      <div style={{
        marginTop: 80,
        padding: "56px 64px",
        borderRadius: 24,
        background: "var(--color-label-strong)",
        color: "#fff",
        display: "flex", alignItems: "center",
        gap: 40,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -80, top: -80,
          width: 360, height: 360, borderRadius: 9999,
          background: "radial-gradient(circle, rgba(255,92,31,0.3) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ flex: 1 }}>
          <h2 style={{
            margin: "0 0 12px",
            font: "800 40px/1.1 var(--font-display)",
            letterSpacing: "-0.025em",
          }}>지금 바로 시작해보세요</h2>
          <p style={{
            margin: 0,
            font: "500 16px/1.55 var(--font-base)",
            color: "rgba(255,255,255,0.65)",
          }}>
            무료로 키워드 3개를 분석할 수 있습니다. 신용카드 필요 없음.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="pp-btn" data-variant="brand" onClick={() => submit("HR")}
                  style={{ height: 52, padding: "0 28px", fontSize: 16 }}>
            무료로 시작하기 →
          </button>
          <button className="pp-btn" style={{
            height: 52, padding: "0 24px",
            background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12,
            font: "600 15px/1 var(--font-base)", cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
            가격 보기
          </button>
        </div>
      </div>
    </main>
  );
}

window.Landing = Landing;

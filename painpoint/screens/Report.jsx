// Report — 1-page printable report
function Report({ data, user }) {
  const lead = data.ideas[0];
  const lp = data.painpoints.find(p => p.id === lead.linkedPainpoint);

  const isPro = user?.plan && user.plan !== "Free";

  const [ycData, setYcData]           = React.useState(null);
  const [ycLoading, setYcLoading]     = React.useState(false);
  const [mktData, setMktData]         = React.useState(null);
  const [mktLoading, setMktLoading]   = React.useState(false);

  React.useEffect(() => {
    if (!isPro || !data.painpoints?.[0]) return;
    const queryText = `${data.painpoints[0].title}. ${data.keyword}`;
    setYcLoading(true);
    fetch("/api/premium/yc-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textQuery: queryText, userId: user?.id }),
    })
      .then(r => r.json())
      .then(d => { if (!d.error) setYcData(d); })
      .catch(() => {})
      .finally(() => setYcLoading(false));
  }, []);

  React.useEffect(() => {
    if (!isPro) return;
    setMktLoading(true);
    fetch("/api/premium/market-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: data.keyword, userId: user?.id }),
    })
      .then(r => r.json())
      .then(d => { if (!d.error) setMktData(d); })
      .catch(() => {})
      .finally(() => setMktLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px",
        background: "var(--pp-surface-soft)",
        borderRadius: 12,
      }}>
        <span style={{
          font: "700 13px/1 var(--font-base)",
          color: "var(--pp-ink)",
        }}>1페이지 리포트 미리보기</span>
        <span style={{
          font: "500 13px/1 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>· A4 비율 · 워터마크 포함</span>
        <div style={{ flex: 1 }} />
        <button className="pp-btn" data-variant="ghost" data-size="sm">링크 복사</button>
        <button className="pp-btn" data-variant="ghost" data-size="sm">노션으로 보내기</button>
        <button className="pp-btn" data-variant="brand" data-size="sm">PDF 다운로드</button>
      </div>

      {/* The report page */}
      <div style={{
        width: 1000, margin: "0 auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 0 rgba(23,23,25,0.04), 0 12px 36px rgba(23,23,25,0.10)",
        padding: "48px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* watermark */}
        <div style={{
          position: "absolute", right: -40, bottom: -40,
          font: "900 220px/1 var(--font-display)",
          letterSpacing: "-0.05em",
          color: "rgba(112,115,124,0.04)",
          pointerEvents: "none",
        }}>PP.</div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 24,
          paddingBottom: 20,
          borderBottom: "2px solid var(--color-label-strong)",
        }}>
          <div style={{ flex: 1 }}>
            <Wordmark />
            <h1 style={{
              margin: "16px 0 8px",
              font: "800 36px/1.15 var(--font-display)",
              letterSpacing: "-0.025em",
              color: "var(--color-label-strong)",
            }}>
              “{data.keyword}” 산업 페인포인트 리포트
            </h1>
            <div style={{
              font: "500 13px/1.4 var(--font-base)",
              color: "var(--pp-ink-soft)",
            }}>
              발행일: {data.analyzedAt} · 데이터 수집 {data.totalCollected.toLocaleString()}건 (유효 {data.afterFilter.toLocaleString()}건)
            </div>
          </div>
          <VerdictBadge verdict={data.verdict} tone={data.verdictTone} size="lg" />
        </div>

        {/* Section: Top painpoints */}
        <Section title="01  상위 페인포인트">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {data.painpoints.map(p => (
              <div key={p.id} style={{
                padding: 16,
                background: "var(--pp-surface-soft)",
                borderRadius: 12,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 8,
                }}>
                  <span className="tnum" style={{
                    font: "800 14px/1 var(--font-display)",
                    color: "var(--pp-pain)",
                  }}>#{p.rank}</span>
                  <Severity level={p.severity} />
                </div>
                <div style={{
                  font: "700 14px/1.4 var(--font-display)",
                  letterSpacing: "-0.008em",
                  color: "var(--pp-ink)",
                  marginBottom: 8,
                  minHeight: 40,
                }}>"{p.title}"</div>
                <div style={{
                  display: "flex", gap: 10,
                  font: "600 11px/1 var(--font-base)",
                  color: "var(--pp-ink-soft)",
                }}>
                  <span>♥ <span className="tnum" style={{ color: "var(--pp-ink)" }}>{p.empathy.toLocaleString()}</span></span>
                  <span>💬 <span className="tnum" style={{ color: "var(--pp-ink)" }}>{p.comments.toLocaleString()}</span></span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section: Lead idea */}
        <Section title="02  추천 아이디어">
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <span className="tnum" style={{
                  font: "800 14px/1 var(--font-display)",
                  color: "var(--pp-primary)",
                }}>I{lead.rank}</span>
                <VerdictBadge verdict={lead.verdict} tone={lead.verdictTone} />
                <span className="pp-pill">페인포인트 #{lp?.rank} 해결</span>
              </div>
              <h3 style={{
                margin: "0 0 6px",
                font: "800 22px/1.25 var(--font-display)",
                letterSpacing: "-0.018em",
                color: "var(--pp-ink)",
              }}>{lead.title}</h3>
              <p style={{
                margin: "0 0 16px",
                font: "500 14px/1.55 var(--font-base)",
                color: "var(--pp-ink-soft)",
              }}>{lead.oneliner}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MiniField label="타깃 고객" value={lead.target} />
                <MiniField label="수익 모델" value={lead.revenue} />
                <MiniField label="시장 규모" value={lead.market} colspan={2} />
              </div>
            </div>

            <div style={{
              padding: 16,
              background: "var(--pp-surface-soft)",
              borderRadius: 12,
            }}>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>MVP — 1주일 안 출시</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lead.mvp.map((m, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "16px 1fr", gap: 8,
                    font: "500 12px/1.4 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>
                    <span style={{ color: "var(--pp-pain)", fontWeight: 700 }}>0{i + 1}</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Competitors */}
        <Section title="03  경쟁자 요약 + 차별점">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-ink-dim)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>주요 경쟁자</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {lead.competitors.map((c, i) => (
                  <div key={c.name} style={{
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 8, alignItems: "baseline",
                  }}>
                    <div style={{
                      font: "700 13px/1.3 var(--font-base)",
                      color: "var(--pp-ink)",
                    }}>{c.name}</div>
                    <div style={{
                      font: "500 11px/1.4 var(--font-base)",
                      color: "var(--pp-ink-soft)",
                    }}>{c.weakness}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{
                font: "700 11px/1 var(--font-base)",
                letterSpacing: "0.08em",
                color: "var(--pp-pain)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>우리만의 차별점</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lead.moats.map((m, i) => (
                  <div key={i} style={{
                    padding: "10px 12px",
                    background: "var(--pp-pain-bg)",
                    borderRadius: 8,
                    font: "600 12px/1.4 var(--font-base)",
                    color: "var(--pp-pain)",
                  }}>
                    {String(i + 1).padStart(2, "0")} · {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section 04: 시장 트렌드 */}
        <Section title="04  시장 트렌드 · Pro">
          {isPro ? (
            mktLoading ? <ProSkeleton label="Google Trends 데이터 불러오는 중…" /> :
            mktData    ? <MarketSection data={mktData} /> :
            <ProEmpty label="트렌드 데이터를 불러오지 못했습니다." />
          ) : (
            <ProLocked label="Google Trends · 네이버 데이터랩 성장률 그래프" />
          )}
        </Section>

        {/* Section 05: YC 인사이트 */}
        <Section title="05  YC 인사이트 · Pro">
          {isPro ? (
            ycLoading ? <ProSkeleton label="유사 YC 스타트업 검색 중…" /> :
            ycData    ? <YCSection data={ycData} /> :
            <ProEmpty label="YC 데이터를 불러오지 못했습니다." />
          ) : (
            <ProLocked label="이 페인포인트를 먼저 해결한 YC 졸업사 + YC가 원하는 스타트업" />
          )}
        </Section>

        {/* footer */}
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid var(--pp-line)",
          display: "flex", alignItems: "center",
          font: "500 11px/1.4 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>
          <span>PAINPOINT v1.0 · 실제 커뮤니티 불만 기반 창업 아이디어 발굴 플랫폼</span>
          <div style={{ flex: 1 }} />
          <span>painpoint.kr / r/{data.keyword.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{
        margin: "0 0 16px",
        font: "800 12px/1 var(--font-base)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-label-strong)",
      }}>{title}</h2>
      {children}
    </section>
  );
}

function MiniField({ label, value, colspan }) {
  return (
    <div style={{ gridColumn: colspan ? `span ${colspan}` : undefined }}>
      <div style={{
        font: "700 10px/1 var(--font-base)",
        letterSpacing: "0.08em",
        color: "var(--pp-ink-dim)",
        textTransform: "uppercase",
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        font: "600 13px/1.4 var(--font-base)",
        color: "var(--pp-ink)",
      }}>{value}</div>
    </div>
  );
}

// ── Pro 공통 UI ─────────────────────────────────────────────────────────────

function ProSkeleton({ label }) {
  return (
    <div style={{
      padding: "20px 0",
      display: "flex", alignItems: "center", gap: 10,
      font: "500 13px/1 var(--font-base)",
      color: "var(--pp-ink-dim)",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        border: "2px solid var(--pp-pain)",
        borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
      {label}
    </div>
  );
}

function ProEmpty({ label }) {
  return (
    <div style={{
      padding: "16px 0",
      font: "500 12px/1.5 var(--font-base)",
      color: "var(--pp-ink-dim)",
    }}>{label}</div>
  );
}

function ProLocked({ label }) {
  return (
    <div style={{
      padding: "20px 16px",
      borderRadius: 12,
      background: "var(--pp-surface-soft)",
      border: "1px dashed var(--pp-line)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div>
        <div style={{
          font: "600 13px/1.5 var(--font-base)",
          color: "var(--pp-ink-soft)",
          marginBottom: 4,
        }}>{label}</div>
        <div style={{
          font: "500 11px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>Pro 플랜에서 이용 가능합니다</div>
      </div>
      <div style={{
        flexShrink: 0,
        padding: "8px 16px",
        borderRadius: 8,
        background: "var(--pp-pain)",
        color: "#fff",
        font: "700 12px/1 var(--font-base)",
        cursor: "default",
      }}>Pro로 업그레이드</div>
    </div>
  );
}

// ── 시장 트렌드 섹션 ────────────────────────────────────────────────────────

function Sparkline({ values }) {
  if (!values?.length) return null;
  const nums = values.map(v => v.value ?? v.ratio ?? 0);
  const max = Math.max(...nums, 1);
  const w = 120, h = 32;
  const pts = nums.map((v, i) => {
    const x = (i / (nums.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="var(--pp-pain)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarketSection({ data }) {
  const g = data.google_trend;
  const n = data.naver_trend;
  const growth = data.growth_rate;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Google Trends */}
      <div style={{ padding: 16, background: "var(--pp-surface-soft)", borderRadius: 12 }}>
        <div style={{
          font: "700 10px/1 var(--font-base)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--pp-ink-dim)",
          marginBottom: 10,
        }}>Google Trends · 12개월</div>
        {g ? (
          <>
            <Sparkline values={g.values} />
            <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "baseline" }}>
              <span style={{
                font: "800 22px/1 var(--font-display)",
                color: (g.growth_rate ?? 0) >= 0 ? "#16a34a" : "#dc2626",
              }}>
                {(g.growth_rate ?? 0) >= 0 ? "+" : ""}{g.growth_rate ?? 0}%
              </span>
              <span style={{ font: "500 11px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>
                {g.peak_period ? `최고 ${g.peak_period}` : ""}
              </span>
            </div>
          </>
        ) : (
          <div style={{ font: "500 12px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>데이터 없음</div>
        )}
      </div>

      {/* Naver Datalab */}
      <div style={{ padding: 16, background: "var(--pp-surface-soft)", borderRadius: 12 }}>
        <div style={{
          font: "700 10px/1 var(--font-base)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--pp-ink-dim)",
          marginBottom: 10,
        }}>네이버 데이터랩 · 12개월</div>
        {n ? (
          <>
            <Sparkline values={n.values} />
            <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "baseline" }}>
              <span style={{
                font: "800 22px/1 var(--font-display)",
                color: (n.growth_rate ?? 0) >= 0 ? "#16a34a" : "#dc2626",
              }}>
                {(n.growth_rate ?? 0) >= 0 ? "+" : ""}{n.growth_rate ?? 0}%
              </span>
              <span style={{ font: "500 11px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>
                {n.peak_period ? `최고 ${n.peak_period}` : ""}
              </span>
            </div>
          </>
        ) : (
          <div style={{ font: "500 12px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>네이버 키 미설정</div>
        )}
      </div>

      {/* 통합 성장률 */}
      {growth != null && (
        <div style={{
          gridColumn: "span 2",
          padding: "12px 16px",
          borderRadius: 10,
          background: growth >= 0 ? "#f0fdf4" : "#fef2f2",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            font: "700 10px/1 var(--font-base)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: growth >= 0 ? "#16a34a" : "#dc2626",
          }}>종합 성장률</span>
          <span style={{
            font: "800 18px/1 var(--font-display)",
            color: growth >= 0 ? "#16a34a" : "#dc2626",
          }}>{growth >= 0 ? "+" : ""}{growth}%</span>
          <span style={{ font: "500 12px/1 var(--font-base)", color: "var(--pp-ink-soft)" }}>
            지난 12개월 기준 검색 관심도 변화
          </span>
        </div>
      )}
    </div>
  );
}

// ── YC 인사이트 섹션 ─────────────────────────────────────────────────────────

function SimilarityBar({ score }) {
  const pct = Math.round((score ?? 0) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 9999,
        background: "var(--pp-line)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "var(--pp-pain)",
          borderRadius: 9999,
        }} />
      </div>
      <span style={{
        font: "600 10px/1 var(--font-base)",
        color: "var(--pp-ink-dim)",
        minWidth: 28,
        textAlign: "right",
      }}>{pct}%</span>
    </div>
  );
}

function YCSection({ data }) {
  const companies = data?.companies || [];
  const rfs = data?.rfs || [];

  if (!companies.length && !rfs.length) {
    return (
      <div style={{ font: "500 12px/1 var(--font-base)", color: "var(--pp-ink-dim)", padding: "12px 0" }}>
        유사 YC 스타트업을 찾지 못했습니다.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {companies.length > 0 && (
        <div>
          <div style={{
            font: "700 10px/1 var(--font-base)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--pp-ink-dim)",
            marginBottom: 10,
          }}>유사 YC 졸업사 (상위 {companies.length}개)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid var(--pp-line)" }}>
            {companies.map((c, i) => (
              <div key={c.id} style={{
                padding: "10px 14px",
                background: i % 2 === 0 ? "#fff" : "var(--pp-surface-soft)",
                display: "grid",
                gridTemplateColumns: "1fr 48px 80px",
                alignItems: "center",
                gap: 12,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{
                      font: "700 13px/1 var(--font-base)",
                      color: "var(--pp-ink)",
                    }}>{c.name}</span>
                    {c.batch && (
                      <span style={{
                        padding: "2px 6px", borderRadius: 4,
                        background: "var(--pp-pain-bg)",
                        font: "700 9px/1 var(--font-base)",
                        color: "var(--pp-pain)",
                        letterSpacing: "0.04em",
                      }}>{c.batch}</span>
                    )}
                  </div>
                  <div style={{
                    font: "500 11px/1.4 var(--font-base)",
                    color: "var(--pp-ink-soft)",
                  }}>{c.one_liner || c.long_description?.slice(0, 80)}</div>
                </div>
                <div style={{
                  font: "700 11px/1 var(--font-base)",
                  color: "var(--pp-ink-dim)",
                  textAlign: "right",
                }}>#{i + 1}</div>
                <SimilarityBar score={c.similarity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {rfs.length > 0 && (
        <div>
          <div style={{
            font: "700 10px/1 var(--font-base)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--pp-ink-dim)",
            marginBottom: 10,
          }}>YC가 원하는 스타트업 (Request for Startups)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rfs.map((r, i) => (
              <div key={r.id} style={{
                padding: "12px 14px",
                background: "var(--pp-surface-soft)",
                borderRadius: 10,
                borderLeft: "3px solid var(--pp-pain)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <span style={{
                    font: "700 13px/1 var(--font-base)",
                    color: "var(--pp-ink)",
                  }}>{r.title}</span>
                  <SimilarityBar score={r.similarity} />
                </div>
                <div style={{
                  font: "500 11px/1.5 var(--font-base)",
                  color: "var(--pp-ink-soft)",
                }}>{r.description?.slice(0, 120)}{r.description?.length > 120 ? "…" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.Report = Report;

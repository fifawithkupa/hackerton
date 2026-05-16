// Account / Settings
function Account({ user, onNav, onLogout, onUpgrade }) {
  const [section, setSection] = React.useState("profile");
  const sections = [
    { id: "profile",      label: "프로필" },
    { id: "billing",      label: "결제·플랜" },
    { id: "notifications",label: "알림" },
    { id: "data",         label: "데이터·개인정보" },
    { id: "danger",       label: "계정 삭제", danger: true },
  ];

  return (
    <main className="fade-in" style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 40px 80px" }}>
      <h1 style={{
        margin: "0 0 32px",
        font: "800 40px/1.1 var(--font-display)",
        letterSpacing: "-0.025em",
      }}>계정·설정</h1>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40 }}>
        <aside>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                all: "unset", cursor: "pointer",
                padding: "10px 14px", borderRadius: 10,
                background: section === s.id ? "var(--pp-surface-soft)" : "transparent",
                font: "600 13px/1 var(--font-base)",
                color: s.danger
                  ? "var(--pp-neg)"
                  : section === s.id ? "var(--pp-ink)" : "var(--pp-ink-soft)",
              }}>{s.label}</button>
            ))}
          </div>
        </aside>

        <div>
          {section === "profile" && <ProfileSection user={user} onLogout={onLogout} />}
          {section === "billing" && <BillingSection user={user} onUpgrade={onUpgrade} onNav={onNav} />}
          {section === "notifications" && <NotificationsSection />}
          {section === "data" && <DataSection />}
          {section === "danger" && <DangerSection onLogout={onLogout} />}
        </div>
      </div>
    </main>
  );
}

function SectionCard({ title, desc, children }) {
  return (
    <div className="pp-card" style={{ padding: 28, marginBottom: 16 }}>
      <div style={{
        font: "800 20px/1.3 var(--font-display)",
        letterSpacing: "-0.012em",
        marginBottom: 4,
      }}>{title}</div>
      {desc && (
        <div style={{
          font: "500 13px/1.5 var(--font-base)",
          color: "var(--pp-ink-soft)",
          marginBottom: 20,
        }}>{desc}</div>
      )}
      {children}
    </div>
  );
}

function ProfileSection({ user, onLogout }) {
  return (
    <SectionCard title="프로필" desc="Google 계정에서 연동된 정보입니다.">
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: 20,
        background: "var(--pp-surface-soft)", borderRadius: 12,
        marginBottom: 16,
      }}>
        <Avatar name={user.name} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ font: "700 15px/1.3 var(--font-base)" }}>{user.name}</div>
          <div style={{ font: "500 13px/1.3 var(--font-base)", color: "var(--pp-ink-soft)" }}>{user.email}</div>
        </div>
        <span className="pp-pill">Google 연동</span>
      </div>
      <Field2 label="표시 이름"        value={user.name} />
      <Field2 label="회사·소속 (선택)" value="—" placeholder="입력" />
      <Field2 label="역할"             value="예비 창업자" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={onLogout} className="pp-btn" data-variant="ghost" data-size="sm">로그아웃</button>
        <button className="pp-btn" data-variant="primary" data-size="sm">저장</button>
      </div>
    </SectionCard>
  );
}

function Field2({ label, value, placeholder }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "140px 1fr",
      alignItems: "center", gap: 16,
      padding: "14px 0",
      borderBottom: "1px solid var(--pp-line)",
    }}>
      <span style={{
        font: "600 13px/1.3 var(--font-base)",
        color: "var(--pp-ink-soft)",
      }}>{label}</span>
      <input defaultValue={value === "—" ? "" : value}
             placeholder={placeholder || value}
             style={{
               border: "none", outline: "none",
               font: "500 14px/1 var(--font-base)",
               color: "var(--pp-ink)",
               background: "transparent",
             }} />
    </div>
  );
}

function BillingSection({ user, onUpgrade, onNav }) {
  return (
    <>
      <SectionCard title="현재 플랜">
        <div style={{
          padding: 24,
          background: user.plan === "Free" ? "var(--pp-surface-soft)" : user.plan === "Admin" ? "#1a1a2e" : "var(--color-label-strong)",
          color: user.plan === "Free" ? "var(--pp-ink)" : "#fff",
          borderRadius: 16,
          display: "flex", alignItems: "center", gap: 24,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              font: "700 11px/1 var(--font-base)",
              letterSpacing: "0.08em", textTransform: "uppercase",
              opacity: 0.6, marginBottom: 6,
            }}>{user.plan === "Free" ? "무료 사용 중" : user.plan === "Admin" ? "관리자 계정" : "활성 구독"}</div>
            <div style={{
              font: "800 28px/1.1 var(--font-display)",
              letterSpacing: "-0.02em",
            }}>{user.plan} 플랜</div>
            <div style={{
              marginTop: 6,
              font: "500 13px/1.4 var(--font-base)", opacity: 0.7,
            }}>
              {user.plan === "Free" ? "월 리포트 3건 · Reddit 소스만" : user.plan === "Admin" ? "모든 기능 무제한 · 결제 없음" : "월 ₩29,000 · 다음 결제일 2025-12-14"}
            </div>
          </div>
          {user.plan === "Free"
            ? <button onClick={() => onNav("pricing")} className="pp-btn" data-variant="brand">
                Pro로 업그레이드 →
              </button>
            : <button className="pp-btn" data-variant="ghost"
                      style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                플랜 관리
              </button>
          }
        </div>
      </SectionCard>

      <SectionCard title="결제 수단" desc="Stripe를 통해 안전하게 관리됩니다.">
        <div style={{
          padding: 16, borderRadius: 10,
          border: "1px solid var(--pp-line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 28, borderRadius: 4,
            background: "linear-gradient(135deg,#1a1f71 0%,#2d3a8c 100%)",
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 14px/1.3 var(--font-base)" }}>Visa ····  4242</div>
            <div style={{ font: "500 12px/1.3 var(--font-base)", color: "var(--pp-ink-soft)" }}>만료 12/27</div>
          </div>
          <button className="pp-btn" data-variant="ghost" data-size="sm">변경</button>
        </div>
      </SectionCard>

      <SectionCard title="결제 내역">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { d: "2025-11-14", amt: "₩29,000", inv: "INV-00128", st: "결제됨" },
            { d: "2025-10-14", amt: "₩29,000", inv: "INV-00097", st: "결제됨" },
            { d: "2025-09-14", amt: "₩29,000", inv: "INV-00064", st: "결제됨" },
          ].map((r, i) => (
            <div key={r.inv} style={{
              padding: "14px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--pp-line)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16,
              alignItems: "center",
              font: "500 13px/1.4 var(--font-base)",
            }}>
              <span style={{ color: "var(--pp-ink-soft)" }}>{r.d}</span>
              <span className="tnum" style={{ color: "var(--pp-ink)", fontWeight: 600 }}>{r.amt}</span>
              <span className="pp-pill" data-tone="positive">{r.st}</span>
              <a href="#" style={{
                font: "600 12px/1 var(--font-base)",
                color: "var(--pp-primary)", textDecoration: "none",
              }}>{r.inv} ↗</a>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function NotificationsSection() {
  return (
    <SectionCard title="알림" desc="언제, 어떤 알림을 받을지 정합니다.">
      {[
        { l: "주간 트렌드 뉴스레터", d: "매주 월요일 09:00 · 업종별 Top 10 페인포인트", on: true },
        { l: "분석 완료 알림",      d: "내가 시작한 분석이 끝나면 이메일로 알림",      on: true },
        { l: "신규 경쟁자 알림",    d: "저장한 아이디어 영역에 새 경쟁자가 등장하면",  on: false },
        { l: "팀 멘션 알림",        d: "공유된 리포트에서 멘션되면",                    on: true },
      ].map((row, i) => <Toggle key={i} {...row} />)}
    </SectionCard>
  );
}

function Toggle({ l, d, on }) {
  const [v, setV] = React.useState(on);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "14px 0",
      borderTop: "1px solid var(--pp-line)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 14px/1.3 var(--font-base)", color: "var(--pp-ink)" }}>{l}</div>
        <div style={{ font: "500 12px/1.4 var(--font-base)", color: "var(--pp-ink-soft)" }}>{d}</div>
      </div>
      <button onClick={() => setV(!v)} style={{
        all: "unset", cursor: "pointer",
        width: 40, height: 24, borderRadius: 9999,
        background: v ? "var(--color-label-strong)" : "var(--color-fill-alternative)",
        position: "relative",
        transition: "background 150ms ease-out",
      }}>
        <span style={{
          position: "absolute", top: 2, left: v ? 18 : 2,
          width: 20, height: 20, borderRadius: 9999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          transition: "left 150ms ease-out",
        }} />
      </button>
    </div>
  );
}

function DataSection() {
  return (
    <SectionCard title="데이터·개인정보" desc="SSATIS가 저장한 데이터를 직접 관리하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="pp-btn" data-variant="ghost" style={{ justifyContent: "flex-start" }}>
          전체 리포트 데이터 내보내기 (JSON)
        </button>
        <button className="pp-btn" data-variant="ghost" style={{ justifyContent: "flex-start" }}>
          저장된 아이디어 내보내기 (CSV)
        </button>
        <button className="pp-btn" data-variant="ghost" style={{ justifyContent: "flex-start" }}>
          검색 기록 전체 삭제
        </button>
      </div>
    </SectionCard>
  );
}

function DangerSection({ onLogout }) {
  return (
    <div className="pp-card" style={{ padding: 28, border: "1px solid var(--pp-neg)" }}>
      <div style={{
        font: "800 20px/1.3 var(--font-display)",
        color: "var(--pp-neg)",
        marginBottom: 8,
      }}>계정 삭제</div>
      <div style={{
        font: "500 14px/1.55 var(--font-base)",
        color: "var(--pp-ink-soft)",
        marginBottom: 20,
      }}>
        계정을 삭제하면 저장된 리포트·아이디어·결제 내역이 30일 후 완전히 삭제됩니다. 되돌릴 수 없습니다.
      </div>
      <button onClick={onLogout} style={{
        all: "unset", cursor: "pointer",
        padding: "10px 16px",
        borderRadius: 10,
        background: "var(--pp-neg)", color: "#fff",
        font: "700 13px/1 var(--font-base)",
      }}>계정 삭제 요청</button>
    </div>
  );
}

window.Account = Account;

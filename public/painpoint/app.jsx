// SSATIS — main App with Supabase auth
function App() {
  const { supaUser, loading, signInWithGoogle, signOut } = useSupabaseAuth();

  const [route, setRoute]           = React.useState("landing");
  const [params, setParams]         = React.useState({ keyword: "HR", sources: {} });
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  // supaUser가 바뀌면 로그인/로그아웃 처리
  React.useEffect(() => {
    if (supaUser && route === "login") {
      showToast(`${supaUser.name}님, 환영해요! 👋`, "success");
      setRoute("dashboard");
    }
  }, [supaUser]);

  const go = (r) => {
    if (r === "logout") {
      signOut();
      setRoute("landing");
      showToast("로그아웃됐습니다");
      return;
    }
    const protectedRoutes = ["dashboard", "account", "ideas-saved"];
    if (protectedRoutes.includes(r) && !supaUser) { setRoute("login"); return; }
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const onSearch = (p) => {
    setParams(p);
    if (/^(xyz|없는|test 0)/i.test(p.keyword)) { setRoute("empty"); return; }
    setRoute("analyzing");
  };

  const onOpenReport = (r) => {
    setParams({ keyword: r.keyword, sources: {} });
    setRoute("results");
  };

  if (loading) return <SplashLoader />;

  return (
    <>
      <TopNav route={route} user={supaUser} onNav={go} />

      {route === "landing"     && <Landing     onSearch={onSearch} user={supaUser} />}
      {route === "analyzing"   && <Analyzing   params={params} onDone={() => setRoute("results")} onCancel={() => setRoute("landing")} />}
      {route === "results"     && <Results     params={params} user={supaUser} onBack={() => setRoute(supaUser ? "dashboard" : "landing")} />}
      {route === "login"       && <Login       onGoogleLogin={signInWithGoogle} onBack={() => setRoute("landing")} />}
      {route === "dashboard"   && <Dashboard   user={supaUser} onNav={go} onOpenReport={onOpenReport} />}
      {route === "trends"      && <Trends      user={supaUser} onNav={go} onAnalyze={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "pricing"     && <Pricing     onNav={go} onChoose={(planId) => planId === "free" ? go("login") : setUpgradeOpen(planId)} />}
      {route === "account"     && <Account     user={supaUser} onNav={go} onLogout={() => go("logout")} onUpgrade={() => go("pricing")} />}
      {route === "ideas-saved" && <SavedIdeas  user={supaUser} onAnalyze={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "empty"       && <EmptyState  keyword={params.keyword} onBack={() => setRoute("landing")} onTry={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "404"         && <NotFound    onHome={() => setRoute("landing")} />}

      <Footer />
      <ToastHost />

      {upgradeOpen && (
        <UpgradeModal
          planId={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          onConfirm={async () => {
            // Supabase profiles 테이블 플랜 업데이트
            if (supaUser && window.supabaseClient) {
              await SupaProfiles.upsert({ id: supaUser.id, plan: upgradeOpen === "team" ? "Team" : "Pro" });
            }
            setUpgradeOpen(false);
            showToast(`${upgradeOpen === "team" ? "Team" : "Pro"} 플랜이 활성화됐습니다 🎉`, "success");
            go(supaUser ? "dashboard" : "login");
          }}
        />
      )}
    </>
  );
}

// —— 초기 로딩 스플래시 ——
function SplashLoader() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#fff",
      flexDirection: "column", gap: 16,
    }}>
      <div style={{ animation: "pulse 1s ease-out infinite" }}>
        <Wordmark size={28} />
      </div>
      <div style={{
        font: "500 13px/1 var(--font-base)",
        color: "var(--pp-ink-dim)",
      }}>로딩 중…</div>
    </div>
  );
}

// —— Upgrade modal ——
function UpgradeModal({ planId, onClose, onConfirm }) {
  const plan = planId === "team"
    ? { name: "Team", price: "₩99,000" }
    : { name: "Pro",  price: "₩29,000" };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(23,23,25,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "fade 200ms ease-out both",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, background: "#fff", borderRadius: 20,
        padding: 32,
        boxShadow: "0 24px 60px rgba(23,23,25,0.24)",
        animation: "fade 200ms ease-out both",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span className="pp-pill" data-tone="pain">결제 확인</span>
          <button onClick={onClose} style={{
            all: "unset", cursor: "pointer", padding: 4,
            color: "var(--pp-ink-soft)", font: "700 18px/1 var(--font-base)",
          }}>×</button>
        </div>
        <h2 style={{ margin: "0 0 8px", font: "800 28px/1.2 var(--font-display)", letterSpacing: "-0.02em" }}>
          {plan.name} 플랜 시작
        </h2>
        <p style={{ margin: "0 0 24px", font: "500 14px/1.55 var(--font-base)", color: "var(--pp-ink-soft)" }}>
          오늘부터 즉시 활성화되며, 다음 결제일에 자동 갱신됩니다. 언제든 해지 가능합니다.
        </p>
        <div style={{
          padding: 20, borderRadius: 12,
          background: "var(--pp-surface-soft)",
          display: "flex", alignItems: "baseline", gap: 8,
          marginBottom: 24,
        }}>
          <span className="tnum" style={{ font: "900 36px/1 var(--font-display)", letterSpacing: "-0.025em" }}>
            {plan.price}
          </span>
          <span style={{ font: "500 13px/1 var(--font-base)", color: "var(--pp-ink-soft)" }}>/ 월 (부가세 포함)</span>
          <div style={{ flex: 1 }} />
          <span style={{ font: "500 12px/1 var(--font-base)", color: "var(--pp-ink-dim)" }}>다음 결제: 2025-12-14</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="pp-btn" data-variant="ghost" style={{ flex: 1 }}>취소</button>
          <button onClick={onConfirm} className="pp-btn" data-variant="primary" style={{ flex: 1.5 }}>결제하고 시작 →</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);

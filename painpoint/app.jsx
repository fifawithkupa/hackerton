// SSATIS — main App with Supabase auth + Toss Payments
function App() {
  const { supaUser, loading, signInWithGoogle, signOut } = useSupabaseAuth();

  const [route, setRoute]           = React.useState("landing");
  const [params, setParams]         = React.useState({ keyword: "HR", sources: {} });
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [openedReportId, setOpenedReportId] = React.useState(null);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  const finishAnalysis = React.useCallback((result) => {
    setOpenedReportId(null);
    setAnalysisResult(result);
    setRoute("results");
  }, []);

  // 결제 콜백 URL 감지 (토스페이먼츠 redirect)
  React.useEffect(() => {
    const pathname = window.location.pathname;
    const sp = new URLSearchParams(window.location.search);

    if (pathname === "/payment/success") {
      const paymentKey = sp.get("paymentKey");
      const orderId    = sp.get("orderId");
      const amount     = sp.get("amount");

      if (paymentKey && orderId && amount) {
        // URL 즉시 정리 (뒤로가기 방지)
        window.history.replaceState({}, "", "/");

        fetch("/api/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              // 1일 이용권 만료 시각 저장
              const planInfo = { plan: "day", expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
              localStorage.setItem("ssatis:daypass", JSON.stringify(planInfo));
              setRoute("landing");
              showToast("결제 완료! 1일 무제한 이용권이 활성화됐습니다 🎉", "success");
            } else {
              setRoute("landing");
              showToast("결제 승인 실패: " + (data.error || "오류"), "error");
            }
          })
          .catch(() => {
            setRoute("landing");
            showToast("결제 확인 중 오류가 발생했습니다.", "error");
          });
      } else {
        window.history.replaceState({}, "", "/");
        setRoute("landing");
      }
      return;
    }

    if (pathname === "/payment/fail") {
      const message = sp.get("message") || "결제가 취소되었습니다.";
      window.history.replaceState({}, "", "/");
      setRoute("landing");
      showToast(message, "default");
    }
  }, []);

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
    setAnalysisResult(null);
    if (/^(xyz|없는|test 0)/i.test(p.keyword)) { setRoute("empty"); return; }
    setRoute("analyzing");
  };

  const onOpenReport = async (r) => {
    setOpenedReportId(r.id);
    setParams({ keyword: r.keyword, sources: {} });
    setAnalysisResult(null);
    setRoute("results");
    // result_json이 이미 포함되어 있으면 바로 사용, 아니면 개별 조회
    if (r.result_json) {
      setAnalysisResult(r.result_json);
      return;
    }
    const { data, error } = await SupaReports.get(r.id);
    if (!error && data?.result_json) {
      setAnalysisResult(data.result_json);
    } else if (error) {
      showToast("리포트 데이터 불러오기 실패: " + (error.message || "알 수 없는 오류"), "error");
    }
  };

  if (loading) return <SplashLoader />;

  return (
    <>
      <TopNav route={route} user={supaUser} onNav={go} />

      {route === "landing"     && <Landing     onSearch={onSearch} user={supaUser} />}
      {route === "analyzing"   && <Analyzing   params={params} onFinish={finishAnalysis} onCancel={() => setRoute("landing")} />}
      {route === "results"     && <Results     params={params} analysisResult={analysisResult} existingReportId={openedReportId} user={supaUser} onBack={() => setRoute(supaUser ? "dashboard" : "landing")} />}
      {route === "login"       && <Login       onGoogleLogin={signInWithGoogle} onBack={() => setRoute("landing")} />}
      {route === "dashboard"   && <Dashboard   user={supaUser} onNav={go} onOpenReport={onOpenReport} />}
      {route === "trends"      && <Trends      user={supaUser} onNav={go} onAnalyze={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "pricing"     && <Pricing     onNav={go} onChoose={(planId) => {
        if (planId === "free") { go("login"); return; }
        setUpgradeOpen(planId);
      }} />}
      {route === "account"     && <Account     user={supaUser} onNav={go} onLogout={() => go("logout")} onUpgrade={() => go("pricing")} />}
      {route === "ideas-saved" && <SavedIdeas  user={supaUser} onAnalyze={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "empty"       && <EmptyState  keyword={params.keyword} onBack={() => setRoute("landing")} onTry={(kw) => onSearch({ keyword: kw, sources: {} })} />}
      {route === "404"         && <NotFound    onHome={() => setRoute("landing")} />}

      <Footer />
      <ToastHost />

      {upgradeOpen && (
        <UpgradeModal
          planId={upgradeOpen}
          user={supaUser}
          onClose={() => setUpgradeOpen(false)}
          onMockConfirm={async () => {
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

// —— 토스페이먼츠 결제 실행 ——
async function startTossPayment(planId, user) {
  const TOSS_CLIENT_KEY = "test_ck_24xLea5zVAzBA06wlZ5KrQAMYNwW";

  const planMeta = {
    day:  { name: "SSATIS 1일 무제한 이용권", amount: 9900 },
    pro:  { name: "SSATIS Pro 월정액",         amount: 29000 },
    team: { name: "SSATIS Team 월정액",         amount: 99000 },
  }[planId];

  if (!planMeta) return;

  if (typeof TossPayments === "undefined") {
    showToast("토스페이먼츠 SDK 로드 실패. 새로고침 후 시도하세요.", "error");
    return;
  }

  try {
    const customerKey = user?.id || "ANONYMOUS-" + Date.now();
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey });

    await payment.requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: planMeta.amount },
      orderId: `ssatis-${planId}-${Date.now()}`,
      orderName: planMeta.name,
      successUrl: window.location.origin + "/payment/success",
      failUrl: window.location.origin + "/payment/fail",
      customerEmail: user?.email || "",
      customerName: user?.name || "고객",
      card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
    });
  } catch (e) {
    if (e?.code === "USER_CANCEL") {
      showToast("결제가 취소됐습니다.", "default");
    } else {
      showToast("결제 오류: " + (e?.message || String(e)), "error");
    }
  }
}

// —— Upgrade / 결제 모달 ——
function UpgradeModal({ planId, user, onClose, onMockConfirm }) {
  const [paying, setPaying] = React.useState(false);

  const isDayPass = planId === "day";
  const plan = {
    day:  { name: "1일 무제한", price: "₩9,900",  desc: "24시간 무제한 이용 후 자동 종료" },
    pro:  { name: "Pro",        price: "₩29,000", desc: "다음 결제일에 자동 갱신. 언제든 해지 가능." },
    team: { name: "Team",       price: "₩99,000", desc: "다음 결제일에 자동 갱신. 언제든 해지 가능." },
  }[planId] || { name: planId, price: "?", desc: "" };

  const handleToss = async () => {
    setPaying(true);
    try {
      await startTossPayment(planId, user);
    } finally {
      setPaying(false);
    }
  };

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
          <span className="pp-pill" data-tone="pain">
            {isDayPass ? "1일 이용권" : "결제 확인"}
          </span>
          <button onClick={onClose} style={{
            all: "unset", cursor: "pointer", padding: 4,
            color: "var(--pp-ink-soft)", font: "700 18px/1 var(--font-base)",
          }}>×</button>
        </div>

        <h2 style={{ margin: "0 0 8px", font: "800 28px/1.2 var(--font-display)", letterSpacing: "-0.02em" }}>
          {plan.name} {isDayPass ? "결제" : "플랜 시작"}
        </h2>
        <p style={{ margin: "0 0 24px", font: "500 14px/1.55 var(--font-base)", color: "var(--pp-ink-soft)" }}>
          {plan.desc}
        </p>

        {/* 금액 */}
        <div style={{
          padding: 20, borderRadius: 12,
          background: "var(--pp-surface-soft)",
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 16,
        }}>
          <span className="tnum" style={{ font: "900 36px/1 var(--font-display)", letterSpacing: "-0.025em" }}>
            {plan.price}
          </span>
          <span style={{ font: "500 13px/1 var(--font-base)", color: "var(--pp-ink-soft)" }}>
            {isDayPass ? "/ 24시간 (부가세 포함)" : "/ 월 (부가세 포함)"}
          </span>
        </div>

        {/* 혜택 요약 */}
        {isDayPass && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.15)",
            marginBottom: 20,
            font: "500 13px/1.5 var(--font-base)",
            color: "var(--pp-ink)",
          }}>
            ✓ Reddit · 네이버 · YouTube 전 소스<br/>
            ✓ Gemini AI 페인포인트 분석 무제한<br/>
            ✓ 아이디어·경쟁자 분석 무제한
          </div>
        )}

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="pp-btn" data-variant="ghost" style={{ flex: 1 }} disabled={paying}>
            취소
          </button>
          <button
            onClick={handleToss}
            disabled={paying}
            style={{
              flex: 1.5, padding: "14px 20px", borderRadius: 10,
              background: paying ? "var(--pp-ink-dim)" : "#3182f6",
              color: "#fff", border: "none", cursor: paying ? "not-allowed" : "pointer",
              font: "700 15px/1 var(--font-base)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {paying ? "처리 중…" : (
              <>
                <TossIcon /> 토스로 결제하기
              </>
            )}
          </button>
        </div>

        <div style={{
          marginTop: 16, textAlign: "center",
          font: "500 12px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>
          토스페이먼츠 보안 결제 · SSL 암호화
        </div>
      </div>
    </div>
  );
}

function TossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#3182f6"/>
      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="sans-serif">T</text>
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);

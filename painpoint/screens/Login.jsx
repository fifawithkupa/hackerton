// Google-only login screen
function Login({ onGoogleLogin, onBack }) {
  const [loading, setLoading] = React.useState(false);
  const [gisReady, setGisReady] = React.useState(false);
  const [gisFailed, setGisFailed] = React.useState(false);
  const googleBtnRef = React.useRef(null);
  const hasClientId = !!((window.SSATIS_CONFIG || {}).googleClientId);

  // GIS renderButton 초기화
  React.useEffect(() => {
    const clientId = (window.SSATIS_CONFIG || {}).googleClientId;
    if (!clientId) { setGisFailed(true); return; }

    let initialized = false;
    const initGIS = () => {
      if (initialized || !googleBtnRef.current || typeof google === "undefined") return;
      initialized = true;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setLoading(true);
          try {
            const base64 = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const p = JSON.parse(
              decodeURIComponent(
                atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
              )
            );
            await onGoogleLogin({ id: p.sub, email: p.email, name: p.name, avatar: p.picture });
          } catch (e) {
            showToast("로그인 오류: " + e.message, "error");
            setLoading(false);
          }
        },
      });

      google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth || 400,
        text: "continue_with",
        locale: "ko",
      });
      setGisReady(true);
    };

    if (typeof google !== "undefined") {
      initGIS();
    } else {
      let waited = 0;
      const timer = setInterval(() => {
        waited += 200;
        if (typeof google !== "undefined") { clearInterval(timer); initGIS(); }
        else if (waited >= 8000) { clearInterval(timer); setGisFailed(true); }
      }, 200);
      return () => clearInterval(timer);
    }
  }, []);

  return (
    <main className="fade-in" style={{
      minHeight: "calc(100vh - 64px - 100px)",
      display: "grid", gridTemplateColumns: "1.1fr 1fr",
    }}>
      {/* —— LEFT: marketing strip —— */}
      <div style={{
        background: "var(--color-label-strong)",
        color: "#fff",
        padding: "80px 64px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -120, top: -120,
          width: 440, height: 440, borderRadius: 9999,
          background: "radial-gradient(circle, rgba(255,92,31,0.4) 0%, transparent 60%)",
        }} />

        <div>
          <Wordmark size={20} />
          <h1 style={{
            margin: "56px 0 20px",
            font: "800 48px/1.1 var(--font-display)",
            letterSpacing: "-0.028em",
          }}>
            실시간 불만에서<br />
            검증된 기회를 찾으세요
          </h1>
          <p style={{
            margin: 0, maxWidth: 420,
            font: "500 16px/1.55 var(--font-base)",
            color: "rgba(255,255,255,0.65)",
          }}>
            로그인하고 리포트 저장·다운로드·팀 공유까지 한 번에 사용하세요.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.12)",
        }}>
          {[
            { v: "12,481", l: "분석된 키워드" },
            { v: "48,927", l: "발견된 페인포인트" },
            { v: "187K+",  l: "생성된 아이디어" },
          ].map(s => (
            <div key={s.l}>
              <div className="tnum" style={{
                font: "800 24px/1.1 var(--font-display)",
                letterSpacing: "-0.02em",
              }}>{s.v}</div>
              <div style={{
                marginTop: 4,
                font: "500 12px/1.3 var(--font-base)",
                color: "rgba(255,255,255,0.5)",
              }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* —— RIGHT: auth panel —— */}
      <div style={{
        padding: "80px 64px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        maxWidth: 480, margin: "0 auto", width: "100%",
      }}>
        <h2 style={{
          margin: "0 0 8px",
          font: "800 32px/1.2 var(--font-display)",
          letterSpacing: "-0.022em",
          color: "var(--color-label-strong)",
        }}>로그인 또는 회원가입</h2>
        <p style={{
          margin: "0 0 32px",
          font: "500 14px/1.55 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>
          별도 가입 없이 Google 계정으로 바로 시작합니다.
        </p>

        {/* GIS가 여기에 실제 Google 버튼을 주입 */}
        <div ref={googleBtnRef} style={{ width: "100%", minHeight: gisReady ? 52 : 0 }} />

        {/* GIS 로드 전: 로딩 표시 */}
        {hasClientId && !gisReady && !gisFailed && (
          <div style={{
            width: "100%", padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#f8f9fa", border: "1.5px solid #dadce0", borderRadius: 8,
            font: "500 14px/1 var(--font-base)", color: "#80868b",
          }}>
            Google 로그인 버튼 불러오는 중…
          </div>
        )}

        {/* GIS 로드 실패 또는 Client ID 없을 때 폴백 */}
        {(!hasClientId || gisFailed) && (
          <button
            onClick={async () => {
              setLoading(true);
              await onGoogleLogin({ id: "demo-" + Date.now(), email: "demo@ssatis.io", name: "데모 사용자", avatar: null });
            }}
            style={{
              width: "100%", padding: "12px 20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", border: "1.5px solid #dadce0", borderRadius: 8,
              font: "600 15px/1 var(--font-base)", color: "#3c4043",
              cursor: "pointer", transition: "box-shadow 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.15)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <GoogleG />
            Google 계정으로 계속하기
          </button>
        )}

        {loading && (
          <div style={{
            marginTop: 12, textAlign: "center",
            font: "500 14px/1 var(--font-base)",
            color: "var(--pp-ink-soft)",
          }}>
            Google로 로그인 중…
          </div>
        )}

        <div style={{
          margin: "28px 0",
          display: "flex", alignItems: "center", gap: 12,
          font: "500 12px/1 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--pp-line)" }} />
          다른 방법은 지원하지 않습니다
          <div style={{ flex: 1, height: 1, background: "var(--pp-line)" }} />
        </div>

        <div style={{
          padding: 16,
          background: "var(--pp-surface-soft)",
          borderRadius: 12,
          font: "500 12px/1.6 var(--font-base)",
          color: "var(--pp-ink-soft)",
        }}>
          처음 로그인하면 자동으로 계정이 생성됩니다.
          업무용 Google Workspace 계정도 사용 가능하며,
          이메일·이름·프로필 사진 외 정보는 수집하지 않습니다.
        </div>

        <p style={{
          marginTop: 24,
          font: "500 12px/1.6 var(--font-base)",
          color: "var(--pp-ink-dim)",
        }}>
          계속 진행하면 SSATIS의 <a href="#" style={{ color: "var(--pp-ink)" }}>이용약관</a>과{" "}
          <a href="#" style={{ color: "var(--pp-ink)" }}>개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
        </p>

        {onBack && (
          <button onClick={onBack} className="pp-btn" data-variant="ghost" data-size="sm"
                  style={{ alignSelf: "flex-start", marginTop: 32 }}>
            ← 돌아가기
          </button>
        )}
      </div>
    </main>
  );
}

// official Google "G" mark — approximate SVG
function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

window.Login = Login;

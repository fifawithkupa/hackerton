/**
 * Vercel 등 배포 환경: /api/public-config 로 env 기반 설정을 병합한 뒤 Supabase 클라이언트 초기화
 */
(function () {
  function applyPublicConfig(pub) {
    if (!pub || typeof pub !== "object") return;
    window.SSATIS_CONFIG = Object.assign({}, window.SSATIS_CONFIG || {}, {
      googleClientId: pub.googleClientId || window.SSATIS_CONFIG?.googleClientId || "",
      supabaseUrl: pub.supabaseUrl || window.SSATIS_CONFIG?.supabaseUrl || "",
      supabaseAnonKey: pub.supabaseAnonKey || window.SSATIS_CONFIG?.supabaseAnonKey || "",
    });
  }

  function initSupabaseClient() {
    const cfg = window.SSATIS_CONFIG || {};
    const url = cfg.supabaseUrl;
    const key = cfg.supabaseAnonKey;
    if (!url || !key || url === "YOUR_SUPABASE_URL" || /^YOUR_/i.test(key)) {
      window.supabaseClient = null;
      return;
    }
    if (typeof supabase === "undefined") {
      console.warn("[SSATIS] Supabase JS가 로드되지 않았습니다.");
      window.supabaseClient = null;
      return;
    }
    window.supabaseClient = supabase.createClient(url, key, {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    });
    console.log("[SSATIS] Supabase 연결됨:", url);
  }

  window.__ssatisBoot = (async function ssatisBoot() {
    try {
      const res = await fetch("/api/public-config", { cache: "no-store" });
      if (res.ok) applyPublicConfig(await res.json());
    } catch (e) {
      console.warn("[SSATIS] public-config 로드 실패:", e);
    }
    initSupabaseClient();
    window.dispatchEvent(new CustomEvent("ssatis-config-ready"));
    return window.SSATIS_CONFIG;
  })();

  window.waitForSsatisConfig = function waitForSsatisConfig() {
    return window.__ssatisBoot || Promise.resolve(window.SSATIS_CONFIG);
  };
})();

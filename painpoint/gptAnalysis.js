// SSATIS — 브라우저에서 Gemini/Google 직접 호출은 CORS 제약이 있어, 로컬 dev-server 프록시만 사용합니다.



(function () {

  function looksLikeConfiguredApiKey(k) {

    if (typeof k !== "string") return false;

    const t = k.trim();

    return (

      t.length >= 12 &&

      !/^YOUR_(GEMINI|OPENAI)/i.test(t) &&

      t !== "YOUR_GEMINI_API_KEY" &&

      t !== "YOUR_OPENAI_API_KEY"

    );

  }



  /** Gemini 키: geminiApiKey 우선, 예전 필드명 openaiApiKey 호환 */

  window.hasOpenAiConfigured = function hasOpenAiConfigured() {

    const cfg = window.SSATIS_CONFIG || {};

    return (

      looksLikeConfiguredApiKey(cfg.geminiApiKey) || looksLikeConfiguredApiKey(cfg.openaiApiKey)

    );

  };



  /**

   * POST /api/ssatis-analyze — 응답은 PP_DATA.result 와 동일한 형태의 JSON

   */

  window.runPainpointAnalysis = async function runPainpointAnalysis(keyword, sources) {

    if (!window.hasOpenAiConfigured()) return null;



    const posts =
      (Array.isArray(window._ssatisCollectedPosts) && window._ssatisCollectedPosts.length
        ? window._ssatisCollectedPosts
        : null) ||
      (typeof window.getCollectedPostsForAnalysis === "function"
        ? window.getCollectedPostsForAnalysis(keyword, sources)
        : []);



    if (!posts.length) {

      console.warn("[SSATIS] 분석용 샘플 글이 없습니다.");

      return null;

    }



    const cfg = window.SSATIS_CONFIG || {};

    const base =

      cfg.analysisApiBase != null ? String(cfg.analysisApiBase).replace(/\/$/, "") : "";

    const url = `${base}/api/ssatis-analyze`;



    let res;

    try {

      res = await fetch(url, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          keyword,
          posts,
          collectMeta: window._ssatisCollectMeta || null,
        }),

      });

    } catch (e) {

      console.error(e);

      throw new Error(

        "분석 서버에 연결할 수 없습니다. 터미널에서 `node painpoint/dev-server.mjs` 실행 후 http://localhost:8787 로 접속했는지 확인하세요.",

      );

    }



    const text = await res.text();



    if (res.status === 404) {

      throw new Error(

        "분석 API가 없습니다. `python -m http.server` 대신 Node 서버를 켜야 합니다: node painpoint/dev-server.mjs → http://localhost:8787",

      );

    }



    if (!res.ok) {

      let msg = text;

      try {

        const j = JSON.parse(text);

        if (j.error) msg = typeof j.error === "string" ? j.error : JSON.stringify(j.error);

      } catch {

        /* 그대로 */

      }

      if (/platform\.openai\.com|invalid_request_error/i.test(msg)) {
        throw new Error(
          "8787에 예전(OpenAI) 서버가 떠 있습니다. 터미널에서 node painpoint/dev-server.mjs 를 다시 실행하세요.",
        );
      }
      throw new Error(msg || "분석 API 오류 " + res.status);

    }



    try {

      return JSON.parse(text);

    } catch {

      throw new Error("분석 응답 JSON 파싱 실패");

    }

  };



  /** 사용자에게 보여 줄 짧은 한글 안내 */

  window.interpretAnalysisError = function interpretAnalysisError(raw) {

    const s = String(raw || "");

    if (/API[_ ]?KEY|API_KEY_INVALID|PERMISSION_DENIED/i.test(s)) {

      return "Gemini API 키가 올바르지 않거나 권한이 없습니다. Google AI Studio 키·API 활성화를 확인하세요.";

    }

    if (/RESOURCE_EXHAUSTED|quota|429|rate|limit:\s*0/i.test(s)) {

      return "이 모델의 무료 할당량이 없거나 초과했습니다. dev-server를 재시작하세요(기본 모델 gemini-2.5-flash).";

    }

    if (/insufficient_quota|exceeded your current quota/i.test(s)) {

      return "사용 한도가 부족합니다. 해당 서비스의 결제·크레딧을 확인하세요.";

    }

    if (/invalid_api_key|incorrect api key/i.test(s)) {

      return "API 키가 올바르지 않습니다. config.js 를 확인하세요.";

    }

    if (/NOT_FOUND|\b404\b|model/i.test(s) && /not found|not supported/i.test(s)) {

      return "모델 이름을 확인하세요. 터미널에서 GEMINI_MODEL 환경변수로 바꿀 수 있습니다.";

    }

    return "Gemini 분석 실패 — 자세한 내용은 브라우저 콘솔(F12)을 보세요.";

  };



  window.interpretOpenAiAnalysisError = window.interpretAnalysisError;

  window.checkAnalysisServer = async function checkAnalysisServer() {
    const cfg = window.SSATIS_CONFIG || {};
    const base =
      cfg.analysisApiBase != null ? String(cfg.analysisApiBase).replace(/\/$/, "") : "";
    try {
      const r = await fetch(`${base}/api/ssatis-health`, { cache: "no-store" });
      if (!r.ok) return { ok: false, reason: "health_failed" };
      const j = await r.json();
      if (j.provider !== "gemini") return { ok: false, reason: "old_server" };
      return { ok: true, model: j.model };
    } catch {
      return { ok: false, reason: "offline" };
    }
  };

})();



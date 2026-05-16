// 이 파일을 복사해 `config.js`로 저장한 뒤 실제 값으로 채우세요. (`config.js`는 gitignore됩니다)

window.SSATIS_CONFIG = {

  supabaseUrl: "YOUR_SUPABASE_URL",

  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Gemini (Google AI Studio 등에서 발급). 로컬에서는 node painpoint/dev-server.mjs 후 http://localhost:8787/

  geminiApiKey: "YOUR_GEMINI_API_KEY",

  // 호환용 예전 이름 — Gemini 키만 넣어도 됩니다.

  openaiApiKey: "",

  // 선택: gemini-2.5-flash(기본) 또는 gemini-3-flash-preview 등
  geminiModel: "gemini-2.5-flash",

  // 다른 호스트의 프록시를 쓸 때만 지정 (예: "http://127.0.0.1:8787"). 비우면 같은 주소의 /api/ssatis-analyze 사용

  analysisApiBase: "",

};



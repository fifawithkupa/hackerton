// SSATIS 설정 템플릿 — config.js 로 복사 후 값을 채워주세요
// config.js 는 .gitignore 에 포함되어 있으므로 커밋되지 않습니다.

window.SSATIS_CONFIG = {
  // Supabase
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Google OAuth (선택)
  googleClientId: "",

  // Gemini (Google AI Studio). 로컬: node painpoint/dev-server.mjs → http://localhost:8787/
  geminiApiKey: "YOUR_GEMINI_API_KEY",
  openaiApiKey: "", // 호환용 — Gemini 키만 넣어도 됨
  geminiModel: "gemini-2.5-flash",

  // 다른 호스트 프록시만 쓸 때 (예: "http://127.0.0.1:8787")
  analysisApiBase: "",
};

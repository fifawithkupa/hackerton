// SSATIS 로컬 설정 — .gitignore 에 포함 (커밋되지 않음)

window.SSATIS_CONFIG = {
  // Supabase
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Google OAuth (선택)
  googleClientId: "",

  // Gemini (Google AI Studio). 로컬: node painpoint/dev-server.mjs → http://localhost:8787/
  geminiApiKey: "AIzaSyCfk0l9orbHkOkl7SPaoUMxWjmj3Fi-OyQ",
  openaiApiKey: "",
  geminiModel: "gemini-3-flash-preview",

  // 다른 호스트 프록시만 쓸 때 (예: "http://127.0.0.1:8787")
  analysisApiBase: "",
};

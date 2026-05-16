// SSATIS 로컬 설정 — .gitignore 에 포함 (커밋되지 않음)

window.SSATIS_CONFIG = {
  // Supabase
  supabaseUrl: "https://xsvgfadxctgatdpsmggi.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdmdmYWR4Y3RnYXRkcHNtZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDI3MTEsImV4cCI6MjA5NDQ3ODcxMX0.7Xh5KB3_B3z4OVFf5-_kVezq2zyTuTjqPzo8HvAZa9k",

  // Google OAuth (선택)
  googleClientId: "963626779949-56jj5fco9i72pi3fpsb8qdtp0u8sthmq.apps.googleusercontent.com",

  // Gemini (Google AI Studio). 로컬: node painpoint/dev-server.mjs → http://localhost:8787/
  geminiApiKey: "via-dev-server-env",
  openaiApiKey: "",
  geminiModel: "gemini-3-flash-preview",

  // 다른 호스트 프록시만 쓸 때 (예: "http://127.0.0.1:8787")
  analysisApiBase: "",
};

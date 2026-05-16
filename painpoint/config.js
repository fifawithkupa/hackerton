// SSATIS 공개 설정 — 민감한 키는 Vercel 환경변수로 관리
// Supabase / Google 키는 Vercel 환경변수(SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID)에서 자동 주입됩니다.

window.SSATIS_CONFIG = {
  // Admin 이메일 목록 — 로그인 시 자동으로 "Admin" 플랜 부여 (모든 Pro 기능 해제)
  adminEmails: [
    "suprjaymin@snu.ac.kr",
  ],

  // 로컬 개발 시 직접 채울 항목 (배포 환경에서는 환경변수 우선)
  supabaseUrl: "",
  supabaseAnonKey: "",
  googleClientId: "",
  geminiApiKey: "via-dev-server-env",
  openaiApiKey: "",
  geminiModel: "gemini-2.5-flash-preview-05-20",
  analysisApiBase: "",
};

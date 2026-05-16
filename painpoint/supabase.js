// SSATIS — Supabase API 래퍼
// supabaseClient가 null이면 로컬 목 데이터로 자동 fallback
//
// DB 스키마 (Supabase SQL Editor에서 실행):
//
//   create table profiles (
//     id uuid primary key references auth.users(id) on delete cascade,
//     name text,
//     email text,
//     plan text default 'Free',
//     created_at timestamptz default now()
//   );
//
//   create table reports (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references profiles(id) on delete cascade,
//     keyword text not null,
//     verdict text,
//     verdict_tone text,
//     collected int default 0,
//     ideas_count int default 0,
//     share text default '비공개',
//     starred boolean default false,
//     result_json jsonb,
//     created_at timestamptz default now()
//   );
//
//   create table saved_ideas (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references profiles(id) on delete cascade,
//     report_id uuid references reports(id) on delete set null,
//     keyword text,
//     title text,
//     verdict text,
//     verdict_tone text,
//     note text default '',
//     created_at timestamptz default now()
//   );
//
//   -- RLS
//   alter table profiles    enable row level security;
//   alter table reports     enable row level security;
//   alter table saved_ideas enable row level security;
//
//   create policy "own profile"    on profiles    for all using (auth.uid() = id);
//   create policy "own reports"    on reports     for all using (auth.uid() = user_id);
//   create policy "own ideas"      on saved_ideas for all using (auth.uid() = user_id);

const DB = window.supabaseClient;

// ─── Auth ────────────────────────────────────────────────────────────────────

const Auth = {
  // Google OAuth 로그인
  async signInWithGoogle() {
    if (!DB) return { error: null, mock: true };
    return DB.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  },

  // 이메일/비밀번호 로그인 (대안)
  async signInWithEmail(email, password) {
    if (!DB) return { data: { user: { email, id: "mock-id" } }, error: null };
    return DB.auth.signInWithPassword({ email, password });
  },

  // 로그아웃
  async signOut() {
    if (!DB) return;
    return DB.auth.signOut();
  },

  // 현재 세션
  async getSession() {
    if (!DB) return { data: { session: null } };
    return DB.auth.getSession();
  },

  // 세션 변화 구독
  onAuthStateChange(cb) {
    if (!DB) return { data: { subscription: { unsubscribe: () => {} } } };
    return DB.auth.onAuthStateChange(cb);
  },
};

// ─── Profile ─────────────────────────────────────────────────────────────────

const Profiles = {
  async get(userId) {
    if (!DB) return { data: null, error: null };
    return DB.from("profiles").select("*").eq("id", userId).single();
  },

  async upsert(profile) {
    if (!DB) return { data: profile, error: null };
    return DB.from("profiles").upsert(profile, { onConflict: "id" }).select().single();
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────

const Reports = {
  async list(userId) {
    if (!DB) {
      // 목 데이터 반환
      return {
        data: [
          { id: "r1", keyword: "HR",       created_at: "2025-11-14", verdict: "틈새 존재", verdict_tone: "violet",   collected: 1247, ideas_count: 3, starred: true,  share: "공개" },
          { id: "r2", keyword: "부동산",   created_at: "2025-11-12", verdict: "블루오션",  verdict_tone: "positive", collected:  891, ideas_count: 4, starred: false, share: "비공개" },
          { id: "r3", keyword: "원격의료", created_at: "2025-11-09", verdict: "틈새 존재", verdict_tone: "violet",   collected:  612, ideas_count: 3, starred: true,  share: "팀" },
          { id: "r4", keyword: "프리랜서", created_at: "2025-11-07", verdict: "레드오션",  verdict_tone: "warn",     collected: 1542, ideas_count: 5, starred: false, share: "비공개" },
          { id: "r5", keyword: "유아교육", created_at: "2025-11-04", verdict: "블루오션",  verdict_tone: "positive", collected:  483, ideas_count: 3, starred: true,  share: "공개" },
          { id: "r6", keyword: "반려동물", created_at: "2025-10-30", verdict: "틈새 존재", verdict_tone: "violet",   collected:  771, ideas_count: 4, starred: false, share: "비공개" },
        ],
        error: null,
      };
    }
    return DB.from("reports")
      .select("id, keyword, created_at, verdict, verdict_tone, collected, ideas_count, starred, share")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  async save(userId, reportData) {
    if (!DB) return { data: { id: "mock-" + Date.now(), ...reportData }, error: null };
    return DB.from("reports")
      .insert({ user_id: userId, ...reportData })
      .select()
      .single();
  },

  async toggleStar(reportId, starred) {
    if (!DB) return { error: null };
    return DB.from("reports").update({ starred }).eq("id", reportId);
  },

  async updateShare(reportId, share) {
    if (!DB) return { error: null };
    return DB.from("reports").update({ share }).eq("id", reportId);
  },

  async delete(reportId) {
    if (!DB) return { error: null };
    return DB.from("reports").delete().eq("id", reportId);
  },
};

// ─── Saved Ideas ─────────────────────────────────────────────────────────────

const SavedIdeasDB = {
  async list(userId) {
    if (!DB) return { data: null, error: null }; // localStorage fallback은 SavedIdeas.jsx가 처리
    return DB.from("saved_ideas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  async add(userId, idea) {
    if (!DB) return { data: { id: "mock-" + Date.now(), ...idea }, error: null };
    return DB.from("saved_ideas")
      .insert({ user_id: userId, ...idea })
      .select()
      .single();
  },

  async updateNote(ideaId, note) {
    if (!DB) return { error: null };
    return DB.from("saved_ideas").update({ note }).eq("id", ideaId);
  },

  async remove(ideaId) {
    if (!DB) return { error: null };
    return DB.from("saved_ideas").delete().eq("id", ideaId);
  },
};

// ─── useSupabaseAuth hook ─────────────────────────────────────────────────────
// app.jsx에서 사용. 세션 상태를 React state로 관리

function useSupabaseAuth() {
  const [supaUser, setSupaUser] = React.useState(null);
  const [loading, setLoading]   = React.useState(true);

  React.useEffect(() => {
    // 초기 세션 확인
    Auth.getSession().then(({ data }) => {
      const session = data?.session;
      if (session?.user) _hydrateUser(session.user);
      setLoading(false);
    });

    // 세션 변화 구독
    const { data: { subscription } } = Auth.onAuthStateChange((_event, session) => {
      if (session?.user) _hydrateUser(session.user);
      else setSupaUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function _hydrateUser(authUser) {
    // profiles 테이블에서 플랜 등 추가 정보 가져오기
    const { data: profile } = await Profiles.get(authUser.id);
    setSupaUser({
      id:     authUser.id,
      email:  authUser.email,
      name:   profile?.name  || authUser.user_metadata?.full_name || authUser.email.split("@")[0],
      plan:   profile?.plan  || "Free",
      avatar: authUser.user_metadata?.avatar_url || null,
    });
  }

  async function signInWithGoogle() {
    const { error, mock } = await Auth.signInWithGoogle();
    if (mock) {
      // Supabase 미연결 시 목 로그인
      setSupaUser({ id: "mock", email: "demo@ssatis.app", name: "민지", plan: "Free", avatar: null });
    }
    if (error) showToast("로그인 실패: " + error.message, "error");
  }

  async function signOut() {
    await Auth.signOut();
    setSupaUser(null);
  }

  return { supaUser, loading, signInWithGoogle, signOut };
}

// 전역 노출
Object.assign(window, {
  SupaAuth: Auth,
  SupaProfiles: Profiles,
  SupaReports: Reports,
  SupaSavedIdeas: SavedIdeasDB,
  useSupabaseAuth,
});

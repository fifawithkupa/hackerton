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

// ─── localStorage 기반 로컬 스토리지 (Supabase 미연결 시 fallback) ────────────
const Local = {
  _key: (userId, table) => `ssatis:${table}:${userId}`,

  get(userId, table) {
    try { return JSON.parse(localStorage.getItem(Local._key(userId, table)) || "[]"); }
    catch { return []; }
  },

  set(userId, table, data) {
    localStorage.setItem(Local._key(userId, table), JSON.stringify(data));
  },
};

// ─── Auth ────────────────────────────────────────────────────────────────────

// Google JWT 디코드 (UTF-8 한글 이름 지원)
function _decodeGoogleJwt(credential) {
  const base64 = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json);
}

const Auth = {
  // Google OAuth 로그인
  signInWithGoogle() {
    const clientId = (window.SSATIS_CONFIG || {}).googleClientId;

    // Google Identity Services 로그인
    if (clientId) {
      return new Promise((resolve) => {
        const onCredential = (response) => {
          try {
            const p = _decodeGoogleJwt(response.credential);
            resolve({
              error: null,
              googleUser: { id: p.sub, email: p.email, name: p.name, avatar: p.picture },
            });
          } catch (e) {
            resolve({ error: { message: '인증 정보 파싱 실패' } });
          }
        };

        // GIS 스크립트 로드 대기 후 초기화
        const init = () => {
          google.accounts.id.initialize({ client_id: clientId, callback: onCredential });
          google.accounts.id.prompt((notification) => {
            // One Tap이 표시 안 될 경우 팝업 방식으로 fallback
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              const popup = window.open(
                `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}` +
                `&response_type=id_token` +
                `&scope=openid%20email%20profile` +
                `&nonce=${Math.random().toString(36).slice(2)}`,
                '_blank', 'width=480,height=600'
              );
              if (!popup) resolve({ error: { message: '팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.' } });
            }
          });
        };

        if (typeof google !== 'undefined') {
          init();
        } else {
          // GIS 스크립트 로드 대기
          window.addEventListener('load', init, { once: true });
        }
      });
    }

    // Supabase OAuth
    if (DB) {
      return DB.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    }

    return Promise.resolve({ error: { message: 'Google Client ID 또는 Supabase 설정이 필요합니다.' } });
  },

  // 로그아웃
  async signOut() {
    // 로컬 세션 삭제
    localStorage.removeItem('ssatis:session');
    if (DB) return DB.auth.signOut();
  },

  // 현재 세션
  async getSession() {
    if (DB) return DB.auth.getSession();
    // localStorage에 저장된 세션 복구
    try {
      const saved = localStorage.getItem('ssatis:session');
      if (saved) return { data: { session: { user: JSON.parse(saved) } } };
    } catch {}
    return { data: { session: null } };
  },

  // 세션 변화 구독
  onAuthStateChange(cb) {
    if (DB) return DB.auth.onAuthStateChange(cb);
    return { data: { subscription: { unsubscribe: () => {} } } };
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
      const data = Local.get(userId, "reports")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { data, error: null };
    }
    return DB.from("reports")
      .select("id, keyword, created_at, verdict, verdict_tone, collected, ideas_count, starred, share")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  async save(userId, reportData) {
    if (!DB) {
      const reports = Local.get(userId, "reports");
      const item = {
        id: "local-" + Date.now(),
        created_at: new Date().toISOString(),
        share: "비공개",
        starred: false,
        ...reportData,
      };
      Local.set(userId, "reports", [item, ...reports]);
      return { data: item, error: null };
    }
    return DB.from("reports")
      .insert({ user_id: userId, ...reportData })
      .select()
      .single();
  },

  async toggleStar(reportId, starred) {
    if (!DB) {
      // 모든 유저의 reports를 순회해서 해당 id 업데이트
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith("ssatis:reports:")) continue;
        const reports = JSON.parse(localStorage.getItem(key) || "[]");
        const updated = reports.map(r => r.id === reportId ? { ...r, starred } : r);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return { error: null };
    }
    return DB.from("reports").update({ starred }).eq("id", reportId);
  },

  async updateShare(reportId, share) {
    if (!DB) return { error: null };
    return DB.from("reports").update({ share }).eq("id", reportId);
  },

  async delete(reportId) {
    if (!DB) {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith("ssatis:reports:")) continue;
        const reports = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify(reports.filter(r => r.id !== reportId)));
      }
      return { error: null };
    }
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
      if (session?.user) {
        // localStorage 세션 복구 (Google 직접 로그인)
        const u = session.user;
        if (u.sub || u.id) {
          setSupaUser({ id: u.sub || u.id, email: u.email, name: u.name, plan: "Free", avatar: u.picture || u.avatar || null });
          setLoading(false);
          return;
        }
        _hydrateUser(session.user);
      }
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
    const result = await Auth.signInWithGoogle();
    const { error, googleUser } = result || {};

    if (googleUser) {
      const user = { id: googleUser.id, email: googleUser.email, name: googleUser.name, plan: "Free", avatar: googleUser.avatar };
      localStorage.setItem('ssatis:session', JSON.stringify(googleUser));
      setSupaUser(user);
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

-- App 기본 테이블: profiles, reports, saved_ideas
-- supabase.js 스키마 주석 기반으로 생성

-- ── 1. profiles ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  plan       text default 'Free',
  created_at timestamptz default now()
);

alter table profiles enable row level security;

do $$ begin
  create policy "own profile" on profiles for all using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- ── 2. reports ───────────────────────────────────────────────────────────────
create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  keyword      text not null,
  verdict      text,
  verdict_tone text,
  collected    int default 0,
  ideas_count  int default 0,
  share        text default '비공개',
  starred      boolean default false,
  result_json  jsonb,
  created_at   timestamptz default now()
);

create index if not exists reports_user_id_idx    on reports(user_id);
create index if not exists reports_created_at_idx on reports(created_at);

alter table reports enable row level security;

do $$ begin
  create policy "own reports" on reports for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- result_json 컬럼이 없는 기존 테이블에 추가 (이미 있으면 에러 무시)
do $$ begin
  alter table reports add column result_json jsonb;
exception when duplicate_column then null;
end $$;

-- ── 3. saved_ideas ───────────────────────────────────────────────────────────
create table if not exists saved_ideas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  report_id    uuid references reports(id) on delete set null,
  keyword      text,
  title        text,
  verdict      text,
  verdict_tone text,
  note         text default '',
  created_at   timestamptz default now()
);

create index if not exists saved_ideas_user_id_idx on saved_ideas(user_id);

alter table saved_ideas enable row level security;

do $$ begin
  create policy "own ideas" on saved_ideas for all using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

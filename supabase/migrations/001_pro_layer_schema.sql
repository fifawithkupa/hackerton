-- Pro Layer: Market Signals + YC Insights
-- Gemini text-embedding-004 = 768 dims.

create extension if not exists vector;

-- ── 1. pain_clusters ─────────────────────────────────────────────────────────
-- 기존 분석 결과의 페인포인트 클러스터를 영속 저장
create table if not exists pain_clusters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  keyword     text not null,
  title       text not null,
  summary     text,
  severity    text check (severity in ('high','mid','low')),
  empathy     int  default 0,
  comments    int  default 0,
  rank        int  default 1,
  result_json jsonb,
  created_at  timestamptz default now()
);

create index if not exists pain_clusters_user_id_idx on pain_clusters(user_id);
create index if not exists pain_clusters_keyword_idx  on pain_clusters(keyword);

alter table pain_clusters enable row level security;
drop policy if exists "own clusters" on pain_clusters;
create policy "own clusters" on pain_clusters for all using (auth.uid() = user_id);

-- ── 2. market_signals ────────────────────────────────────────────────────────
create table if not exists market_signals (
  id            uuid primary key default gen_random_uuid(),
  cluster_id    uuid references pain_clusters(id) on delete cascade,
  keyword       text not null,
  google_trend  jsonb,   -- { values:[{date,value}], growth_rate, peak_period }
  naver_trend   jsonb,   -- { values:[{period,ratio}], growth_rate, peak_period }
  growth_rate   numeric,
  peak_period   text,
  fetched_at    timestamptz default now()
);

create index if not exists market_signals_cluster_id_idx on market_signals(cluster_id);
create index if not exists market_signals_keyword_idx    on market_signals(keyword);
create index if not exists market_signals_fetched_at_idx on market_signals(fetched_at);

-- ── 3. yc_companies ──────────────────────────────────────────────────────────
create table if not exists yc_companies (
  id               text primary key,  -- YC slug
  name             text not null,
  batch            text,
  one_liner        text,
  long_description text,
  category         text[],
  website          text,
  embedding        vector(768),
  scraped_at       timestamptz default now()
);

create index if not exists yc_companies_embedding_idx
  on yc_companies using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── 4. yc_rfs ────────────────────────────────────────────────────────────────
create table if not exists yc_rfs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text[],
  year        int,
  source_url  text,
  embedding   vector(768)
);

create index if not exists yc_rfs_embedding_idx
  on yc_rfs using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);

-- ── 5. cluster_yc_matches ────────────────────────────────────────────────────
create table if not exists cluster_yc_matches (
  id               uuid primary key default gen_random_uuid(),
  cluster_id       uuid references pain_clusters(id) on delete cascade,
  yc_company_id    text references yc_companies(id) on delete cascade,
  yc_rfs_id        uuid references yc_rfs(id) on delete cascade,
  similarity_score numeric not null,
  created_at       timestamptz default now(),
  check (yc_company_id is not null or yc_rfs_id is not null)
);

create index if not exists cluster_yc_matches_cluster_id_idx on cluster_yc_matches(cluster_id);
create index if not exists cluster_yc_matches_created_at_idx on cluster_yc_matches(created_at);

-- ── RPC: vector similarity search ────────────────────────────────────────────
create or replace function match_yc_companies(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (
  id               text,
  name             text,
  batch            text,
  one_liner        text,
  long_description text,
  category         text[],
  website          text,
  similarity       float
)
language sql stable as $$
  select
    id, name, batch, one_liner, long_description, category, website,
    1 - (embedding <=> query_embedding) as similarity
  from yc_companies
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_yc_rfs(
  query_embedding vector(768),
  match_count     int default 3
)
returns table (
  id          uuid,
  title       text,
  description text,
  category    text[],
  year        int,
  source_url  text,
  similarity  float
)
language sql stable as $$
  select
    id, title, description, category, year, source_url,
    1 - (embedding <=> query_embedding) as similarity
  from yc_rfs
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

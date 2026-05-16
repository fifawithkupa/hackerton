create extension if not exists vector;

create table if not exists market_signals (
  id            uuid primary key default gen_random_uuid(),
  cluster_id    uuid,
  keyword       text not null,
  google_trend  jsonb,
  naver_trend   jsonb,
  growth_rate   numeric,
  peak_period   text,
  fetched_at    timestamptz default now()
);

create index if not exists market_signals_keyword_idx    on market_signals(keyword);
create index if not exists market_signals_fetched_at_idx on market_signals(fetched_at);

create table if not exists yc_companies (
  id               text primary key,
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

create table if not exists cluster_yc_matches (
  id               uuid primary key default gen_random_uuid(),
  cluster_id       uuid,
  yc_company_id    text references yc_companies(id) on delete cascade,
  yc_rfs_id        uuid references yc_rfs(id) on delete cascade,
  similarity_score numeric not null,
  created_at       timestamptz default now()
);

create index if not exists cluster_yc_matches_cluster_id_idx on cluster_yc_matches(cluster_id);

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
  select id, name, batch, one_liner, long_description, category, website,
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
  select id, title, description, category, year, source_url,
    1 - (embedding <=> query_embedding) as similarity
  from yc_rfs
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

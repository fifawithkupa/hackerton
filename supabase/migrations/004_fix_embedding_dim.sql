-- gemini-embedding-001 = 3072 dims (text-embedding-004 사용 불가)
alter table yc_companies alter column embedding type vector(3072);
alter table yc_rfs       alter column embedding type vector(3072);

drop index if exists yc_companies_embedding_idx;
drop index if exists yc_rfs_embedding_idx;

create index yc_companies_embedding_idx
  on yc_companies using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index yc_rfs_embedding_idx
  on yc_rfs using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);

create or replace function match_yc_companies(
  query_embedding vector(3072),
  match_count     int default 5
)
returns table (
  id text, name text, batch text, one_liner text,
  long_description text, category text[], website text, similarity float
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
  query_embedding vector(3072),
  match_count     int default 3
)
returns table (
  id uuid, title text, description text,
  category text[], year int, source_url text, similarity float
)
language sql stable as $$
  select id, title, description, category, year, source_url,
    1 - (embedding <=> query_embedding) as similarity
  from yc_rfs
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

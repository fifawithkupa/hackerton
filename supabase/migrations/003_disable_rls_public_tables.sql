-- yc_companies, yc_rfs, market_signals, cluster_yc_matches는
-- 유저별 격리 불필요한 공용 데이터 — RLS 비활성화
alter table yc_companies      disable row level security;
alter table yc_rfs             disable row level security;
alter table market_signals     disable row level security;
alter table cluster_yc_matches disable row level security;

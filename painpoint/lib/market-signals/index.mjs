import { createClient } from "@supabase/supabase-js";
import { fetchGoogleTrends } from "./google-trends.mjs";
import { fetchNaverDatalab }  from "./naver-datalab.mjs";

function getDB() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  );
}

const CACHE_TTL_DAYS = 7;

/**
 * 키워드의 시장 신호를 수집하고 market_signals 테이블에 저장.
 * 7일 이내 캐시가 있으면 그대로 반환.
 * Pro 플랜 체크는 호출부(API route)에서 수행.
 */
export async function fetchMarketSignals(clusterId, keyword) {
  const db = getDB();

  // 캐시 확인
  const since = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await db
    .from("market_signals")
    .select("*")
    .eq("keyword", keyword)
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    console.log(`[market-signals] cache hit: "${keyword}"`);
    return cached;
  }

  // 병렬 수집 — 한쪽 실패해도 진행
  const [gResult, nResult] = await Promise.allSettled([
    fetchGoogleTrends(keyword),
    fetchNaverDatalab(keyword),
  ]);

  if (gResult.status === "rejected")
    console.warn("[market-signals] google-trends error:", gResult.reason?.message);
  if (nResult.status === "rejected")
    console.warn("[market-signals] naver-datalab error:", nResult.reason?.message);

  const google_trend = gResult.status === "fulfilled" ? gResult.value : null;
  const naver_trend  = nResult.status === "fulfilled"  ? nResult.value  : null;

  // 성장률은 두 소스 평균 (있는 것만)
  const rates = [google_trend?.growth_rate, naver_trend?.growth_rate].filter(v => v != null);
  const growth_rate  = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
  const peak_period  = google_trend?.peak_period || naver_trend?.peak_period || null;

  const { data, error } = await db
    .from("market_signals")
    .insert({ cluster_id: clusterId, keyword, google_trend, naver_trend, growth_rate, peak_period })
    .select()
    .single();

  if (error) throw new Error("market_signals 저장 실패: " + error.message);

  console.log(`[market-signals] fetched: "${keyword}" growth=${growth_rate}%`);
  return data;
}

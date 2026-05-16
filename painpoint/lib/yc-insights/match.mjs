import { createClient } from "@supabase/supabase-js";

const CACHE_TTL_DAYS = 30;

function getDB() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

async function embedText(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini embedding HTTP ${res.status}`);
  const data = await res.json();
  const vec = data?.embedding?.values;
  if (!vec) throw new Error("Gemini embedding 응답 없음");
  return vec;
}

/**
 * 클러스터에 대해 유사 YC 회사 5개 + RFS 3개를 찾아 반환
 * @param {string} clusterId  - pain_clusters.id
 * @returns {{ companies: YCCompany[], rfs: YCRFS[] }}
 */
export async function matchYC(clusterId) {
  const db = getDB();

  // 캐시 확인 (30일 TTL)
  const since = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await db
    .from("cluster_yc_matches")
    .select("*, yc_companies(*), yc_rfs(*)")
    .eq("cluster_id", clusterId)
    .gte("created_at", since);

  if (cached?.length) {
    console.log(`[yc-match] cache hit: cluster ${clusterId}`);
    return formatCached(cached);
  }

  // 클러스터 텍스트 가져오기
  const { data: cluster, error: clErr } = await db
    .from("pain_clusters")
    .select("title, summary")
    .eq("id", clusterId)
    .single();

  if (clErr || !cluster) throw new Error("클러스터를 찾을 수 없습니다");

  const queryText = `${cluster.title} ${cluster.summary || ""}`.slice(0, 1000);
  const embedding = await embedText(queryText);

  // pgvector RPC 병렬 검색
  const [compResult, rfsResult] = await Promise.all([
    db.rpc("match_yc_companies", { query_embedding: embedding, match_count: 5 }),
    db.rpc("match_yc_rfs",       { query_embedding: embedding, match_count: 3 }),
  ]);

  if (compResult.error) console.warn("[yc-match] match_yc_companies error:", compResult.error.message);
  if (rfsResult.error)  console.warn("[yc-match] match_yc_rfs error:", rfsResult.error.message);

  const companies = compResult.data || [];
  const rfs       = rfsResult.data  || [];

  // 캐시 저장 (결과 유무 관계 없이)
  const cacheRows = [
    ...companies.map(c => ({ cluster_id: clusterId, yc_company_id: c.id, similarity_score: c.similarity })),
    ...rfs.map(r => ({ cluster_id: clusterId, yc_rfs_id: r.id, similarity_score: r.similarity })),
  ];
  if (cacheRows.length) {
    await db.from("cluster_yc_matches").insert(cacheRows);
  }

  console.log(`[yc-match] clusterId=${clusterId} → ${companies.length} companies, ${rfs.length} rfs`);
  return { companies, rfs };
}

function formatCached(rows) {
  const companies = rows
    .filter(r => r.yc_companies)
    .map(r => ({ ...r.yc_companies, similarity: r.similarity_score }));
  const rfs = rows
    .filter(r => r.yc_rfs)
    .map(r => ({ ...r.yc_rfs, similarity: r.similarity_score }));
  return { companies, rfs };
}

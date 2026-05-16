import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const lines = readFileSync(resolve(__dir, "../../.env"), "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function embedBatch(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const responses = await Promise.all(batch.map(text =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
      }).then(r => r.json())
    ));
    for (const r of responses) results.push(r?.embedding?.values || null);
    console.log(`[seed-yc] embedding ${Math.min(i + 100, texts.length)}/${texts.length}`);
  }
  return results;
}

async function fetchAllCompanies() {
  const companies = [];
  let page = 1;

  while (true) {
    const res = await fetch(`https://api.ycombinator.com/v0.1/companies?page=${page}&per_page=100`, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) break;
    const json = await res.json();
    const batch = json.companies || [];
    if (!batch.length) break;

    for (const c of batch) {
      companies.push({
        id:               c.slug || String(c.id),
        name:             c.name || "",
        batch:            c.batch || "",
        one_liner:        c.oneLiner || "",
        long_description: c.longDescription || "",
        category:         c.tags || [],
        website:          c.website || "",
      });
    }
    console.log(`[seed-yc] page ${page}: ${batch.length}건 (누적 ${companies.length} / 총 ${json.totalPages ? json.totalPages * 100 : "?"})`);

    if (!json.nextPage || page >= (json.totalPages || 999)) break;
    page++;
    await new Promise(r => setTimeout(r, 300));
  }
  return companies;
}

async function main() {
  console.log("[seed-yc] YC companies 수집 시작...");
  const companies = await fetchAllCompanies();
  console.log(`[seed-yc] 총 ${companies.length}개 수집`);
  if (!companies.length) { console.error("[seed-yc] 수집 실패"); process.exit(1); }

  const texts = companies.map(c => `${c.name}. ${c.one_liner}. ${c.long_description}`.slice(0, 2000));
  console.log("[seed-yc] 임베딩 생성 중...");
  const embeddings = await embedBatch(texts);

  let done = 0, failed = 0;
  for (let i = 0; i < companies.length; i += 50) {
    const batch = companies.slice(i, i + 50).map((c, j) => ({
      ...c, embedding: embeddings[i + j], scraped_at: new Date().toISOString(),
    })).filter(c => c.id && c.embedding);

    const { error } = await db.from("yc_companies").upsert(batch, { onConflict: "id" });
    if (error) { console.error(`[seed-yc] upsert 실패 (${i}):`, error.message); failed += batch.length; }
    else { done += batch.length; }
    console.log(`[seed-yc] ${done}/${companies.length} upserted`);
  }
  console.log(`[seed-yc] 완료 — 성공: ${done}, 실패: ${failed}`);
}

main().catch(e => { console.error("[seed-yc] fatal:", e.message); process.exit(1); });

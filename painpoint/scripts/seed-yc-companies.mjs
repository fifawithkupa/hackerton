/**
 * YC 졸업사 디렉토리를 scrape해 yc_companies 테이블에 적재
 * 실행: node painpoint/scripts/seed-yc-companies.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// .env 로드 (dotenv 없으므로 직접 파싱)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../../.env");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function embed(texts) {
  // Gemini text-embedding-004: 768차원, 최대 100개 배치
  const results = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const requests = batch.map(text =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
      }).then(r => r.json())
    );
    const responses = await Promise.all(requests);
    for (const r of responses) {
      results.push(r?.embedding?.values || null);
    }
    console.log(`[seed-yc] embedding ${Math.min(i + 100, texts.length)}/${texts.length}`);
  }
  return results;
}

async function scrapeYCCompanies() {
  const companies = [];
  let page = 1;

  while (true) {
    const url = `https://www.ycombinator.com/companies?page=${page}`;
    console.log(`[seed-yc] fetching page ${page}...`);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SSATIS-Seed/1.0)" }
    });
    if (!res.ok) break;

    const html = await res.text();
    const $ = load(html);

    // YC 페이지의 JSON 데이터 추출 (Next.js __NEXT_DATA__ 태그)
    const nextData = $("script#__NEXT_DATA__").text();
    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        const items = json?.props?.pageProps?.companies || [];
        if (!items.length) break;

        for (const c of items) {
          companies.push({
            id:               c.slug || c.id?.toString(),
            name:             c.name,
            batch:            c.batch,
            one_liner:        c.one_liner || c.oneLiner || "",
            long_description: c.long_description || c.longDescription || "",
            category:         c.tags || c.verticals || [],
            website:          c.website || "",
          });
        }

        const total = json?.props?.pageProps?.totalCount || 0;
        console.log(`[seed-yc] page ${page}: ${items.length} companies (total: ${total})`);

        if (companies.length >= total || items.length < 20) break;
        page++;
        await new Promise(r => setTimeout(r, 800)); // rate limiting
        continue;
      } catch {}
    }

    // __NEXT_DATA__ 없으면 중단
    break;
  }

  return companies;
}

async function main() {
  console.log("[seed-yc] YC companies 수집 시작...");
  const companies = await scrapeYCCompanies();
  console.log(`[seed-yc] 총 ${companies.length}개 회사 수집`);

  if (!companies.length) {
    console.error("[seed-yc] 수집 실패 — YC 페이지 구조가 변경됐을 수 있습니다");
    process.exit(1);
  }

  // 임베딩할 텍스트 생성
  const texts = companies.map(c =>
    `${c.name}. ${c.one_liner}. ${c.long_description}`.slice(0, 2000)
  );

  console.log("[seed-yc] 임베딩 생성 중...");
  const embeddings = await embed(texts);

  // Supabase upsert (멱등성 보장)
  let done = 0, failed = 0;
  const BATCH = 50;
  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies.slice(i, i + BATCH).map((c, j) => ({
      ...c,
      embedding: embeddings[i + j],
      scraped_at: new Date().toISOString(),
    })).filter(c => c.id && c.embedding);

    const { error } = await db.from("yc_companies").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`[seed-yc] upsert 실패 (${i}~${i+BATCH}):`, error.message);
      failed += batch.length;
    } else {
      done += batch.length;
    }
    console.log(`[seed-yc] ${done}/${companies.length} upserted`);
  }

  console.log(`[seed-yc] 완료 — 성공: ${done}, 실패: ${failed}`);
}

main().catch(e => { console.error("[seed-yc] fatal:", e.message); process.exit(1); });

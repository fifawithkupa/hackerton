/**
 * YC Request for Startups 페이지를 scrape해 yc_rfs 테이블에 적재
 * 실행: node painpoint/scripts/seed-yc-rfs.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../../.env");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
);
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function embedSingle(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "models/gemini-embedding-001", content: { parts: [{ text }] } }),
    }
  );
  const data = await res.json();
  return data?.embedding?.values || null;
}

async function scrapeYCRFS() {
  const url = "https://www.ycombinator.com/rfs";
  console.log("[seed-yc-rfs] fetching", url);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SSATIS-Seed/1.0)" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = load(html);

  const items = [];
  const currentYear = new Date().getFullYear();

  // YC RFS 구조: 각 요청 항목은 h2/h3 + p 태그 패턴
  $("section, article, .rfs-item, [class*='request']").each((_, el) => {
    const title = $(el).find("h2, h3, h4").first().text().trim();
    const description = $(el).find("p").map((_, p) => $(p).text().trim()).get().join(" ").trim();
    if (title && title.length > 5 && description.length > 20) {
      items.push({ title, description, year: currentYear });
    }
  });

  // 위 패턴으로 못 찾으면 h2 기반으로 fallback
  if (!items.length) {
    $("h2").each((_, el) => {
      const title = $(el).text().trim();
      let description = "";
      let next = $(el).next();
      while (next.length && !next.is("h2")) {
        description += " " + next.text().trim();
        next = next.next();
      }
      if (title && description.trim().length > 20) {
        items.push({ title, description: description.trim(), year: currentYear });
      }
    });
  }

  // __NEXT_DATA__ JSON fallback
  if (!items.length) {
    const nextData = $("script#__NEXT_DATA__").text();
    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        const rfsItems = json?.props?.pageProps?.rfsItems || json?.props?.pageProps?.sections || [];
        for (const r of rfsItems) {
          items.push({
            title:       r.title || r.name || "",
            description: r.description || r.body || "",
            year:        r.year || currentYear,
          });
        }
      } catch {}
    }
  }

  return items;
}

async function main() {
  console.log("[seed-yc-rfs] YC RFS 수집 시작...");
  const items = await scrapeYCRFS();
  console.log(`[seed-yc-rfs] ${items.length}개 항목 수집`);

  if (!items.length) {
    console.error("[seed-yc-rfs] 수집 실패 — YC RFS 페이지 구조를 확인하세요");
    process.exit(1);
  }

  let done = 0;
  for (const [i, item] of items.entries()) {
    const text = `${item.title}. ${item.description}`.slice(0, 2000);
    const embedding = await embedSingle(text);

    const { error } = await db.from("yc_rfs").upsert(
      { ...item, category: [], source_url: "https://www.ycombinator.com/rfs", embedding },
      // title+year 조합으로 중복 방지 (unique constraint 없으므로 insert-or-skip)
    );

    if (error) {
      console.error(`[seed-yc-rfs] ${i+1}/${items.length} 실패:`, error.message);
    } else {
      done++;
      console.log(`[seed-yc-rfs] ${done}/${items.length} "${item.title.slice(0, 50)}"`);
    }

    // Gemini 임베딩 rate limit 회피
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[seed-yc-rfs] 완료 — ${done}/${items.length}`);
}

main().catch(e => { console.error("[seed-yc-rfs] fatal:", e.message); process.exit(1); });

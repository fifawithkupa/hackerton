/**
 * 로컬 개발 서버: 정적 파일 + API 프록시
 * - GET  /api/ssatis-health  — 상태 확인
 * - GET  /api/search?q=KEYWORD&sources=reddit,naver  — Reddit+Naver 병렬 수집
 * - POST /api/ssatis-analyze  — Gemini 분석 프록시
 *
 * 실행: node painpoint/dev-server.mjs
 * 브라우저: http://localhost:8787/
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// .env 파일 자동 로드 (dotenv 없이)
(function loadDotenv() {
  const candidates = [
    path.join(path.dirname(fileURLToPath(import.meta.url)), ".env"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
  ];
  for (const envPath of candidates) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
      break;
    } catch {}
  }
})();

import {
  DEFAULT_GEMINI_MODEL,
  buildGeminiGenerateBody,
  extractGeminiJsonText,
  unwrapJsonFence,
  normalizeAnalysisResult,
} from "./ssatis-ai-core.mjs";

import { searchReddit, redditPostUrl } from "./reddit-search.mjs";
import { searchNaver } from "./naver-search.mjs";
import { searchYoutube } from "./youtube-search.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8787;

// ── 설정 로드 ──────────────────────────────────────────────────────────────────

function loadConfigJs() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, "config.js"), "utf8");
    const g = raw.match(/geminiApiKey:\s*"([^"]*)"/);
    const o = raw.match(/openaiApiKey:\s*"([^"]*)"/);
    const key = (g?.[1] ?? o?.[1])?.trim() ?? "";
    const placeholder =
      /^YOUR_(GEMINI|OPENAI)/i.test(key) ||
      key === "" ||
      key === "YOUR_GEMINI_API_KEY" ||
      key === "YOUR_OPENAI_API_KEY";
    const geminiModel = raw.match(/geminiModel:\s*"([^"]*)"/)?.[1]?.trim();
    return {
      key: !placeholder && key.length >= 12 ? key : null,
      geminiModel: geminiModel || null,
    };
  } catch {
    return { key: null, geminiModel: null };
  }
}

function resolveGeminiModel() {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    loadConfigJs().geminiModel ||
    DEFAULT_GEMINI_MODEL
  );
}

function loadGeminiKey() {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (env) return env;
  return loadConfigJs().key;
}

let GEMINI_MODEL = resolveGeminiModel();

// ── 유틸 ──────────────────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let rel = decoded.replace(/^\/+/, "");
  if (!rel || rel.endsWith("/")) rel = path.join(rel, "index.html");
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

// ── 수집 결과 → PP_DATA 통합 빌더 ────────────────────────────────────────────

function buildCombinedPPData(keyword, redditPosts, naverPosts, youtubePosts = []) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Gemini 입력용 collectedPosts (텍스트 + 출처 포함)
  const redditCollected = redditPosts.map((p) => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    source: "reddit",
    url: redditPostUrl(p),
    score: p.score || 0,
  }));
  const naverCollected = naverPosts.map((p) => ({
    text: p.title,
    source: "naver",
    url: p.url || "",
    score: p.score || 0,
  }));
  const youtubeCollected = youtubePosts.map((p) => ({
    text: p.title,
    source: "youtube",
    url: p.url || "",
    score: p.score || 0,
  }));
  const collectedPosts = [...redditCollected, ...naverCollected, ...youtubeCollected];

  // Reddit + Naver + YouTube 인터리브 → 페인포인트 그룹
  const rSorted = [...redditPosts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const nSorted = [...naverPosts];
  const ySorted = [...youtubePosts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const interleaved = [];
  const maxLen = Math.max(rSorted.length, nSorted.length, ySorted.length);
  for (let i = 0; i < maxLen; i++) {
    if (rSorted[i]) interleaved.push({ ...rSorted[i], source: "reddit" });
    if (nSorted[i]) interleaved.push({ ...nSorted[i], source: "naver" });
    if (ySorted[i]) interleaved.push({ ...ySorted[i], source: "youtube" });
  }

  const groups = [
    interleaved.slice(0, 4),
    interleaved.slice(4, 8),
    interleaved.slice(8, 12),
  ].filter((g) => g.length > 0);

  const toSample = (p) => ({
    src: p.source,
    title: p.title || "",
    up: p.score || 0,
    link: p.source === "reddit" ? redditPostUrl(p) : (p.url || ""),
  });

  const painpoints = groups.map((group, i) => {
    const topTitle = group[0].title || "";
    const redditScore = group
      .filter((p) => p.source === "reddit")
      .reduce((a, p) => a + (p.score || 0), 0);
    const naverCount = group.filter((p) => p.source === "naver").length;

    return {
      id: `pp${i + 1}`,
      rank: i + 1,
      title: topTitle.length > 60 ? topTitle.slice(0, 60) + "…" : topTitle,
      summary:
        group
          .map((p) => p.selftext || p.title)
          .join(" ")
          .slice(0, 200) + "…",
      severity: i === 0 ? "high" : "mid",
      empathy: redditScore + naverCount * 10,
      comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
      sources: {
        reddit: redditScore || 0,
        naver: naverCount * 10,
        youtube: group.filter((p) => p.source === "youtube").reduce((a, p) => a + (p.score || 0), 0),
      },
      emotions: { 관심: 45, 공감: 35, 분노: 20 },
      samples: group.slice(0, 3).map(toSample),
    };
  });

  const totalCollected = redditPosts.length + naverPosts.length + youtubePosts.length;

  const ppData = {
    trendingKeywords: [
      { kw: keyword, delta: "실시간", category: "Reddit+Naver+YouTube" },
    ],
    sources: [
      {
        id: "reddit",
        name: "레딧",
        desc: `Reddit 검색: "${keyword}"`,
        posts: redditPosts.length,
        defaultOn: true,
        free: true,
      },
      {
        id: "naver",
        name: "네이버",
        desc: `블로그·카페·지식인: "${keyword}"`,
        posts: naverPosts.length,
        defaultOn: true,
        free: true,
      },
      {
        id: "youtube",
        name: "유튜브 댓글",
        desc: `관련 영상 댓글: "${keyword}"`,
        posts: youtubePosts.length,
        defaultOn: true,
        free: true,
      },
    ],
    result: {
      keyword,
      analyzedAt: now,
      totalCollected,
      afterFilter: Math.max(1, Math.floor(totalCollected * 0.85)),
      verdict: "분석 중",
      verdictTone: "violet",
      log: [
        {
          src: "레딧",
          id: "reddit",
          n: redditPosts.length,
          t: `Reddit 검색: "${keyword}"`,
          d: 0.5,
        },
        {
          src: "네이버",
          id: "naver",
          n: naverPosts.length,
          t: `블로그·카페·지식인: "${keyword}"`,
          d: 1.2,
        },
        {
          src: "유튜브",
          id: "youtube",
          n: youtubePosts.length,
          t: `유튜브 댓글: "${keyword}"`,
          d: 2.0,
        },
      ].filter((l) => l.n > 0),
      painpoints,
      ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

// ── HTTP 서버 ─────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
    res.end();
    return;
  }

  // ── /api/ssatis-health ──────────────────────────────────────────────────────
  if (req.method === "GET" && req.url.split("?")[0] === "/api/ssatis-health") {
    send(
      res,
      200,
      JSON.stringify({
        provider: "gemini",
        model: resolveGeminiModel(),
        keyLoaded: Boolean(loadGeminiKey()),
      }),
    );
    return;
  }

  const pathname = req.url.split("?")[0];

  // ── GET /api/search ─────────────────────────────────────────────────────────
  if (req.method === "GET" && pathname === "/api/search") {
    try {
      const urlObj = new URL(req.url, `http://127.0.0.1:${PORT}`);
      const keyword = String(urlObj.searchParams.get("q") || "").trim();
      if (!keyword) {
        send(res, 400, JSON.stringify({ error: "keyword required" }));
        return;
      }

      // sources 파라미터: "reddit,naver" 형식, 없으면 둘 다
      const sourcesParam = urlObj.searchParams.get("sources") || "reddit,naver,youtube";
      const enabledSources = sourcesParam.split(",").map((s) => s.trim()).filter(Boolean);
      const useReddit = enabledSources.includes("reddit");
      const useNaver = enabledSources.includes("naver");
      const useYoutube = enabledSources.includes("youtube");

      console.log(`[search] "${keyword}" | sources: ${enabledSources.join(", ")}`);

      const [redditResult, naverResult, youtubeResult] = await Promise.allSettled([
        useReddit ? searchReddit(keyword) : Promise.resolve([]),
        useNaver ? searchNaver(keyword) : Promise.resolve([]),
        useYoutube ? searchYoutube(keyword) : Promise.resolve([]),
      ]);

      const redditPosts = redditResult.status === "fulfilled" ? redditResult.value : [];
      const naverPosts = naverResult.status === "fulfilled" ? naverResult.value : [];
      const youtubePosts = youtubeResult.status === "fulfilled" ? youtubeResult.value : [];

      if (redditResult.status === "rejected") console.warn("[search] Reddit 오류:", redditResult.reason?.message);
      if (naverResult.status === "rejected") console.warn("[search] Naver 오류:", naverResult.reason?.message);
      if (youtubeResult.status === "rejected") console.warn("[search] YouTube 오류:", youtubeResult.reason?.message);

      if (!redditPosts.length && !naverPosts.length && !youtubePosts.length) {
        send(
          res,
          404,
          JSON.stringify({
            error: `"${keyword}" 관련 글을 찾지 못했습니다. 다른 키워드를 시도해 보세요.`,
          }),
        );
        return;
      }

      const { ppData, collectedPosts } = buildCombinedPPData(
        keyword,
        redditPosts,
        naverPosts,
        youtubePosts,
      );

      console.log(
        `[search] Reddit ${redditPosts.length}건 + Naver ${naverPosts.length}건 + YouTube ${youtubePosts.length}건 = 총 ${collectedPosts.length}건`,
      );

      send(res, 200, JSON.stringify({ ...ppData, collectedPosts }));
    } catch (e) {
      console.error("[api/search]", e);
      send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  // ── POST /api/ssatis-analyze ────────────────────────────────────────────────
  if (req.method === "POST" && pathname === "/api/ssatis-analyze") {
    try {
      const apiKey = loadGeminiKey();
      if (!apiKey) {
        send(
          res,
          500,
          JSON.stringify({
            error:
              "GEMINI_API_KEY 없음 (환경변수) 또는 config.js 의 geminiApiKey",
          }),
        );
        return;
      }

      const body = await readBody(req);
      const keyword = String(body.keyword || "").trim();
      const posts = Array.isArray(body.posts) ? body.posts : [];
      const collectMeta =
        body.collectMeta && typeof body.collectMeta === "object"
          ? body.collectMeta
          : null;

      if (!posts.length) {
        send(res, 400, JSON.stringify({ error: "posts 배열이 비었습니다." }));
        return;
      }

      GEMINI_MODEL = resolveGeminiModel();
      const geminiBody = buildGeminiGenerateBody(keyword, posts);

      const geminiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}` +
        `:generateContent?key=${encodeURIComponent(apiKey)}`;

      console.log(`[analyze] "${keyword}" | posts: ${posts.length} | model: ${GEMINI_MODEL}`);

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });

      const rawText = await geminiRes.text();
      if (!geminiRes.ok) {
        send(res, 502, JSON.stringify({ error: rawText || "Gemini 오류 " + geminiRes.status }));
        return;
      }

      let outer;
      try {
        outer = JSON.parse(rawText);
      } catch {
        send(res, 502, JSON.stringify({ error: "Gemini 응답 JSON 파싱 실패" }));
        return;
      }

      let contentText;
      try {
        contentText = extractGeminiJsonText(outer);
      } catch (e) {
        send(res, 502, JSON.stringify({ error: String(e.message || e) }));
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(unwrapJsonFence(contentText));
      } catch {
        send(res, 502, JSON.stringify({
          error: "모델 출력 JSON 파싱 실패",
          snippet: contentText.slice(0, 400),
        }));
        return;
      }

      const result = normalizeAnalysisResult(parsed, keyword, posts, collectMeta);
      console.log(`[analyze] 완료 — painpoints: ${result.painpoints?.length}, ideas: ${result.ideas?.length}`);
      send(res, 200, JSON.stringify(result));
    } catch (e) {
      console.error("[ssatis-analyze]", e);
      send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  // ── 정적 파일 서빙 ──────────────────────────────────────────────────────────
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed", "text/plain; charset=utf-8");
    return;
  }

  const abs = safeResolve(req.url === "/" ? "/index.html" : req.url);
  if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    send(res, 404, "Not Found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(abs).toLowerCase();
  const ct = MIME[ext] || "application/octet-stream";

  if (req.method === "HEAD") {
    res.writeHead(200, { "Content-Type": ct });
    res.end();
    return;
  }

  fs.readFile(abs, (err, data) => {
    if (err) {
      send(res, 500, "Read Error", "text/plain; charset=utf-8");
      return;
    }
    send(res, 200, data, ct);
  });
});

server.listen(PORT, () => {
  console.log(`\nSSATIS dev server  http://localhost:${PORT}/`);
  console.log(`Gemini 모델  : ${resolveGeminiModel()}`);
  console.log(`Gemini 키    : ${loadGeminiKey() ? "로드됨 ✓" : "없음 — .env 또는 config.js 확인"}`);
  console.log(`수집 소스    : Reddit + 네이버 (블로그·카페·지식인)\n`);
});

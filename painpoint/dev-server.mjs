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
  buildGeminiGenerateBody,
  extractGeminiJsonText,
  unwrapJsonFence,
  normalizeAnalysisResult,
} from "./ssatis-ai-core.mjs";
import { buildCombinedPPData, normalizeCollectedPosts } from "./build-pp-data.mjs";
import { loadGeminiKey, loadYoutubeKey, resolveGeminiModel } from "./server-config.mjs";
import { searchReddit } from "./reddit-search.mjs";
import { searchNaver } from "./naver-search.mjs";
import { searchYoutube } from "./youtube-search.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8787;

// ── 설정 로드 ──────────────────────────────────────────────────────────────────

function loadTossSecretKey() {
  return process.env.TOSS_SECRET_KEY?.trim() || "test_sk_DnyRpQWGrND0DwggYggL3Kwv1M9E";
}

function loadTossClientKey() {
  return process.env.TOSS_CLIENT_KEY?.trim() || "test_ck_24xLea5zVAzBA06wlZ5KrQAMYNwW";
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
        youtubeKeyLoaded: Boolean(loadYoutubeKey()),
        tossClientKey: loadTossClientKey(),
      }),
    );
    return;
  }

  const pathname = req.url.split("?")[0];

  // ── POST /api/toss/confirm — 토스페이먼츠 결제 승인 ──────────────────────────
  if (req.method === "POST" && pathname === "/api/toss/confirm") {
    try {
      const body = await readBody(req);
      const { paymentKey, orderId, amount } = body;
      if (!paymentKey || !orderId || !amount) {
        send(res, 400, JSON.stringify({ error: "paymentKey, orderId, amount 필수" }));
        return;
      }
      const secretKey = loadTossSecretKey();
      const auth = Buffer.from(`${secretKey}:`).toString("base64");
      const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      });
      const tossData = await tossRes.json();
      if (!tossRes.ok) {
        console.error("[toss/confirm] 실패:", tossData);
        send(res, 400, JSON.stringify({ error: tossData.message || "결제 승인 실패" }));
        return;
      }
      console.log(`[toss/confirm] 성공: orderId=${orderId} amount=${amount}`);
      send(res, 200, JSON.stringify({ success: true, payment: tossData }));
    } catch (e) {
      console.error("[toss/confirm]", e);
      send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  // ── /payment/* — SPA 결제 콜백 라우팅 (index.html 서빙) ─────────────────────
  if (req.method === "GET" && (pathname === "/payment/success" || pathname === "/payment/fail")) {
    const indexPath = path.join(ROOT, "index.html");
    fs.readFile(indexPath, (err, data) => {
      if (err) { send(res, 500, "Read Error", "text/plain; charset=utf-8"); return; }
      send(res, 200, data, "text/html; charset=utf-8");
    });
    return;
  }

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
      const posts = normalizeCollectedPosts(body.posts);
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
  console.log(`YouTube 키   : ${loadYoutubeKey() ? "로드됨 ✓" : "없음 — .env 의 YOUTUBE_API_KEY 확인"}`);
  console.log(`수집 소스    : Reddit + 네이버 + YouTube\n`);
});

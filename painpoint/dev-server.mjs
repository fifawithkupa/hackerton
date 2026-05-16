/**

 * 로컬 개발 서버: 정적 파일 + POST /api/ssatis-analyze (Gemini 프록시, CORS 회피)

 * 실행: node painpoint/dev-server.mjs

 * 브라우저: http://localhost:8787/

 *

 * API 키: 환경변수 또는 painpoint/config.js
 *   - GEMINI_API_KEY / geminiApiKey / openaiApiKey
 *   - YOUTUBE_API_KEY / youtubeApiKey

 */

import http from "http";

import fs from "fs";

import path from "path";

import { fileURLToPath } from "url";

import {

  DEFAULT_GEMINI_MODEL,

  buildGeminiGenerateBody,

  extractGeminiJsonText,

  unwrapJsonFence,

  normalizeAnalysisResult,

} from "./ssatis-ai-core.mjs";
import { searchReddit } from "./reddit-search.mjs";
import { searchYoutubeComments } from "./youtube-search.mjs";
import { mergeCollectPPData } from "./collect-merge.mjs";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = __dirname;

const PORT = Number(process.env.PORT) || 8787;

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
    const yt = raw.match(/youtubeApiKey:\s*"([^"]*)"/)?.[1]?.trim() ?? "";
    const ytPlaceholder =
      /^YOUR_YOUTUBE/i.test(yt) || yt === "" || yt === "YOUR_YOUTUBE_API_KEY";
    return {
      key: !placeholder && key.length >= 12 ? key : null,
      geminiModel: geminiModel || null,
      youtubeKey: !ytPlaceholder && yt.length >= 12 ? yt : null,
    };
  } catch {
    return { key: null, geminiModel: null, youtubeKey: null };
  }
}

function resolveGeminiModel() {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    loadConfigJs().geminiModel ||
    DEFAULT_GEMINI_MODEL
  );
}

let GEMINI_MODEL = resolveGeminiModel();



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



function loadGeminiKey() {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (env) return env;
  return loadConfigJs().key;
}

function loadYoutubeKey() {
  const env = process.env.YOUTUBE_API_KEY?.trim();
  if (env) return env;
  return loadConfigJs().youtubeKey;
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

  res.writeHead(status, { "Content-Type": contentType });

  res.end(body);

}



const server = http.createServer(async (req, res) => {

  if (req.method === "GET" && req.url.split("?")[0] === "/api/ssatis-health") {
    send(
      res,
      200,
      JSON.stringify({
        provider: "gemini",
        model: resolveGeminiModel(),
        keyLoaded: Boolean(loadGeminiKey()),
        youtubeKeyLoaded: Boolean(loadYoutubeKey()),
      }),
    );
    return;
  }

  const pathname = req.url.split("?")[0];

  if (req.method === "GET" && pathname === "/api/search") {
    try {
      const q = new URL(req.url, `http://127.0.0.1:${PORT}`).searchParams.get("q");
      const keyword = String(q || "").trim();
      if (!keyword) {
        send(res, 400, JSON.stringify({ error: "keyword required" }));
        return;
      }
      const ytKey = loadYoutubeKey();
      const [redditPosts, youtubeComments] = await Promise.all([
        searchReddit(keyword),
        ytKey
          ? searchYoutubeComments(keyword, ytKey).catch((e) => {
              console.warn("[api/search] YouTube:", e.message);
              return [];
            })
          : Promise.resolve([]),
      ]);

      if (!redditPosts.length && !youtubeComments.length) {
        send(
          res,
          404,
          JSON.stringify({
            error: ytKey
              ? `Reddit·YouTube에서 "${keyword}" 관련 글을 찾지 못했습니다.`
              : `Reddit에서 "${keyword}" 관련 글을 찾지 못했습니다. config.js에 youtubeApiKey를 넣으면 YouTube 댓글도 수집합니다.`,
          }),
        );
        return;
      }

      const { ppData, collectedPosts } = mergeCollectPPData(
        keyword,
        redditPosts,
        youtubeComments,
      );
      send(res, 200, JSON.stringify({ ...ppData, collectedPosts }));
    } catch (e) {
      console.error("[api/search]", e);
      send(res, 500, JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/ssatis-analyze")) {

    try {

      const apiKey = loadGeminiKey();

      if (!apiKey) {

        send(

          res,

          500,

          JSON.stringify({

            error:

              "GEMINI_API_KEY 없음 (환경변수) 또는 config.js 의 geminiApiKey / openaiApiKey",

          }),

        );

        return;

      }



      const body = await readBody(req);

      const keyword = String(body.keyword || "").trim();

      const posts = Array.isArray(body.posts) ? body.posts : [];
      const collectMeta = body.collectMeta && typeof body.collectMeta === "object"
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

        send(res, 502, JSON.stringify({ error: "모델 출력 JSON 파싱 실패", snippet: contentText.slice(0, 400) }));

        return;

      }



      const result = normalizeAnalysisResult(parsed, keyword, posts, collectMeta);

      send(res, 200, JSON.stringify(result));

    } catch (e) {

      console.error("[ssatis-analyze]", e);

      send(res, 500, JSON.stringify({ error: String(e.message || e) }));

    }

    return;

  }



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

  console.log(`SSATIS dev server  http://localhost:${PORT}/`);

  console.log(`Gemini 모델: ${GEMINI_MODEL}`);

  console.log(`Gemini 키: ${loadGeminiKey() ? "로드됨" : "없음 — GEMINI_API_KEY 또는 config.js 확인"}`);
  console.log(`YouTube 키: ${loadYoutubeKey() ? "로드됨" : "없음 — YOUTUBE_API_KEY 또는 config.js youtubeApiKey"}`);

});



import {
  DEFAULT_GEMINI_MODEL,
  buildGeminiGenerateBody,
  extractGeminiJsonText,
  unwrapJsonFence,
  normalizeAnalysisResult,
} from "../ssatis-ai-core.mjs";
import { normalizeCollectedPosts } from "../build-pp-data.mjs";
import { loadGeminiKey, resolveGeminiModel } from "../server-config.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = loadGeminiKey();
  if (!apiKey) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY가 없습니다. Vercel 프로젝트 Settings → Environment Variables에 GEMINI_API_KEY를 추가하세요.",
    });
  }

  const body = req.body || {};
  const keyword = String(body.keyword || "").trim();
  const posts = normalizeCollectedPosts(body.posts);
  const collectMeta = body.collectMeta || null;

  if (!posts.length) {
    return res.status(400).json({ error: "분석할 수집 글이 없습니다. 검색 API가 정상인지 확인하세요." });
  }

  const model = resolveGeminiModel() || DEFAULT_GEMINI_MODEL;
  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildGeminiGenerateBody(keyword, posts)),
    });

    const rawText = await geminiRes.text();
    if (!geminiRes.ok) {
      return res.status(502).json({ error: rawText || `Gemini 오류 ${geminiRes.status}` });
    }

    let outer;
    try {
      outer = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ error: "Gemini 응답 JSON 파싱 실패" });
    }

    let contentText;
    try {
      contentText = extractGeminiJsonText(outer);
    } catch (e) {
      return res.status(502).json({ error: String(e.message || e) });
    }

    let parsed;
    try {
      parsed = JSON.parse(unwrapJsonFence(contentText));
    } catch {
      return res.status(502).json({
        error: "모델 출력 JSON 파싱 실패",
        snippet: contentText.slice(0, 400),
      });
    }

    const result = normalizeAnalysisResult(parsed, keyword, posts, collectMeta);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

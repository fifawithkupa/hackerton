import { searchReddit } from "../reddit-search.mjs";
import { searchNaver } from "../naver-search.mjs";
import { searchYoutube } from "../youtube-search.mjs";
import { buildCombinedPPData } from "../build-pp-data.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();

  const keyword = String(req.query?.q || "").trim();
  if (!keyword) return res.status(400).json({ error: "keyword required" });

  const sourcesParam = req.query?.sources || "reddit,naver,youtube";
  const enabled = sourcesParam.split(",").map((s) => s.trim());

  try {
    const [rResult, nResult, yResult] = await Promise.allSettled([
      enabled.includes("reddit") ? searchReddit(keyword) : Promise.resolve([]),
      enabled.includes("naver") ? searchNaver(keyword) : Promise.resolve([]),
      enabled.includes("youtube") ? searchYoutube(keyword) : Promise.resolve([]),
    ]);

    const rPosts = rResult.status === "fulfilled" ? rResult.value : [];
    const nPosts = nResult.status === "fulfilled" ? nResult.value : [];
    const yPosts = yResult.status === "fulfilled" ? yResult.value : [];

    if (!rPosts.length && !nPosts.length && !yPosts.length) {
      return res.status(404).json({ error: `"${keyword}" 관련 글을 찾지 못했습니다.` });
    }

    const { ppData, collectedPosts } = buildCombinedPPData(keyword, rPosts, nPosts, yPosts);
    res.status(200).json({ ...ppData, collectedPosts });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

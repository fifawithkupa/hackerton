import { searchReddit } from "../painpoint/reddit-search.mjs";
import { searchNaver } from "../painpoint/naver-search.mjs";
import { searchYoutube } from "../painpoint/youtube-search.mjs";

function buildCombinedPPData(keyword, redditPosts, naverPosts, youtubePosts = []) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const rSorted = [...redditPosts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const nSorted = [...naverPosts];
  const ySorted = [...youtubePosts];

  const interleaved = [];
  const maxLen = Math.max(rSorted.length, nSorted.length, ySorted.length);
  for (let i = 0; i < maxLen; i++) {
    if (rSorted[i]) interleaved.push({ ...rSorted[i], source: "reddit" });
    if (nSorted[i]) interleaved.push({ ...nSorted[i], source: "naver" });
    if (ySorted[i]) interleaved.push({ ...ySorted[i], source: "youtube" });
  }

  const groups = [interleaved.slice(0, 3), interleaved.slice(3, 6), interleaved.slice(6, 9)]
    .filter(g => g.length > 0);

  const toSample = p => ({ src: p.source, title: p.title, up: p.score || 0, link: p.url });

  const painpoints = groups.map((group, i) => ({
    id: `pp${i + 1}`, rank: i + 1,
    title: group[0].title.length > 60 ? group[0].title.slice(0, 60) + "…" : group[0].title,
    summary: group.map(p => p.selftext || p.title).join(" ").slice(0, 200) + "…",
    severity: i === 0 ? "high" : "mid",
    empathy: group.reduce((a, p) => a + (p.score || 0), 0),
    comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
    sources: {
      reddit:  group.filter(p => p.source === "reddit").reduce((a, p) => a + Math.max(p.score || 1, 1), 0),
      naver:   group.filter(p => p.source === "naver").length * 10,
      youtube: group.filter(p => p.source === "youtube").length * 10,
    },
    emotions: { 관심: 45, 공감: 35, 논쟁: 20 },
    samples: group.map(toSample),
  }));

  const total = redditPosts.length + naverPosts.length + youtubePosts.length;
  const collectedPosts = interleaved.map(p => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    title: p.title, url: p.url, source: p.source,
    selftext: p.selftext || "", score: p.score || 0,
  }));

  const ppData = {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Reddit+Naver" }],
    sources: [
      { id: "reddit",  name: "레딧",   desc: `Reddit: "${keyword}"`,   posts: redditPosts.length,  defaultOn: true, free: true },
      { id: "naver",   name: "네이버", desc: `Naver: "${keyword}"`,    posts: naverPosts.length,   defaultOn: true, free: true },
      { id: "youtube", name: "유튜브", desc: `YouTube: "${keyword}"`,  posts: youtubePosts.length, defaultOn: true, free: true },
    ],
    result: {
      keyword, analyzedAt: now,
      totalCollected: total,
      afterFilter: Math.floor(total * 0.85),
      verdict: "분석 완료", verdictTone: "violet",
      log: [
        { src: "레딧",   id: "reddit",  n: redditPosts.length,  t: `Reddit: "${keyword}"`,  d: 0.5 },
        { src: "네이버", id: "naver",   n: naverPosts.length,   t: `Naver: "${keyword}"`,   d: 1.2 },
        { src: "유튜브", id: "youtube", n: youtubePosts.length, t: `YouTube: "${keyword}"`, d: 1.8 },
      ],
      painpoints, ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();

  const keyword = String(req.query?.q || "").trim();
  if (!keyword) return res.status(400).json({ error: "keyword required" });

  const sourcesParam = req.query?.sources || "reddit,naver,youtube";
  const enabled = sourcesParam.split(",").map(s => s.trim());

  try {
    const [rResult, nResult, yResult] = await Promise.allSettled([
      enabled.includes("reddit")  ? searchReddit(keyword)  : Promise.resolve([]),
      enabled.includes("naver")   ? searchNaver(keyword)   : Promise.resolve([]),
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

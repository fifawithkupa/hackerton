import { redditPostUrl } from "./reddit-search.mjs";

/** Gemini·분석 API 입력용 — title/selftext 형식도 text 로 통일 */
export function normalizeCollectedPosts(posts) {
  if (!Array.isArray(posts)) return [];
  return posts
    .map((p) => {
      const text =
        (typeof p.text === "string" && p.text.trim()) ||
        [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500);
      if (!text.trim()) return null;
      return {
        text: text.trim(),
        source: p.source || "mixed",
        url: p.url || "",
        score: Number(p.score) || 0,
      };
    })
    .filter(Boolean);
}

export function buildCombinedPPData(keyword, redditPosts, naverPosts, youtubePosts = []) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const redditCollected = redditPosts.map((p) => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    source: "reddit",
    url: redditPostUrl(p),
    score: p.score || 0,
  }));
  const naverCollected = naverPosts.map((p) => ({
    text: p.title || "",
    source: "naver",
    url: p.url || "",
    score: p.score || 0,
  }));
  const youtubeCollected = youtubePosts.map((p) => ({
    text: p.title || p.selftext || "",
    source: "youtube",
    url: p.url || "",
    score: p.score || 0,
  }));
  const collectedPosts = [...redditCollected, ...naverCollected, ...youtubeCollected];

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
    link: p.source === "reddit" ? redditPostUrl(p) : p.url || "",
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
        youtube: group
          .filter((p) => p.source === "youtube")
          .reduce((a, p) => a + (p.score || 0), 0),
      },
      emotions: { 관심: 45, 공감: 35, 분노: 20 },
      samples: group.slice(0, 3).map(toSample),
    };
  });

  const totalCollected = redditPosts.length + naverPosts.length + youtubePosts.length;

  const ppData = {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Reddit+Naver+YouTube" }],
    sources: [
      {
        id: "reddit",
        name: "레딧",
        desc: `Reddit 검색: "${keyword}"`,
        posts: redditPosts.length,
        defaultOn: true,
        free: true,
        live: true,
      },
      {
        id: "naver",
        name: "네이버",
        desc: `블로그·카페·지식인: "${keyword}"`,
        posts: naverPosts.length,
        defaultOn: true,
        free: true,
        live: true,
      },
      {
        id: "youtube",
        name: "유튜브 댓글",
        desc: `관련 영상 댓글: "${keyword}"`,
        posts: youtubePosts.length,
        defaultOn: true,
        free: true,
        live: true,
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
        { src: "레딧", id: "reddit", n: redditPosts.length, t: `Reddit 검색: "${keyword}"`, d: 0.5 },
        { src: "네이버", id: "naver", n: naverPosts.length, t: `블로그·카페·지식인: "${keyword}"`, d: 1.2 },
        { src: "유튜브", id: "youtube", n: youtubePosts.length, t: `유튜브 댓글: "${keyword}"`, d: 2.0 },
      ].filter((l) => l.n > 0),
      painpoints,
      ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

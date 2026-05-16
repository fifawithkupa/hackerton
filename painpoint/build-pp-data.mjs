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

export function buildCombinedPPData(keyword, naverPosts, youtubePosts = []) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
  const collectedPosts = [...naverCollected, ...youtubeCollected];

  const nSorted = [...naverPosts];
  const ySorted = [...youtubePosts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const interleaved = [];
  const maxLen = Math.max(nSorted.length, ySorted.length);
  for (let i = 0; i < maxLen; i++) {
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
    link: p.url || "",
  });

  const painpoints = groups.map((group, i) => {
    const topTitle = group[0].title || "";
    const naverCount = group.filter((p) => p.source === "naver").length;
    const youtubeScore = group
      .filter((p) => p.source === "youtube")
      .reduce((a, p) => a + (p.score || 0), 0);

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
      empathy: naverCount * 10 + youtubeScore,
      comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
      sources: {
        naver: naverCount * 10,
        youtube: youtubeScore,
      },
      emotions: { 관심: 45, 공감: 35, 분노: 20 },
      samples: group.slice(0, 3).map(toSample),
    };
  });

  const totalCollected = naverPosts.length + youtubePosts.length;

  const ppData = {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Naver+YouTube" }],
    sources: [
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
        { src: "네이버", id: "naver", n: naverPosts.length, t: `블로그·카페·지식인: "${keyword}"`, d: 1.2 },
        { src: "유튜브", id: "youtube", n: youtubePosts.length, t: `유튜브 댓글: "${keyword}"`, d: 2.0 },
      ].filter((l) => l.n > 0),
      painpoints,
      ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

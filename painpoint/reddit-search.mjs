/**
 * Reddit 크롤러 — reddit.com/search.json (API 키 불필요)
 */

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; SSATIS/1.0)",
  "Accept": "application/json",
};

export function redditPostUrl(post) {
  if (!post) return "#";
  if (post.permalink) {
    const path = post.permalink.startsWith("/") ? post.permalink : `/${post.permalink}`;
    return `https://www.reddit.com${path}`;
  }
  return post.url || "#";
}

export async function searchReddit(keyword) {
  const base = String(keyword || "").trim();
  if (!base) return [];

  const q = encodeURIComponent(base);
  const url = `https://www.reddit.com/search.json?q=${q}&sort=relevance&t=year&limit=100`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Reddit HTTP ${res.status}`);
    const data = await res.json();
    const children = data?.data?.children || [];
    const posts = children.map(c => ({
      id: c.data.id,
      title: c.data.title,
      permalink: c.data.permalink,
      url: `https://www.reddit.com${c.data.permalink}`,
      score: c.data.score || 0,
      num_comments: c.data.num_comments || 0,
      selftext: (c.data.selftext || "").slice(0, 300),
    }));
    console.log(`[reddit] ${url} → ${posts.length}건`);
    return posts.sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn("[reddit-search]", e.message);
    return [];
  }
}

export function buildRedditPPData(keyword, posts) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const sorted = [...posts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const collectedPosts = sorted.map((p) => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    source: "reddit",
    url: redditPostUrl(p),
    score: p.score || 0,
  }));

  const toSample = (p) => ({ src: "reddit", title: p.title || "", up: p.score || 0, link: redditPostUrl(p) });
  const groups = [sorted.slice(0, 3), sorted.slice(3, 6), sorted.slice(6, 9)].filter(g => g.length);

  const painpoints = groups.map((group, i) => ({
    id: `pp${i + 1}`, rank: i + 1,
    title: (group[0].title || "").length > 60 ? group[0].title.slice(0, 60) + "…" : group[0].title || `페인포인트 ${i + 1}`,
    summary: group.map(p => p.selftext || p.title).join(" ").slice(0, 200) + "…",
    severity: i === 0 ? "high" : "mid",
    empathy: group.reduce((a, p) => a + (p.score || 0), 0),
    comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
    sources: { reddit: group.reduce((a, p) => a + (p.score || 0), 0) },
    emotions: { 관심: 45, 공감: 35, 분노: 20 },
    samples: group.map(toSample),
  }));

  return {
    ppData: {
      trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Reddit" }],
      sources: [{ id: "reddit", name: "레딧", desc: `Reddit 검색 "${keyword}"`, posts: posts.length, defaultOn: true, live: true, free: true }],
      result: {
        keyword, analyzedAt: now,
        totalCollected: posts.length,
        afterFilter: Math.max(1, Math.floor(posts.length * 0.85)),
        verdict: "분석 중", verdictTone: "violet",
        log: [{ src: "레딧", id: "reddit", n: posts.length, t: `Reddit 검색 "${keyword}"`, d: 0.3 }],
        painpoints, ideas: [],
      },
    },
    collectedPosts,
  };
}

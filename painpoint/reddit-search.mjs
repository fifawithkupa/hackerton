/**
 * Reddit 검색 → PP_DATA 형태 + Gemini 입력용 collectedPosts
 * (main 브랜치 server.js 로직을 ESM으로 분리)
 */

const REDDIT_UA =
  "web:ssatis-painpoint:1.0.0 (hackerton; contact: local-dev)";

async function fetchRedditListing(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": REDDIT_UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Reddit HTTP ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || []).map((c) => c.data).filter(Boolean);
}

/** 전역 검색 + 한글 키워드면 r/korea 등 보조 검색 */
/** Reddit 글 → 댓글/본문 페이지 URL (외부 링크 글도 토론 permalink 우선) */
export function redditPostUrl(post) {
  if (!post) return "#";
  if (post.permalink) {
    const path = post.permalink.startsWith("/") ? post.permalink : `/${post.permalink}`;
    return `https://www.reddit.com${path}`;
  }
  const url = String(post.url || "").trim();
  if (/reddit\.com/i.test(url)) return url;
  return url || "#";
}

export async function searchReddit(keyword) {
  const base = String(keyword || "").trim();
  if (!base) return [];

  const q = encodeURIComponent(base);
  const urls = [
    `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=100&type=link`,
  ];
  if (/[가-힣]/.test(base)) {
    const kq = encodeURIComponent(base);
    urls.push(
      `https://www.reddit.com/r/korea/search.json?q=${kq}&restrict_sr=1&sort=relevance&limit=50`,
    );
    urls.push(
      `https://www.reddit.com/r/Living_in_Korea/search.json?q=${kq}&restrict_sr=1&sort=relevance&limit=50`,
    );
  }

  const byId = new Map();
  for (const url of urls) {
    try {
      const batch = await fetchRedditListing(url);
      for (const p of batch) {
        if (!p?.id || p.removed_by_category || p.author === "[deleted]") continue;
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
    } catch (e) {
      console.warn("[reddit-search]", url, e.message);
    }
  }

  return [...byId.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function buildRedditPPData(keyword, posts) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sorted = [...posts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const collectedPosts = sorted.map((p) => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    source: "reddit",
    url: redditPostUrl(p),
    permalink: p.permalink || null,
    score: p.score || 0,
  }));

  const toSample = (p) => ({
    src: "reddit",
    title: p.title || "",
    up: p.score || 0,
    link: redditPostUrl(p),
  });

  const groups = [
    sorted.slice(0, 3),
    sorted.slice(3, 6),
    sorted.slice(6, 9),
  ].filter((g) => g.length);

  const painpoints = groups.map((group, i) => ({
    id: `pp${i + 1}`,
    rank: i + 1,
    title:
      (group[0].title || "").length > 60
        ? group[0].title.slice(0, 60) + "…"
        : group[0].title || `페인포인트 ${i + 1}`,
    summary:
      group
        .map((p) => p.selftext || p.title)
        .join(" ")
        .slice(0, 200) + "…",
    severity: i === 0 ? "high" : "mid",
    empathy: group.reduce((a, p) => a + (p.score || 0), 0),
    comments: group.reduce((a, p) => a + (p.num_comments || 0), 0),
    sources: { reddit: group.reduce((a, p) => a + (p.score || 0), 0) },
    emotions: { 관심: 45, 공감: 35, 분노: 20 },
    samples: group.map(toSample),
  }));

  const ppData = {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Reddit" }],
    sources: [
      {
        id: "reddit",
        name: "레딧",
        desc: `Reddit 검색 "${keyword}"`,
        posts: posts.length,
        defaultOn: true,
        free: true,
      },
    ],
    result: {
      keyword,
      analyzedAt: now,
      totalCollected: posts.length,
      afterFilter: Math.max(1, Math.floor(posts.length * 0.85)),
      verdict: "분석 중",
      verdictTone: "violet",
      log: [
        {
          src: "레딧",
          id: "reddit",
          n: posts.length,
          t: `Reddit 검색 "${keyword}"`,
          d: 0.3,
        },
      ],
      painpoints,
      ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

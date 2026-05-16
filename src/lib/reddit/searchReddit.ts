export type RedditPost = {
  title: string;
  selftext?: string;
  score: number;
  num_comments?: number;
  url: string;
};

export async function searchReddit(keyword: string): Promise<RedditPost[]> {
  const q = encodeURIComponent(keyword);
  const response = await fetch(
    `https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=25&type=link`,
    {
      headers: { "User-Agent": "ssatis_crawler/1.0" },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    throw new Error(`Reddit search failed (${response.status})`);
  }

  const data = (await response.json()) as {
    data?: { children?: { data: RedditPost }[] };
  };

  return (data.data?.children ?? []).map((child) => child.data);
}

export function buildPPData(keyword: string, posts: RedditPost[]) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sorted = [...posts].sort((a, b) => b.score - a.score);

  const toSample = (p: RedditPost) => ({
    src: "reddit",
    title: p.title,
    up: p.score,
    link: p.url,
  });

  const groups = [
    sorted.slice(0, 3),
    sorted.slice(3, 6),
    sorted.slice(6, 9),
  ].filter((group) => group.length);

  const painpoints = groups.map((group, i) => ({
    id: `pp${i + 1}`,
    rank: i + 1,
    title:
      group[0].title.length > 60
        ? `${group[0].title.slice(0, 60)}…`
        : group[0].title,
    summary: `${group.map((p) => p.selftext || p.title).join(" ").slice(0, 200)}…`,
    severity: i === 0 ? "high" : "mid",
    empathy: group.reduce((sum, p) => sum + p.score, 0),
    comments: group.reduce((sum, p) => sum + (p.num_comments || 0), 0),
    sources: { reddit: group.reduce((sum, p) => sum + p.score, 0) },
    emotions: { 관심: 45, 공감: 35, 논쟁: 20 },
    samples: group.map(toSample),
  }));

  return {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "Reddit" }],
    sources: [
      {
        id: "reddit",
        name: "레딧",
        desc: `Reddit 검색: "${keyword}"`,
        posts: posts.length,
        defaultOn: true,
        free: true,
      },
    ],
    result: {
      keyword,
      analyzedAt: now,
      totalCollected: posts.length,
      afterFilter: Math.floor(posts.length * 0.85),
      verdict: "분석 완료",
      verdictTone: "violet",
      log: [
        {
          src: "레딧",
          id: "reddit",
          n: posts.length,
          t: `Reddit 검색: "${keyword}"`,
          d: 0.5,
        },
      ],
      painpoints,
      ideas: [],
    },
  };
}

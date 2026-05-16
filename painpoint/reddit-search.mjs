/**
 * Reddit 크롤러 — old.reddit.com HTML 파싱 (API 키 불필요)
 */

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchRedditHTML(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Reddit HTTP ${res.status}`);
  return res.text();
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

function parseOldReddit(html) {
  const posts = [];

  // data-fullname="t3_XXX"> 로 블록 분리
  const blocks = html.split(/(?=data-fullname="t3_)/);

  for (const block of blocks) {
    // 글 ID
    const idM = block.match(/^data-fullname="t3_([^"]+)"/);
    if (!idM) continue;
    const id = idM[1];

    // permalink (comments URL)
    const permalinkM = block.match(/href="(https?:\/\/(?:old\.reddit\.com|www\.reddit\.com)\/r\/[^/]+\/comments\/[^"]+)"\s+class="(?:search-title|may-blank)/);
    if (!permalinkM) continue;
    const postUrl = permalinkM[1].replace("old.reddit.com", "www.reddit.com");
    const permalink = postUrl.replace(/^https?:\/\/www\.reddit\.com/, "");

    // 제목
    const titleM = block.match(/class="search-title may-blank"[^>]*>([^<]+)<\/a>/);
    if (!titleM) continue;
    const title = decodeHtml(titleM[1]);
    if (!title || title.length < 3) continue;

    // 점수 "640 points"
    const scoreM = block.match(/class="search-score">([^<]+)<\/span>/);
    const scoreText = scoreM?.[1]?.replace(/,/g, "") || "0";
    const score = parseInt(scoreText, 10) || 0;

    // 댓글 수 "1,274 comments"
    const commentsM = block.match(/([\d,]+)\s+comments?/);
    const num_comments = parseInt(commentsM?.[1]?.replace(/,/g, "") || "0", 10);

    posts.push({ id, title, permalink, url: postUrl, score, num_comments, selftext: "" });
  }

  return posts;
}

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
    `https://old.reddit.com/search?q=${q}&sort=relevance&t=year&limit=100`,
  ];

  if (/[가-힣]/.test(base)) {
    urls.push(`https://old.reddit.com/r/korea/search?q=${q}&restrict_sr=on&sort=relevance&t=year`);
  }

  const byId = new Map();
  for (const url of urls) {
    try {
      const html = await fetchRedditHTML(url);
      const posts = parseOldReddit(html);
      console.log(`[reddit] ${url} → ${posts.length}건`);
      for (const p of posts) {
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

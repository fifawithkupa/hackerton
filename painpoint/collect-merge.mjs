/**
 * Reddit + YouTube 수집 결과 → PP_DATA + collectedPosts
 */
import { redditPostUrl } from "./reddit-search.mjs";
import { youtubeWatchUrl } from "./youtube-search.mjs";

function toCollectedFromReddit(posts) {
  return posts.map((p) => ({
    text: [p.title, p.selftext].filter(Boolean).join(" — ").slice(0, 500),
    source: "reddit",
    url: redditPostUrl(p),
    score: p.score || 0,
  }));
}

function toCollectedFromYoutube(comments) {
  return comments.map((c) => ({
    text: `${c.videoTitle} — ${c.text}`.slice(0, 500),
    source: "youtube",
    url: youtubeWatchUrl(c.videoId),
    score: c.likeCount || 0,
  }));
}

function unifiedItems(redditPosts, youtubeComments) {
  const reddit = redditPosts.map((p) => ({
    src: "reddit",
    title: (p.title || "").slice(0, 120),
    score: p.score || 0,
    link: redditPostUrl(p),
  }));
  const youtube = youtubeComments.map((c) => ({
    src: "youtube",
    title: c.text.slice(0, 120),
    score: c.likeCount || 0,
    link: youtubeWatchUrl(c.videoId),
  }));
  return [...reddit, ...youtube].sort((a, b) => b.score - a.score);
}

export function mergeCollectPPData(keyword, redditPosts, youtubeComments) {
  const now = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const redditN = redditPosts.length;
  const ytN = youtubeComments.length;
  const total = redditN + ytN;
  const collectedPosts = [
    ...toCollectedFromReddit(redditPosts),
    ...toCollectedFromYoutube(youtubeComments),
  ];

  const items = unifiedItems(redditPosts, youtubeComments);
  const groups = [
    items.slice(0, 3),
    items.slice(3, 6),
    items.slice(6, 9),
  ].filter((g) => g.length);

  const painpoints = groups.map((group, i) => ({
    id: `pp${i + 1}`,
    rank: i + 1,
    title:
      group[0].title.length > 60 ? group[0].title.slice(0, 60) + "…" : group[0].title,
    summary: group.map((x) => x.title).join(" ").slice(0, 200) + "…",
    severity: i === 0 ? "high" : "mid",
    empathy: group.reduce((a, x) => a + x.score, 0),
    comments: Math.round(group.reduce((a, x) => a + x.score, 0) * 2.2),
    sources: group.reduce((acc, x) => {
      acc[x.src] = (acc[x.src] || 0) + x.score;
      return acc;
    }, {}),
    emotions: { 관심: 45, 공감: 35, 분노: 20 },
    samples: group.map((x) => ({
      src: x.src,
      title: x.title,
      up: x.score,
      link: x.link,
    })),
  }));

  const log = [];
  if (redditN > 0) {
    log.push({
      src: "레딧",
      id: "reddit",
      n: redditN,
      t: `Reddit 검색 "${keyword}"`,
      d: 0.3,
    });
  }
  if (ytN > 0) {
    log.push({
      src: "유튜브",
      id: "youtube",
      n: ytN,
      t: `YouTube 댓글 "${keyword}"`,
      d: 0.5,
    });
  }

  const sources = [];
  if (redditN > 0) {
    sources.push({
      id: "reddit",
      name: "레딧",
      desc: `Reddit 검색 "${keyword}"`,
      posts: redditN,
      defaultOn: true,
      live: true,
      free: true,
    });
  }
  if (ytN > 0) {
    sources.push({
      id: "youtube",
      name: "유튜브 댓글",
      desc: `YouTube "${keyword}" 영상 댓글`,
      posts: ytN,
      defaultOn: true,
      live: true,
      free: false,
    });
  }

  const ppData = {
    trendingKeywords: [{ kw: keyword, delta: "실시간", category: "멀티소스" }],
    sources,
    result: {
      keyword,
      analyzedAt: now,
      totalCollected: total,
      afterFilter: Math.max(1, Math.floor(total * 0.85)),
      verdict: "분석 중",
      verdictTone: "violet",
      log,
      painpoints,
      ideas: [],
    },
  };

  return { ppData, collectedPosts };
}

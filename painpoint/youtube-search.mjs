/**
 * YouTube Data API v3 — 영상 검색 + 댓글 수집
 * YOUTUBE_API_KEY 환경변수 또는 config.js youtubeApiKey
 */

import { loadYoutubeKey } from "./server-config.mjs";

function getKey() {
  return loadYoutubeKey() || "";
}

async function fetchYouTubeJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
  return res.json();
}

/** 키워드로 영상 검색 → videoId 목록 */
async function searchVideos(keyword, maxResults = 5) {
  const key = getKey();
  if (!key) throw new Error("YOUTUBE_API_KEY 없음");

  const q = encodeURIComponent(keyword);
  const data = await fetchYouTubeJSON(
    `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${q}&type=video&maxResults=${maxResults}` +
      `&order=relevance&relevanceLanguage=ko&key=${encodeURIComponent(key)}`,
  );

  return (data.items || []).map((item) => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title || "",
    channelTitle: item.snippet?.channelTitle || "",
  })).filter((v) => v.videoId);
}

/** 영상 한 편의 최상위 댓글 수집 */
async function fetchComments(videoId, maxResults = 50) {
  const key = getKey();
  const data = await fetchYouTubeJSON(
    `https://www.googleapis.com/youtube/v3/commentThreads` +
      `?part=snippet&videoId=${encodeURIComponent(videoId)}` +
      `&maxResults=${maxResults}&order=relevance&key=${encodeURIComponent(key)}`,
  );

  return (data.items || []).map((item) => {
    const c = item.snippet?.topLevelComment?.snippet || {};
    return {
      text: (c.textDisplay || c.textOriginal || "").replace(/<[^>]+>/g, "").trim(),
      likes: c.likeCount || 0,
      videoId,
    };
  }).filter((c) => c.text.length > 10);
}

/** 키워드 → 수집 posts (reddit-search.mjs 형식과 동일) */
export async function searchYoutube(keyword) {
  if (!getKey()) {
    console.warn("[youtube] YOUTUBE_API_KEY 없음 — 스킵");
    return [];
  }

  const videos = await searchVideos(keyword, 5);
  if (!videos.length) return [];

  const commentResults = await Promise.allSettled(
    videos.map((v) => fetchComments(v.videoId, 50)),
  );

  const posts = [];
  for (let i = 0; i < videos.length; i++) {
    const r = commentResults[i];
    if (r.status !== "fulfilled") {
      console.warn(`[youtube] 댓글 수집 실패 (${videos[i].videoId}):`, r.reason?.message);
      continue;
    }
    for (const c of r.value) {
      posts.push({
        title: c.text.slice(0, 200),
        selftext: "",
        url: `https://www.youtube.com/watch?v=${c.videoId}`,
        score: c.likes,
        num_comments: 0,
        source: "youtube",
      });
    }
  }

  // 좋아요 순 정렬
  return posts.sort((a, b) => b.score - a.score);
}

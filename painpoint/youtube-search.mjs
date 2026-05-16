/**
 * YouTube Data API v3 — 키워드 관련 영상 검색 후 댓글 수집
 */

const YT_BASE = "https://www.googleapis.com/youtube/v3";

async function ytFetch(apiKey, endpoint, params) {
  const url = new URL(`${YT_BASE}${endpoint}`);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function youtubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * @returns {Promise<Array<{ videoId, videoTitle, text, likeCount, author }>>}
 */
export async function searchYoutubeComments(keyword, apiKey) {
  const key = String(apiKey || "").trim();
  if (!key) return [];

  const q = String(keyword || "").trim();
  if (!q) return [];

  const search = await ytFetch(key, "/search", {
    part: "snippet",
    q,
    type: "video",
    maxResults: 6,
    relevanceLanguage: "ko",
    safeSearch: "none",
  });

  const videos = (search.items || []).filter((it) => it.id?.videoId);
  const all = [];

  for (const v of videos.slice(0, 5)) {
    const videoId = v.id.videoId;
    const videoTitle = v.snippet?.title || "";
    try {
      const threads = await ytFetch(key, "/commentThreads", {
        part: "snippet",
        videoId,
        maxResults: 20,
        order: "relevance",
        textFormat: "plainText",
      });
      for (const t of threads.items || []) {
        const s = t.snippet?.topLevelComment?.snippet;
        const text = String(s?.textDisplay || "").trim();
        if (!text || text.length < 4) continue;
        all.push({
          videoId,
          videoTitle,
          text,
          likeCount: Number(s.likeCount) || 0,
          author: s.authorDisplayName || "",
        });
      }
    } catch (e) {
      console.warn("[youtube-search] comments disabled or error:", videoId, e.message);
    }
  }

  return all.sort((a, b) => b.likeCount - a.likeCount).slice(0, 80);
}

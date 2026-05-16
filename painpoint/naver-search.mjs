/**
 * 네이버 크롤러 — 블로그·카페·지식인 검색 결과 수집 (ESM)
 * 공식 API 없이 HTML 파싱으로 동작
 */

const NAVER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function cleanText(html) {
  return html
    .replace(/<mark[^>]*>/gi, "")
    .replace(/<\/mark>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchNaverHTML(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": NAVER_UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
      "Accept-Encoding": "identity",
    },
  });
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}`);
  return res.text();
}

function parseNaverResults(html, urlFilter) {
  const results = [];
  const seen = new Set();

  // 블로그·지식인: data-heatmap-target=".title" 패턴
  const re =
    /<a[^>]*href="([^"]+)"[^>]*data-heatmap-target="\.title"[^>]*>([\s\S]{0,600}?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const link = m[1].replace(/&amp;/g, "&");
    const title = cleanText(m[2]);
    if (!title || seen.has(link)) continue;
    if (urlFilter && !urlFilter(link)) continue;
    seen.add(link);
    results.push({
      title,
      url: link,
      score: 0,
      num_comments: 0,
      source: "naver",
    });
  }

  // 카페: href 패턴으로 직접 추출
  const cafeRe =
    /<a[^>]*href="(https?:\/\/cafe\.naver\.com\/[A-Za-z0-9_.-]+\/[0-9]+)[^"]*"[^>]*>([\s\S]{0,600}?)<\/a>/g;
  while ((m = cafeRe.exec(html)) !== null) {
    const link = m[1];
    const title = cleanText(m[2]);
    if (!title || seen.has(link) || title.length < 5) continue;
    seen.add(link);
    results.push({
      title,
      url: link,
      score: 0,
      num_comments: 0,
      source: "naver",
    });
  }

  return results;
}

async function searchNaverBlog(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchNaverHTML(
    `https://search.naver.com/search.naver?where=blog&query=${q}&display=10&sort=0`,
  );
  return parseNaverResults(html, (link) => link.includes("blog.naver.com"));
}

async function searchNaverCafe(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchNaverHTML(
    `https://search.naver.com/search.naver?where=cafeblog&query=${q}&display=10&sort=0`,
  );
  return parseNaverResults(html, (link) => link.includes("cafe.naver.com"));
}

async function searchNaverKin(keyword) {
  const q = encodeURIComponent(keyword);
  const html = await fetchNaverHTML(
    `https://search.naver.com/search.naver?where=kin&query=${q}&display=10`,
  );
  return parseNaverResults(
    html,
    (link) =>
      link.includes("kin.naver.com") || link.includes("/detail/"),
  );
}

export async function searchNaver(keyword) {
  const [blog, cafe, kin] = await Promise.allSettled([
    searchNaverBlog(keyword),
    searchNaverCafe(keyword),
    searchNaverKin(keyword),
  ]);
  return [
    ...(blog.status === "fulfilled" ? blog.value : []),
    ...(cafe.status === "fulfilled" ? cafe.value : []),
    ...(kin.status === "fulfilled" ? kin.value : []),
  ];
}

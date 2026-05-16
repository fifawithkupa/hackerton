/**
 * 네이버 데이터랩 검색어 트렌드 API
 * NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수 필요
 * 없으면 null 반환 (graceful skip)
 */

export async function fetchNaverDatalab(keyword) {
  const clientId     = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const endDate   = new Date();
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().slice(0, 10);

  const body = {
    startDate:    fmt(startDate),
    endDate:      fmt(endDate),
    timeUnit:     "month",
    keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
  };

  const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: {
      "X-Naver-Client-Id":     clientId,
      "X-Naver-Client-Secret": clientSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Naver Datalab HTTP ${res.status}`);
  const data = await res.json();

  const results = data?.results?.[0]?.data || [];
  if (!results.length) return null;

  const values = results.map(d => ({ period: d.period, ratio: d.ratio }));
  const first  = values.slice(0, 3).reduce((s, v) => s + v.ratio, 0) / 3;
  const last   = values.slice(-3).reduce((s, v) => s + v.ratio, 0)   / 3;
  const growth_rate = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  const peak   = values.reduce((a, b) => a.ratio >= b.ratio ? a : b);

  return { values, growth_rate, peak_period: peak.period || "" };
}

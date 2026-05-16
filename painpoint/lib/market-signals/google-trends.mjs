import googleTrends from "google-trends-api";

/**
 * 최근 12개월 Google Trends 관심도 데이터를 반환
 * @returns {{ values, growth_rate, peak_period } | null}
 */
export async function fetchGoogleTrends(keyword) {
  const startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const raw = await googleTrends.interestOverTime({ keyword, startTime });
  const parsed = JSON.parse(raw);
  const timeline = parsed?.default?.timelineData || [];
  if (!timeline.length) return null;

  const values = timeline.map(d => ({
    date: d.formattedTime,
    value: d.value?.[0] ?? 0,
  }));

  const first = values.slice(0, 4).reduce((s, v) => s + v.value, 0) / 4;
  const last  = values.slice(-4).reduce((s, v) => s + v.value, 0)  / 4;
  const growth_rate = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

  const peak = values.reduce((a, b) => a.value >= b.value ? a : b);
  const peak_period = peak.date || "";

  return { values, growth_rate, peak_period };
}

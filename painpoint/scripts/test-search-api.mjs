const health = await fetch("http://localhost:8787/api/ssatis-health").then((r) => r.json());
console.log("health:", health);

const t0 = Date.now();
const res = await fetch("http://localhost:8787/api/search?q=HR");
const j = await res.json();
console.log("status", res.status, "ms", Date.now() - t0);
if (j.error) {
  console.log("error:", j.error);
  process.exit(1);
}
console.log("keys", Object.keys(j).slice(0, 20));
const r = j.result || {};
const log = r.log || [];
console.log("totalCollected", r.totalCollected, "log entries", log.length);
console.log("log:", log.map((l) => `${l.id}:${l.n}`).join(", "));
const posts = j.collectedPosts || [];
const bySrc = posts.reduce((a, p) => {
  a[p.source] = (a[p.source] || 0) + 1;
  return a;
}, {});
console.log("collectedPosts by source", bySrc);
const yt = (r.painpoints || [])
  .flatMap((p) => p.samples || [])
  .filter((s) => s.src === "youtube");
console.log("youtube samples in painpoints", yt.length);
if (yt[0]) console.log("sample link", yt[0].link);

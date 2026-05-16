import { normalizeAnalysisResult } from "../ssatis-ai-core.mjs";

const posts = [
  { source: "reddit", text: "A — x", score: 100, url: "https://reddit.com/a" },
  { source: "reddit", text: "B — y", score: 80, url: "https://reddit.com/b" },
  { source: "youtube", text: "Vid — comment", score: 50, url: "https://youtube.com/watch?v=abc" },
];
const raw = {
  painpoints: [
    { title: "P1", summary: "s1" },
    { title: "P2", summary: "s2" },
    { title: "P3", summary: "s3" },
  ],
  ideas: [{ title: "I1" }, { title: "I2" }, { title: "I3" }],
  verdict: "틈새 존재",
};
const meta = {
  source: "multi",
  totalCollected: 110,
  afterFilter: 93,
  log: [
    { id: "reddit", n: 100 },
    { id: "youtube", n: 10 },
  ],
};
const r = normalizeAnalysisResult(raw, "HR", posts, meta);
const p0 = r.painpoints[0];
console.log("sources", p0.sources);
const ytPct = (
  ((p0.sources.youtube || 0) /
    Object.values(p0.sources).reduce((a, b) => a + b, 0)) *
  100
).toFixed(0);
console.log("youtube %", ytPct);
console.log("samples src", r.painpoints[0].samples.map((s) => s.src));

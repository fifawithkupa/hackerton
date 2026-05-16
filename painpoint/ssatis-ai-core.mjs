/**
 * Node 전용 — Google Gemini generateContent 요청 본문 + 응답 정규화
 */
import { redditPostUrl } from "./reddit-search.mjs";

/** 환경변수 GEMINI_MODEL 또는 config.js geminiModel 로 재정의 가능 */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** 데모용 수집 로그 (data.js result.log 와 동일) */
export const DEFAULT_ANALYSIS_LOG = [
  { src: "레딧", id: "reddit", n: 412, t: "r/recruitinghell · r/cscareerquestions", d: 0.3 },
  { src: "네이버", id: "naver", n: 358, t: "이직·취준생 카페·블로그 12개", d: 0.9 },
  { src: "해커뉴스", id: "hackernews", n: 249, t: "Ask HN · Show HN 댓글 분석", d: 1.5 },
  { src: "앱스토어", id: "appstore", n: 154, t: "관련 앱 별 1~3점 리뷰 톱 500", d: 2.1 },
  { src: "트러스트파일럿", id: "trustpilot", n: 138, t: "HR 서비스 분류 리뷰", d: 2.7 },
  { src: "구글플레이스토어", id: "playstore", n: 127, t: "관련 앱 별 1~3점 리뷰 톱 500", d: 3.2 },
  { src: "유튜브 댓글", id: "youtube", n: 112, t: "관련 영상 댓글 톱 50", d: 3.7 },
];

export function buildPostDigest(posts) {
  return posts
    .slice(0, 45)
    .map((p, i) => {
      const text =
        p.text ||
        [p.title, p.selftext].filter(Boolean).join(" — ") ||
        "(내용 없음)";
      return `[${i + 1}] (${p.source || "mixed"}) ${text}`;
    })
    .join("\n");
}

/**
 * Gemini REST: POST .../models/{model}:generateContent
 * JSON 출력: generationConfig.responseMimeType === "application/json"
 */
const VERDICT_CRITERIA = `
시장 판정 기준 (각 ideas[].verdict 및 최상위 verdict에 적용):
- "블루오션": 동일 문제를 직접 해결하는 국내·해외 서비스가 거의 없거나, 우리 아이디어가 새 카테고리를 연다.
- "틈새 존재": 유명 경쟁자는 있으나, 한국 시장·타깃·기능·가격대 중 하나에서 명확한 빈틈이 있다.
- "레드오션": 유사 솔루션 3개 이상이 이미 포화이고, 차별화 없이는 진입이 어렵다.
verdictTone 매핑: 블루오션→positive, 틈새 존재→violet, 레드오션→warn.
최상위 verdict는 1순위 아이디어의 판정과 일치하거나, 키워드 전체 시장을 한 줄로 요약한 판정이어야 한다.`;

const COMPETITOR_CRITERIA = `
경쟁자 조사 (외부 검색 API 없이, 알려진 실제 서비스·스타트업 이름으로 작성):
- 각 아이디어마다 competitors 정확히 3개: 국내 1~2개 + 해외 0~1개 혼합 권장.
- name: 실제 서비스/회사명. url: 도메인만(예: greenhouse.io). price·target: 현실적 추정.
- weakness: 우리 아이디어 대비 구체적 약점·빈틈(한국어 1문장).
- moats: 우리만의 차별점 2~3개(수집된 불만·한국 시장 특화 근거 포함).`;

export function buildGeminiGenerateBody(keyword, posts) {
  const system = [
    "당신은 스타트업 PM, 시장 분석가, 경쟁 전략 컨설턴트입니다.",
    "입력은 커뮤니티·리뷰에서 모은 불만/고민 글입니다.",
    "유사 주제를 묶어 페인포인트를 정확히 3개 이상 5개 이하로 압축합니다.",
    "각 페인포인트마다 실행 가능한 창업 아이디어 하나를 대응시킵니다.",
    "각 아이디어에 대해 경쟁자 조사와 블루오션/틈새/레드오션 판정을 함께 수행합니다.",
    "반드시 유효한 JSON 단일 객체만 출력합니다. 마크다운·코드펜스 금지.",
    VERDICT_CRITERIA,
    COMPETITOR_CRITERIA,
  ].join(" ");

  const schemaHint = [
    "{",
    '  "totalCollected": number,',
    '  "afterFilter": number,',
    '  "verdict": "틈새 존재" | "블루오션" | "레드오션",',
    '  "verdictTone": "violet" | "positive" | "warn",',
    '  "painpoints": [',
    "    {",
    '      "title": string,',
    '      "summary": string,',
    '      "severity": "high" | "mid" | "low",',
    '      "sampleTitles": string[]',
    "    }",
    "  ],",
    '  "ideas": [',
    "    {",
    '      "title": string,',
    '      "oneliner": string,',
    '      "target": string,',
    '      "revenue": string,',
    '      "mvp": string[],',
    '      "market": string,',
    '      "verdict": "틈새 존재" | "블루오션" | "레드오션",',
    '      "verdictTone": "violet" | "positive" | "warn",',
    '      "competitors": [{ "name","url","price","target","weakness" }],',
    '      "moats": string[]',
    "    }",
    "  ]",
    "}",
  ].join("\n");

  const user = [
    `키워드/산업: "${keyword}"`,
    "",
    "아래 글들만 근거로 추론하세요. 숫자는 현실적인 범위로 추정해도 됩니다.",
    "",
    buildPostDigest(posts),
    "",
    "출력 JSON 스키마:",
    schemaHint,
    "",
    "규칙:",
    "- painpoints 배열 길이는 3~5.",
    "- ideas 배열 길이는 painpoints와 동일하고, 같은 순서의 페인포인트에 대응.",
    "- 각 idea.mvp는 반드시 길이 3.",
    "- 각 idea.competitors는 반드시 길이 3 (실제 서비스명).",
    "- 각 idea.verdict·verdictTone은 위 판정 기준을 따른다.",
    "- moats는 각 아이디어당 2~3개.",
    "- 모든 문자열은 한국어로.",
  ].join("\n");

  return {
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        parts: [{ text: user }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  };
}

/** Gemini 응답에서 텍스트(JSON 문자열) 추출 */
export function extractGeminiJsonText(data) {
  if (data.error) {
    throw new Error(JSON.stringify(data.error));
  }
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    const br = data.promptFeedback?.blockReason;
    const msg = br ? `Gemini 응답 차단: ${br}` : JSON.stringify(data);
    throw new Error(msg);
  }
  return parts.map((p) => p.text || "").join("");
}

/** 모델이 가끔 ```json ... ``` 로 감싸는 경우 제거 */
export function unwrapJsonFence(text) {
  let t = String(text || "").trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return t.trim();
}

function splitInt(total, parts) {
  const n = Math.max(1, parts);
  const base = Math.floor(total / n);
  let rem = total - base * n;
  return Array.from({ length: n }, () => {
    const x = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem--;
    return x;
  });
}

function normalizeCompetitors(raw) {
  const rows = Array.isArray(raw) ? raw.slice(0, 5) : [];
  const fallback = [
    { name: "(조사 필요)", url: "—", price: "—", target: "—", weakness: "모델 응답에 경쟁자 정보가 부족합니다." },
  ];
  const filled = rows.length >= 3 ? rows : [...rows, ...fallback].slice(0, 3);
  return filled.slice(0, 5).map((c) => ({
    name: String(c.name || "알 수 없음"),
    url: String(c.url || "—").replace(/^https?:\/\//, ""),
    price: String(c.price || "—"),
    target: String(c.target || "—"),
    weakness: String(c.weakness || "—"),
  }));
}

function normalizeMvp(mvp) {
  const arr = Array.isArray(mvp) ? mvp.map((x) => String(x)) : [];
  const pad = "핵심 사용자 인터뷰 5건으로 가설 검증";
  while (arr.length < 3) arr.push(pad);
  return arr.slice(0, 5);
}

const VERDICT_VALUES = new Set(["블루오션", "틈새 존재", "레드오션"]);

function normalizeVerdictLabel(v) {
  const s = String(v || "").trim();
  if (VERDICT_VALUES.has(s)) return s;
  if (/블루|blue\s*ocean/i.test(s)) return "블루오션";
  if (/레드|red\s*ocean/i.test(s)) return "레드오션";
  if (/틈새|niche|틈/i.test(s)) return "틈새 존재";
  return "틈새 존재";
}

function toneForVerdict(verdict) {
  if (verdict === "블루오션") return "positive";
  if (verdict === "레드오션") return "warn";
  return "violet";
}

/**
 * @param {object|null} collectMeta — Reddit 실수집 메타 { source:'reddit', totalCollected, log }
 */
export function normalizeAnalysisResult(raw, keyword, posts, collectMeta = null) {
  const redditOnly = collectMeta?.source === "reddit";
  const logLines =
    Array.isArray(collectMeta?.log) && collectMeta.log.length > 0
      ? collectMeta.log
      : DEFAULT_ANALYSIS_LOG;
  const painRaw = Array.isArray(raw.painpoints) ? raw.painpoints.slice(0, 5) : [];
  if (painRaw.length < 3) throw new Error("모델 응답: 페인포인트가 3개 미만입니다.");

  const ideasRaw = Array.isArray(raw.ideas) ? raw.ideas.slice(0, painRaw.length) : [];
  while (ideasRaw.length < painRaw.length) {
    ideasRaw.push({});
  }

  const analyzedAt = new Date().toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const srcKeys = ["reddit", "naver", "youtube"];
  const sampleSrc = redditOnly ? ["reddit", "reddit", "reddit"] : ["reddit", "naver", "youtube"];

  // 소스별 posts 그룹핑 (샘플 뽑기용)
  const postsBySource = {};
  for (const p of posts) {
    const src = p.source || "reddit";
    if (!postsBySource[src]) postsBySource[src] = [];
    postsBySource[src].push(p);
  }

  const painpoints = painRaw.map((p, idx) => {
    const id = `pp${idx + 1}`;
    const rank = idx + 1;
    const empathy = Math.max(120, 980 - idx * 140);
    const comments = Math.round(empathy * (2.2 + idx * 0.15));
    const sev = ["high", "mid", "mid", "low", "low"][idx] || "mid";
    const sources = redditOnly
      ? { reddit: empathy }
      : Object.fromEntries(
          srcKeys.map((k, i) => [k, splitInt(empathy, srcKeys.length)[i]]),
        );

    const titles = Array.isArray(p.sampleTitles) ? p.sampleTitles.map(String) : [];
    // 소스별로 그룹핑해서 painpoint마다 각 소스에서 하나씩 뽑기
    const samples = srcKeys.map((src, i) => {
      const srcPosts = postsBySource[src] || [];
      const fromPost = srcPosts[idx] ?? srcPosts[0];
      const rawText = fromPost?.text || fromPost?.title || "";
      const titleFromPost = rawText
        ? String(rawText).split(" — ")[0].slice(0, 120)
        : "";
      let link = "#";
      if (fromPost?.url && fromPost.url !== "#" && /^https?:\/\//i.test(fromPost.url)) {
        link = fromPost.url;
      } else if (fromPost && src === "reddit") {
        link = redditPostUrl(fromPost) || "#";
      }
      return {
        src,
        title: titleFromPost || titles[i] || `${keyword} 관련 불만 사례 ${i + 1}`,
        up: fromPost?.score ?? (520 - i * 90),
        link,
      };
    });

    return {
      id,
      rank,
      title: String(p.title || `페인포인트 ${rank}`),
      summary: String(p.summary || ""),
      severity: ["high", "mid", "low"].includes(p.severity) ? p.severity : sev,
      empathy,
      comments,
      sources,
      emotions: { 분노: 32 - idx * 4, 좌절: 28, 무력감: 18, 불안: 12 },
      samples,
    };
  });

  const verdictToneSet = new Set(["violet", "positive", "warn"]);

  const ideas = ideasRaw.map((idea, idx) => {
    const linkedPainpoint = `pp${idx + 1}`;
    const verdict = normalizeVerdictLabel(idea.verdict || raw.verdict);
    const vt = verdictToneSet.has(idea.verdictTone) ? idea.verdictTone : toneForVerdict(verdict);
    return {
      id: `i${idx + 1}`,
      rank: idx + 1,
      title: String(idea.title || `아이디어 ${idx + 1}`),
      oneliner: String(idea.oneliner || ""),
      linkedPainpoint,
      target: String(idea.target || "초기 타깃 미정"),
      revenue: String(idea.revenue || "수익 모델 검토 필요"),
      mvp: normalizeMvp(idea.mvp),
      market: String(idea.market || "시장 규모: 추가 리서치 필요"),
      verdict,
      verdictTone: vt,
      competitors: normalizeCompetitors(idea.competitors),
      moats:
        Array.isArray(idea.moats) && idea.moats.length
          ? idea.moats.map(String).slice(0, 5)
          : [`${keyword} 도메인 특화 데이터`, "초기 사용자 커뮤니티와 피드백 루프"],
    };
  });

  const totalCollected =
    typeof collectMeta?.totalCollected === "number"
      ? collectMeta.totalCollected
      : Number(raw.totalCollected) || posts.length;
  const afterFilter =
    typeof collectMeta?.afterFilter === "number"
      ? collectMeta.afterFilter
      : Number(raw.afterFilter) ||
        Math.max(1, Math.min(totalCollected, Math.round(totalCollected * 0.85)));

  const topVerdict = normalizeVerdictLabel(raw.verdict || ideas[0]?.verdict);
  const topTone = verdictToneSet.has(raw.verdictTone) ? raw.verdictTone : toneForVerdict(topVerdict);

  return {
    keyword: String(keyword || "").trim() || "키워드",
    analyzedAt,
    totalCollected,
    afterFilter,
    verdict: topVerdict,
    verdictTone: topTone,
    log: Array.isArray(logLines) ? logLines : DEFAULT_ANALYSIS_LOG,
    painpoints,
    ideas,
  };
}

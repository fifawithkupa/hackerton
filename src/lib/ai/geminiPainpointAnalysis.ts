import type { IdeaCard, PainCluster, PainPost } from "../db/saveAnalysisResult";

export type { PainPost, PainCluster, IdeaCard };

export type GeminiPainpointAnalysisInput = {
  keyword: string;
  posts: PainPost[];
};

export type GeminiPainpointAnalysisResult = {
  keyword: string;
  analyzedPostCount: number;
  painClusters: PainCluster[];
  ideaCards: IdeaCard[];
  executiveSummary: string;
};

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
const MAX_POSTS = 60;
const MAX_TEXT_CHARS = 700;

type GeminiGenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing environment variable: GEMINI_API_KEY. Set it in .env.local for server-side Gemini analysis.",
    );
  }
  return key;
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function engagementScore(post: PainPost): number {
  const likes = post.likes ?? 0;
  const comments = post.comments ?? 0;
  const raw = post.rawScore ?? 0;
  const stars = post.stars ?? 0;
  return raw > 0 ? raw : likes * 2 + comments * 3 + stars * 10;
}

function preparePosts(posts: PainPost[]): PainPost[] {
  return [...posts]
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, MAX_POSTS)
    .map((post) => ({
      ...post,
      text:
        post.text.length > MAX_TEXT_CHARS
          ? `${post.text.slice(0, MAX_TEXT_CHARS)}…`
          : post.text,
    }));
}

function buildPostCatalog(posts: PainPost[]): string {
  return posts
    .map((post, index) => {
      const score = engagementScore(post);
      return [
        `[POST ${index + 1}] id=${post.id}`,
        `source=${post.source}`,
        `title=${post.title}`,
        `url=${post.url ?? ""}`,
        `author=${post.author ?? ""}`,
        `engagementScore=${score}`,
        `likes=${post.likes ?? 0}`,
        `comments=${post.comments ?? 0}`,
        `text=${post.text}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildAnalysisPrompt(keyword: string, posts: PainPost[]): string {
  const schema = `{
  "executiveSummary": "string (3-5 sentences, Korean)",
  "painClusters": [
    {
      "id": "cluster-1",
      "title": "string",
      "summary": "string",
      "severity": "상" | "중" | "하",
      "evidenceCount": number,
      "totalEngagementScore": number,
      "representativeQuotes": [{ "text": "string", "source": "string", "url": "string" }],
      "relatedPostIds": ["post-id-from-input"]
    }
  ],
  "ideaCards": [
    {
      "id": "idea-1",
      "title": "string",
      "oneLiner": "string",
      "linkedPainClusterIds": ["cluster-1"],
      "targetCustomer": "string",
      "problem": "string",
      "solution": "string",
      "revenueModel": "string",
      "mvpScope": ["string", "string", "string"],
      "differentiation": ["string", "string"],
      "whyNow": "string",
      "evidenceQuotes": [{ "text": "string", "source": "string", "url": "string" }],
      "feasibilityScore": number (0-100),
      "marketPotentialScore": number (0-100)
    }
  ]
}`;

  return [
    "You are a startup PM and market analyst for SSATIS.",
    `Analyze complaint posts for the keyword: "${keyword}".`,
    "",
    "Rules:",
    "- Use ONLY the provided posts. Do not invent pain points or quotes.",
    "- Weight high-engagement posts more heavily (engagementScore).",
    "- Repeated complaints across multiple posts should form stronger clusters.",
    "- Cluster posts into 3–5 painClusters.",
    "- Generate 3–5 ideaCards (one per cluster when possible).",
    "- Each idea must include targetCustomer, revenueModel, mvpScope (3+ items), differentiation (2+ items), whyNow, and evidenceQuotes grounded in the posts.",
    "- evidenceQuotes and representativeQuotes must cite real post text and match post source/url when available.",
    "- relatedPostIds must use exact id values from the input posts.",
    "- Output in Korean.",
    "- Return valid JSON only. No markdown.",
    "",
    "Output JSON schema:",
    schema,
    "",
    "Posts:",
    buildPostCatalog(posts),
  ].join("\n");
}

function unwrapJsonFence(text: string): string {
  let trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return trimmed.trim();
}

function extractGeminiText(data: GeminiGenerateResponse): string {
  if (data.error?.message) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    const block = data.promptFeedback?.blockReason;
    throw new Error(
      block
        ? `Gemini blocked the response: ${block}`
        : "Gemini returned no candidates in the response.",
    );
  }
  return parts.map((part) => part.text ?? "").join("");
}

function parseModelJson(text: string): Record<string, unknown> {
  const cleaned = unwrapJsonFence(text);

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // fall through
      }
    }
    throw new Error(
      `Failed to parse Gemini JSON output. Preview: ${cleaned.slice(0, 400)}`,
    );
  }
}

function asSeverity(value: unknown): "상" | "중" | "하" {
  const s = String(value ?? "").trim();
  if (s === "상" || s === "중" || s === "하") return s;
  if (/high|높/i.test(s)) return "상";
  if (/low|낮/i.test(s)) return "하";
  return "중";
}

function normalizeQuotes(
  raw: unknown,
  postsById: Map<string, PainPost>,
): { text: string; source: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).map((item) => {
    const row = item as Record<string, unknown>;
    const text = String(row.text ?? "").trim();
    const source = String(row.source ?? "").trim();
    const url = String(row.url ?? "").trim();
    if (text) return { text, source: source || "unknown", url: url || "#" };

    const postId = String(row.postId ?? row.id ?? "");
    const post = postsById.get(postId);
    if (post) {
      return {
        text: post.text.slice(0, 280),
        source: post.source,
        url: post.url ?? "#",
      };
    }
    return { text: "", source: "unknown", url: "#" };
  }).filter((q) => q.text.length > 0);
}

function clampScore(value: unknown, fallback: number): number {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return fallback;
}

function normalizePainClusters(
  raw: unknown,
  posts: PainPost[],
): PainCluster[] {
  const postIds = new Set(posts.map((p) => p.id));
  const postsById = new Map(posts.map((p) => [p.id, p]));
  const rows = Array.isArray(raw) ? raw : [];

  return rows.slice(0, 5).map((item, index) => {
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? `cluster-${index + 1}`);
    const relatedPostIds = (
      Array.isArray(row.relatedPostIds) ? row.relatedPostIds : []
    )
      .map(String)
      .filter((pid) => postIds.has(pid));

    const relatedPosts = relatedPostIds
      .map((pid) => postsById.get(pid))
      .filter((p): p is PainPost => Boolean(p));

    const computedEngagement = relatedPosts.reduce(
      (sum, post) => sum + engagementScore(post),
      0,
    );

    return {
      id,
      title: String(row.title ?? `페인포인트 ${index + 1}`),
      summary: String(row.summary ?? ""),
      severity: asSeverity(row.severity),
      evidenceCount: Number(row.evidenceCount) || relatedPostIds.length || 1,
      totalEngagementScore:
        Number(row.totalEngagementScore) || computedEngagement || 0,
      representativeQuotes: normalizeQuotes(row.representativeQuotes, postsById),
      relatedPostIds:
        relatedPostIds.length > 0
          ? relatedPostIds
          : posts.slice(index, index + 2).map((p) => p.id),
    };
  });
}

function normalizeIdeaCards(
  raw: unknown,
  clusters: PainCluster[],
  postsById: Map<string, PainPost>,
): IdeaCard[] {
  const clusterIds = new Set(clusters.map((c) => c.id));
  const rows = Array.isArray(raw) ? raw : [];

  return rows.slice(0, 5).map((item, index) => {
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? `idea-${index + 1}`);
    const linked = (
      Array.isArray(row.linkedPainClusterIds) ? row.linkedPainClusterIds : []
    )
      .map(String)
      .filter((cid) => clusterIds.has(cid));

    const mvpScope = Array.isArray(row.mvpScope)
      ? row.mvpScope.map(String).filter(Boolean)
      : [];
    while (mvpScope.length < 3) mvpScope.push("핵심 기능 정의 필요");

    const differentiation = Array.isArray(row.differentiation)
      ? row.differentiation.map(String).filter(Boolean)
      : [];
    while (differentiation.length < 2) differentiation.push("차별점 정의 필요");

    return {
      id,
      title: String(row.title ?? `아이디어 ${index + 1}`),
      oneLiner: String(row.oneLiner ?? ""),
      linkedPainClusterIds:
        linked.length > 0
          ? linked
          : [clusters[index]?.id ?? clusters[0]?.id].filter((id): id is string => Boolean(id)),
      targetCustomer: String(row.targetCustomer ?? "초기 타깃 미정"),
      problem: String(row.problem ?? ""),
      solution: String(row.solution ?? ""),
      revenueModel: String(row.revenueModel ?? "수익 모델 검토 필요"),
      mvpScope: mvpScope.slice(0, 6),
      differentiation: differentiation.slice(0, 5),
      whyNow: String(row.whyNow ?? ""),
      evidenceQuotes: normalizeQuotes(row.evidenceQuotes, postsById),
      feasibilityScore: clampScore(row.feasibilityScore, 70 - index * 5),
      marketPotentialScore: clampScore(row.marketPotentialScore, 75 - index * 3),
    };
  });
}

function normalizeAnalysisResult(
  raw: Record<string, unknown>,
  keyword: string,
  posts: PainPost[],
): GeminiPainpointAnalysisResult {
  const painClusters = normalizePainClusters(raw.painClusters, posts);
  if (painClusters.length < 3) {
    throw new Error(
      `Gemini returned fewer than 3 pain clusters (${painClusters.length}). Refine the prompt or retry.`,
    );
  }

  const postsById = new Map(posts.map((p) => [p.id, p]));
  let ideaCards = normalizeIdeaCards(raw.ideaCards, painClusters, postsById);
  while (ideaCards.length < painClusters.length && ideaCards.length < 5) {
    const cluster = painClusters[ideaCards.length];
    ideaCards.push({
      id: `idea-${ideaCards.length + 1}`,
      title: `${cluster.title} 기반 솔루션`,
      oneLiner: cluster.summary.slice(0, 120),
      linkedPainClusterIds: [cluster.id],
      targetCustomer: "해당 불만을 겪는 사용자",
      problem: cluster.summary,
      solution: "근거 기반 MVP 제안",
      revenueModel: "구독 또는 B2B 라이선스",
      mvpScope: ["핵심 워크플로", "증거 수집", "대시보드"],
      differentiation: ["실제 불만 데이터 기반", "한국 시장 특화"],
      whyNow: "반복되는 불만 신호가 뚜렷함",
      evidenceQuotes: cluster.representativeQuotes,
      feasibilityScore: 65,
      marketPotentialScore: 70,
    });
  }

  const executiveSummary = String(
    raw.executiveSummary ??
      `"${keyword}" 키워드에 대해 ${posts.length}건의 게시물을 분석하여 ${painClusters.length}개의 페인 클러스터와 ${ideaCards.length}개의 창업 아이디어를 도출했습니다.`,
  );

  return {
    keyword,
    analyzedPostCount: posts.length,
    painClusters,
    ideaCards: ideaCards.slice(0, 5),
    executiveSummary,
  };
}

async function callGeminiGenerateContent(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(
      `Gemini API request failed (${response.status}): ${rawBody.slice(0, 500)}`,
    );
  }

  let data: GeminiGenerateResponse;
  try {
    data = JSON.parse(rawBody) as GeminiGenerateResponse;
  } catch {
    throw new Error(
      `Gemini API returned non-JSON response: ${rawBody.slice(0, 400)}`,
    );
  }

  return extractGeminiText(data);
}

/**
 * Server-only: clusters complaint posts and generates startup ideas via Gemini.
 */
export async function runGeminiPainpointAnalysis(
  input: GeminiPainpointAnalysisInput,
): Promise<GeminiPainpointAnalysisResult> {
  const keyword = input.keyword.trim();
  if (!keyword) {
    throw new Error("keyword is required for Gemini painpoint analysis.");
  }
  if (!input.posts.length) {
    throw new Error("posts array is empty; cannot run Gemini painpoint analysis.");
  }

  const posts = preparePosts(input.posts);
  const prompt = buildAnalysisPrompt(keyword, posts);
  const contentText = await callGeminiGenerateContent(prompt);
  const parsed = parseModelJson(contentText);

  return normalizeAnalysisResult(parsed, keyword, posts);
}

/** Preferred export name for API routes and server actions. */
export const analyzePainpointsWithGemini = runGeminiPainpointAnalysis;

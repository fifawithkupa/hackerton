import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "../supabase/admin";

export type PainPost = {
  id: string;
  source: string;
  title: string;
  text: string;
  url?: string;
  author?: string;
  createdAt?: string;
  likes?: number;
  comments?: number;
  rawScore?: number;
  keyword?: string;
  stars?: number;
};

export type PainCluster = {
  id: string;
  title: string;
  summary: string;
  severity: "상" | "중" | "하";
  evidenceCount: number;
  totalEngagementScore: number;
  representativeQuotes: { text: string; source: string; url: string }[];
  relatedPostIds: string[];
};

export type IdeaCard = {
  id: string;
  title: string;
  oneLiner: string;
  linkedPainClusterIds: string[];
  targetCustomer: string;
  problem: string;
  solution: string;
  revenueModel: string;
  mvpScope: string[];
  differentiation: string[];
  whyNow: string;
  evidenceQuotes: { text: string; source: string; url: string }[];
  feasibilityScore: number;
  marketPotentialScore: number;
};

/** Structured SSATIS analysis payload (provider-agnostic). */
export type SsatisAnalysisResult = {
  keyword: string;
  analyzedPostCount: number;
  painClusters: PainCluster[];
  ideaCards: IdeaCard[];
  executiveSummary: string;
};

export type SaveAnalysisResultInput = {
  keyword: string;
  platforms?: string[];
  posts: PainPost[];
  analysis: SsatisAnalysisResult;
};

export type SaveAnalysisResultOutput = {
  searchId: string;
  reportId: string;
  savedIdeas: { id: string; aiIdeaId: string; clusterId: string | null }[];
};

function throwInsertError(table: string, error: PostgrestError): never {
  const details = error.details ? ` — ${error.details}` : "";
  const hint = error.hint ? ` Hint: ${error.hint}` : "";
  throw new Error(
    `Failed to persist SSATIS analysis (${table}): ${error.message} [${error.code}]${details}${hint}`,
  );
}

function parseSourceTimestamp(value?: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function resolveClusterId(
  linkedPainClusterIds: string[],
  clusterIdByAiId: Map<string, string>,
): string | null {
  for (const clusterKey of linkedPainClusterIds) {
    const dbId = clusterIdByAiId.get(clusterKey);
    if (dbId) return dbId;
  }
  return null;
}

/**
 * Persists a completed SSATIS analysis to Supabase.
 * Accepts any provider's structured analysis object (clusters, ideas, summary).
 */
export async function saveAnalysisResult(
  input: SaveAnalysisResultInput,
): Promise<SaveAnalysisResultOutput> {
  const supabase = createSupabaseAdmin();
  const { keyword, platforms = [], posts, analysis } = input;

  const { data: searchRow, error: searchError } = await supabase
    .from("searches")
    .insert({
      keyword,
      platforms,
      total_posts: posts.length,
      analyzed_post_count: analysis.analyzedPostCount,
      status: "completed",
    })
    .select("id")
    .single();

  if (searchError) throwInsertError("searches", searchError);
  if (!searchRow?.id) {
    throw new Error(
      "Failed to persist SSATIS analysis (searches): insert succeeded but no id was returned.",
    );
  }

  const searchId = searchRow.id;

  if (posts.length > 0) {
    const postRows = posts.map((post) => ({
      search_id: searchId,
      external_id: post.id,
      source: post.source,
      title: post.title,
      text: post.text,
      url: post.url ?? null,
      author: post.author ?? null,
      created_at_source: parseSourceTimestamp(post.createdAt),
      likes: post.likes ?? 0,
      comments: post.comments ?? 0,
      raw_score: post.rawScore ?? 0,
      keyword: post.keyword ?? keyword,
      stars: post.stars ?? null,
      metadata: {},
    }));

    const { error: postsError } = await supabase.from("pain_posts").insert(postRows);
    if (postsError) throwInsertError("pain_posts", postsError);
  }

  const clusterIdByAiId = new Map<string, string>();

  if (analysis.painClusters.length > 0) {
    const clusterRows = analysis.painClusters.map((cluster) => ({
      search_id: searchId,
      ai_cluster_id: cluster.id,
      title: cluster.title,
      summary: cluster.summary,
      severity: cluster.severity,
      evidence_count: cluster.evidenceCount,
      total_engagement_score: cluster.totalEngagementScore,
      representative_quotes: cluster.representativeQuotes,
      related_post_ids: cluster.relatedPostIds,
    }));

    const { data: insertedClusters, error: clustersError } = await supabase
      .from("pain_clusters")
      .insert(clusterRows)
      .select("id, ai_cluster_id");

    if (clustersError) throwInsertError("pain_clusters", clustersError);
    if (!insertedClusters?.length) {
      throw new Error(
        "Failed to persist SSATIS analysis (pain_clusters): insert succeeded but no rows were returned.",
      );
    }

    for (const row of insertedClusters) {
      if (row.ai_cluster_id && row.id) {
        clusterIdByAiId.set(row.ai_cluster_id, row.id);
      }
    }
  }

  const savedIdeas: SaveAnalysisResultOutput["savedIdeas"] = [];

  if (analysis.ideaCards.length > 0) {
    const ideaRows = analysis.ideaCards.map((idea) => ({
      search_id: searchId,
      cluster_id: resolveClusterId(idea.linkedPainClusterIds, clusterIdByAiId),
      ai_idea_id: idea.id,
      title: idea.title,
      one_liner: idea.oneLiner,
      target_customer: idea.targetCustomer,
      problem: idea.problem,
      solution: idea.solution,
      revenue_model: idea.revenueModel,
      mvp_scope: idea.mvpScope,
      differentiation: idea.differentiation,
      why_now: idea.whyNow,
      evidence_quotes: idea.evidenceQuotes,
      feasibility_score: idea.feasibilityScore,
      market_potential_score: idea.marketPotentialScore,
    }));

    const { data: insertedIdeas, error: ideasError } = await supabase
      .from("ideas")
      .insert(ideaRows)
      .select("id, ai_idea_id, cluster_id");

    if (ideasError) throwInsertError("ideas", ideasError);
    if (!insertedIdeas?.length) {
      throw new Error(
        "Failed to persist SSATIS analysis (ideas): insert succeeded but no rows were returned.",
      );
    }

    for (const row of insertedIdeas) {
      savedIdeas.push({
        id: row.id,
        aiIdeaId: row.ai_idea_id ?? "",
        clusterId: row.cluster_id,
      });
    }
  }

  const reportTitle = `SSATIS ${analysis.keyword} 페인포인트 분석 리포트`;

  const { data: reportRow, error: reportError } = await supabase
    .from("reports")
    .insert({
      search_id: searchId,
      title: reportTitle,
      executive_summary: analysis.executiveSummary,
      report_json: analysis,
    })
    .select("id")
    .single();

  if (reportError) throwInsertError("reports", reportError);
  if (!reportRow?.id) {
    throw new Error(
      "Failed to persist SSATIS analysis (reports): insert succeeded but no id was returned.",
    );
  }

  return {
    searchId,
    reportId: reportRow.id,
    savedIdeas,
  };
}

/** Alias used by API routes — same provider-agnostic persistence. */
export const saveAnalysisResultToSupabase = saveAnalysisResult;

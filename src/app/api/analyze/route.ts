import { NextResponse } from "next/server";
import { analyzePainpointsWithGemini } from "@/lib/ai/geminiPainpointAnalysis";
import {
  saveAnalysisResultToSupabase,
  type PainPost,
} from "@/lib/db/saveAnalysisResult";

type AnalyzeRequestBody = {
  keyword?: string;
  platforms?: string[];
  posts?: PainPost[];
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isPainPost(value: unknown): value is PainPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "string" &&
    post.id.trim().length > 0 &&
    typeof post.source === "string" &&
    post.source.trim().length > 0 &&
    typeof post.title === "string" &&
    typeof post.text === "string" &&
    post.text.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;

  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const platforms = Array.isArray(body.platforms)
    ? body.platforms.map(String).filter(Boolean)
    : [];
  const posts = Array.isArray(body.posts) ? body.posts : [];

  if (!keyword) {
    return NextResponse.json({ error: "keyword is required." }, { status: 400 });
  }

  if (!posts.length) {
    return NextResponse.json(
      { error: "posts must be a non-empty array." },
      { status: 400 },
    );
  }

  if (!posts.every(isPainPost)) {
    return NextResponse.json(
      {
        error:
          "Each post must include id, source, title, and non-empty text.",
      },
      { status: 400 },
    );
  }

  let analysis;

  try {
    analysis = await analyzePainpointsWithGemini({ keyword, posts });
  } catch (error) {
    console.error("[GEMINI_ANALYZE_ERROR]", error);
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 },
    );
  }

  let saved;

  try {
    saved = await saveAnalysisResultToSupabase({
      keyword,
      platforms,
      posts,
      analysis,
    });
  } catch (error) {
    console.error("[SUPABASE_SAVE_ERROR]", error);
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    keyword: analysis.keyword,
    analyzedPostCount: analysis.analyzedPostCount,
    painClusters: analysis.painClusters,
    ideaCards: analysis.ideaCards,
    executiveSummary: analysis.executiveSummary,
    saved: {
      searchId: saved.searchId,
      reportId: saved.reportId,
      savedIdeas: saved.savedIdeas,
    },
  });
}

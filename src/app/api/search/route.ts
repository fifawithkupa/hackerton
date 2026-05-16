import { NextResponse } from "next/server";
import { buildPPData, searchReddit } from "@/lib/reddit/searchReddit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("q") || "").trim();

  if (!keyword) {
    return NextResponse.json({ error: "keyword required" }, { status: 400 });
  }

  try {
    const posts = await searchReddit(keyword);
    const data = buildPPData(keyword, posts);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[REDDIT_SEARCH_ERROR]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { fetchMarketSignals } from "../../painpoint/lib/market-signals/index.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { clusterId, keyword, userId } = req.body || {};
  if (!keyword) return res.status(400).json({ error: "keyword 필수" });

  // Pro 플랜 체크
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  if (userId) {
    const { data: profile } = await db
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.plan === "Free") {
      return res.status(403).json({ error: "Pro 플랜 전용 기능입니다" });
    }
  }

  try {
    const data = await fetchMarketSignals(clusterId || null, keyword);
    res.status(200).json(data);
  } catch (e) {
    console.error("[premium/market-signals]", e.message);
    res.status(500).json({ error: String(e.message) });
  }
}

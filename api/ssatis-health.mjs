import { DEFAULT_GEMINI_MODEL } from "../painpoint/ssatis-ai-core.mjs";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  res.status(200).json({
    provider: "gemini",
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    keyLoaded: Boolean(apiKey && apiKey.length >= 12),
    youtubeKeyLoaded: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
  });
}

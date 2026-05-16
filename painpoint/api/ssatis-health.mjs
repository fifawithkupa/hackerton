import { loadGeminiKey, loadYoutubeKey, resolveGeminiModel } from "../server-config.mjs";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    provider: "gemini",
    model: resolveGeminiModel(),
    keyLoaded: Boolean(loadGeminiKey()),
    youtubeKeyLoaded: Boolean(loadYoutubeKey()),
  });
}

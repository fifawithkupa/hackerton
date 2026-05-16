import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_GEMINI_MODEL } from "./ssatis-ai-core.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function looksLikeApiKey(k) {
  if (typeof k !== "string") return false;
  const t = k.trim();
  return (
    t.length >= 12 &&
    !/^YOUR_(GEMINI|OPENAI|YOUTUBE)/i.test(t) &&
    t !== "YOUR_GEMINI_API_KEY" &&
    t !== "YOUR_OPENAI_API_KEY" &&
    t !== "YOUR_YOUTUBE_API_KEY" &&
    t !== "via-dev-server-env"
  );
}

function looksLikeGoogleClientId(id) {
  if (typeof id !== "string") return false;
  const t = id.trim();
  return t.includes(".apps.googleusercontent.com") && t.length > 20;
}

function looksLikeSupabaseUrl(url) {
  if (typeof url !== "string") return false;
  const t = url.trim();
  return t.startsWith("https://") && t.includes(".supabase.co") && !/^YOUR_/i.test(t);
}

function looksLikeSupabaseAnonKey(key) {
  if (typeof key !== "string") return false;
  const t = key.trim();
  return t.startsWith("eyJ") && t.length > 80 && !/^YOUR_/i.test(t);
}

export function loadConfigJs() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, "config.js"), "utf8");
    const g = raw.match(/geminiApiKey:\s*"([^"]*)"/);
    const o = raw.match(/openaiApiKey:\s*"([^"]*)"/);
    const key = (g?.[1] ?? o?.[1])?.trim() ?? "";
    const geminiModel = raw.match(/geminiModel:\s*"([^"]*)"/)?.[1]?.trim();
    const youtube = raw.match(/youtubeApiKey:\s*"([^"]*)"/)?.[1]?.trim() ?? "";
    const googleClientId = raw.match(/googleClientId:\s*"([^"]*)"/)?.[1]?.trim() ?? "";
    const supabaseUrl = raw.match(/supabaseUrl:\s*"([^"]*)"/)?.[1]?.trim() ?? "";
    const supabaseAnonKey = raw.match(/supabaseAnonKey:\s*"([^"]*)"/)?.[1]?.trim() ?? "";
    return {
      key: looksLikeApiKey(key) ? key : null,
      geminiModel: geminiModel || null,
      youtubeKey: looksLikeApiKey(youtube) ? youtube : null,
      googleClientId: looksLikeGoogleClientId(googleClientId) ? googleClientId : "",
      supabaseUrl: looksLikeSupabaseUrl(supabaseUrl) ? supabaseUrl : "",
      supabaseAnonKey: looksLikeSupabaseAnonKey(supabaseAnonKey) ? supabaseAnonKey : "",
    };
  } catch {
    return {
      key: null,
      geminiModel: null,
      youtubeKey: null,
      googleClientId: "",
      supabaseUrl: "",
      supabaseAnonKey: "",
    };
  }
}

/** 브라우저에 노출해도 되는 공개 설정 (Vercel env + config.js) */
export function loadPublicClientConfig() {
  const file = loadConfigJs();
  const googleClientId =
    (looksLikeGoogleClientId(process.env.GOOGLE_CLIENT_ID) && process.env.GOOGLE_CLIENT_ID.trim()) ||
    file.googleClientId ||
    "";
  const supabaseUrl =
    (looksLikeSupabaseUrl(process.env.SUPABASE_URL) && process.env.SUPABASE_URL.trim()) ||
    (looksLikeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.trim()) ||
    file.supabaseUrl ||
    "";
  const supabaseAnonKey =
    (looksLikeSupabaseAnonKey(process.env.SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_ANON_KEY.trim()) ||
    (looksLikeSupabaseAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
    file.supabaseAnonKey ||
    "";

  return {
    googleClientId,
    supabaseUrl,
    supabaseAnonKey,
    authReady: Boolean(googleClientId || (supabaseUrl && supabaseAnonKey)),
  };
}

export function resolveGeminiModel() {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    loadConfigJs().geminiModel ||
    DEFAULT_GEMINI_MODEL
  );
}

export function loadGeminiKey() {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (looksLikeApiKey(env)) return env;
  return loadConfigJs().key;
}

export function loadYoutubeKey() {
  const env = process.env.YOUTUBE_API_KEY?.trim();
  if (looksLikeApiKey(env)) return env;
  return loadConfigJs().youtubeKey;
}

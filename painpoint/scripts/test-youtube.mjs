import fs from "fs";
import { searchYoutubeComments } from "../youtube-search.mjs";

const raw = fs.readFileSync(new URL("../config.js", import.meta.url), "utf8");
const m = raw.match(/youtubeApiKey:\s*"([^"]*)"/);
const key = m?.[1];
if (!key) {
  console.error("no youtubeApiKey in config.js");
  process.exit(1);
}
const comments = await searchYoutubeComments("HR", key);
console.log("comments:", comments.length);
if (comments[0]) {
  console.log("sample:", comments[0].text.slice(0, 80));
}

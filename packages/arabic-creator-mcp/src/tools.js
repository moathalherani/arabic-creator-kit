// The tools this MCP server offers. Each one is { name, title, description, inputSchema, run(args) }
// and run returns plain text (what the assistant reads). Kept separate from the protocol so it can be tested.
import { scoreHook, getHooks, CATEGORIES, DIALECTS } from "arabic-hooks";
import { parseSubtitles, keywordCaptions, toSrt } from "arabic-captions";
import { amountToWords, CURRENCIES } from "arabic-tafqeet";
import { checkPost, PLATFORMS } from "arabic-social";
import TEMPLATES from "./templates.js";

export const STUDIO = "https://moathalherani.github.io/arabic-creator-kit/motion/";
const STYLE_KEYS = ["format", "background", "fontAr", "fontEn", "accent", "ink", "bg", "card", "danger", "capStyle"];

/** base64url of UTF-8 text (works in Node 18+ and browsers). */
function base64url(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A reel design → { url, used, skipped }. Same link format the studio's "share" button makes. */
export function designLink({ scenes, style } = {}) {
  if (!Array.isArray(scenes) || scenes.length === 0) throw new Error("scenes must be a non-empty array");
  const out = [];
  const skipped = [];
  scenes.slice(0, 12).forEach((scene, i) => {
    const id = String(scene?.template ?? "").trim().toLowerCase();
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) {
      skipped.push(`scene ${i + 1}: unknown template "${id}"`);
      return;
    }
    const p = {};
    for (const { key } of tpl.fields) {
      let v = scene[key];
      if (Array.isArray(v)) v = v.map((x) => (Array.isArray(x) ? x.join(" | ") : String(x))).join("\n");
      if (typeof v === "number") v = String(v);
      if (typeof v === "string") p[key] = v.slice(0, 600);
    }
    out.push({ id, st: Math.max(0, Number(scene.start) || 0), p });
  });
  if (!out.length) throw new Error(`no usable scenes (${skipped.join("; ")})`);
  const s = {};
  for (const k of STYLE_KEYS) if (typeof style?.[k] === "string") s[k] = style[k];
  return { url: `${STUDIO}#d=${base64url(JSON.stringify({ v: 1, s, sc: out }))}`, used: out.map((x) => x.id), skipped };
}

const templateList = TEMPLATES.map((t) => `- ${t.id} (${t.name}): ${t.fields.map((f) => `${f.key} = ${f.label}`).join("; ") || "no text"}`).join("\n");

export const tools = [
  {
    name: "design_reel",
    title: "Design an Arabic reel",
    description: `Design an Arabic Reel, TikTok or Short as motion-graphics scenes. Returns a link that opens the free Motion Studio with the scenes ready; there the person adds their video and SRT captions and downloads an MP4.
Rules: 4 to 7 scenes. The first scene is a strong "hook" with no greeting; the last is "follow". Short lines in the person's dialect. English words stay in English letters, digits 0-9. Never invent numbers or statistics. In fields with several items, one item per line and parts split with " | ".
Templates (template id: fields):
${templateList}`,
    inputSchema: {
      type: "object",
      properties: {
        scenes: {
          type: "array",
          description: 'Scenes in order. Each has "template" (an id above) and that template\'s fields, plus an optional "start" in seconds when the person has a video.',
          items: { type: "object", properties: { template: { type: "string" }, start: { type: "number" } }, required: ["template"], additionalProperties: true },
        },
        style: {
          type: "object",
          description: "Optional look: format (vertical, square, landscape), background (grid-light, grid-dark, green, plain), accent/ink/bg/card/danger hex colors, fontAr and fontEn (Google Fonts names), capStyle (keyword, box, karaoke).",
          properties: Object.fromEntries(STYLE_KEYS.map((k) => [k, { type: "string" }])),
        },
      },
      required: ["scenes"],
    },
    run(args) {
      const { url, used, skipped } = designLink(args);
      return [`Motion Studio link (open it, add a video and captions if you like, then press Download):`, url, "", `Scenes: ${used.join(" → ")}`, ...skipped.map((s) => `Skipped ${s}`)].join("\n");
    },
  },
  {
    name: "score_hook",
    title: "Score a hook",
    description: "Score the first line of a video (Arabic or English) out of 100, with tips to make it stronger (length, greeting at the start, talking to the viewer, a real number, tension).",
    inputSchema: { type: "object", properties: { text: { type: "string", description: "The hook" } }, required: ["text"] },
    run({ text }) {
      const r = scoreHook(String(text ?? ""));
      return [`Score: ${r.score}/100 (${r.words} words)`, ...(r.tips.length ? r.tips.map((t) => `- ${t.ar} (${t.en})`) : ["- Strong. Ship it."])].join("\n");
    },
  },
  {
    name: "find_hooks",
    title: "Find hooks",
    description: `Find proven video hooks from a curated Arabic dataset, by category and dialect. Categories: ${CATEGORIES.join(", ")}. Dialects: ${Object.entries(DIALECTS).map(([k, v]) => `${k} (${v})`).join(", ")}.`,
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: [...CATEGORIES] },
        dialect: { type: "string", enum: Object.keys(DIALECTS) },
        search: { type: "string", description: "A word to look for, in Arabic or English" },
        limit: { type: "number", description: "How many (default 10, max 30)" },
      },
    },
    run({ category, dialect, search, limit = 10 } = {}) {
      const list = getHooks({ category: category || undefined, dialect: dialect || undefined, search: search || undefined }).slice(0, Math.min(30, Math.max(1, Number(limit) || 10)));
      if (!list.length) return "No hooks match. Try without a dialect or search word.";
      return list.map((h) => `- [${h.category}, ${h.dialect}] ${h.ar}${h.en ? ` (${h.en})` : ""}`).join("\n");
    },
  },
  {
    name: "keyword_captions",
    title: "Keyword captions from SRT",
    description: "Turn SRT or WebVTT subtitles into short keyword captions for Reels (2-3 words per caption, fillers removed, Latin digits, correct Arabic/English order). Returns SRT, with the keyword of each caption listed after it.",
    inputSchema: {
      type: "object",
      properties: {
        subtitles: { type: "string", description: "The full SRT or WebVTT text" },
        maxWords: { type: "number", description: "Words per caption (default 3)" },
      },
      required: ["subtitles"],
    },
    run({ subtitles, maxWords = 3 }) {
      const cues = parseSubtitles(String(subtitles ?? ""));
      if (!cues.length) throw new Error("No cues found: paste the full SRT or WebVTT text.");
      const caps = keywordCaptions(cues, { maxWords: Math.max(1, Math.min(6, Math.round(Number(maxWords) || 3))) });
      const keys = caps.map((c, i) => `${i + 1}: ${c.keyword >= 0 ? c.words[c.keyword] : "-"}`).join("\n");
      return `${toSrt(caps)}\nKeywords (color these):\n${keys}`;
    },
  },
  {
    name: "amount_in_words",
    title: "Amount in Arabic words",
    description: `Write a money amount in correct Arabic words, for invoices and cheques. Currencies: ${Object.keys(CURRENCIES).join(", ")}.`,
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: ["number", "string"], description: "e.g. 1500 or \"1,250.75\"" },
        currency: { type: "string", enum: Object.keys(CURRENCIES) },
        only: { type: "boolean", description: "Wrap as «فقط … لا غير» like on cheques" },
      },
      required: ["amount"],
    },
    run({ amount, currency = "AED", only = false }) {
      return amountToWords(amount, { currency, only });
    },
  },
  {
    name: "check_post",
    title: "Check a post",
    description: `Check a caption or post before publishing: length against the platform limit (X counted the weighted way), hashtag and mention limits, hidden characters, and the preview before "…more". Platforms: ${Object.keys(PLATFORMS).join(", ")}.`,
    inputSchema: {
      type: "object",
      properties: { text: { type: "string" }, platform: { type: "string", enum: Object.keys(PLATFORMS) } },
      required: ["text"],
    },
    run({ text, platform = "instagram" }) {
      const r = checkPost(String(text ?? ""), platform);
      return [
        `${r.platform}: ${r.length}/${r.limit} characters (${r.remaining} left)${r.ok ? ", ready" : ""}`,
        `Hashtags: ${r.hashtags.length}${r.hashtagLimit ? `/${r.hashtagLimit}` : ""}`,
        ...(r.preview ? [`Preview before "more": ${r.preview}`] : []),
        ...r.problems.map((p) => `- ${p.ar} (${p.en})`),
      ].join("\n");
    },
  },
];

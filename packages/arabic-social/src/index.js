// arabic-social: caption helpers for Arabic creators: hashtags that work in Arabic,
// per-platform limits (with X's weighted count), "…more" previews and clean line breaks.

/**
 * Platform text limits, checked in 2026 from platform docs and scheduling tools.
 * Platforms change these; open an issue if one is out of date.
 */
export const PLATFORMS = Object.freeze({
  instagram: { name: "Instagram", caption: 2200, hashtags: 5, mentions: 20, preview: 125, bio: 150 },
  tiktok: { name: "TikTok", caption: 2200, preview: 100 },
  youtube: { name: "YouTube", title: 100, caption: 5000, preview: 150 },
  shorts: { name: "YouTube Shorts", title: 100, caption: 5000, preview: 100 },
  x: { name: "X", caption: 280, weighted: true },
  threads: { name: "Threads", caption: 500 },
  linkedin: { name: "LinkedIn", caption: 3000, preview: 210, headline: 220 },
  facebook: { name: "Facebook", caption: 63206, preview: 480 },
  snapchat: { name: "Snapchat Spotlight", caption: 500 },
  pinterest: { name: "Pinterest", title: 100, caption: 800 },
});

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const INVISIBLE = /[\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/**
 * Turn any phrase into one hashtag that works on Instagram, TikTok and X:
 * spaces become "_", tashkeel and punctuation are removed, Arabic digits become 0-9.
 * @example hashtag("سيارات كهربائية!") // "#سيارات_كهربائية"
 */
export function hashtag(text, options = {}) {
  const { separator = "_", latinDigits = true } = options;
  let s = String(text).replace(INVISIBLE, "").replace(TASHKEEL, "").replace(/^#+/, "");
  if (latinDigits) s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)));
  s = s
    .replace(/[^\p{L}\p{N}_\s]+/gu, " ")
    .trim()
    .replace(/\s+/g, separator);
  if (!s || /^\d+$/.test(s)) throw new Error(`"${text}" cannot be a hashtag (needs at least one letter)`);
  return `#${s}`;
}

/** Normalized key for comparing hashtags: no #, no tashkeel, unified alef/ya/ta marbuta, lower case. */
export function hashtagKey(tag) {
  return String(tag)
    .replace(/^#/, "")
    .replace(TASHKEEL, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/_/g, "")
    .toLowerCase();
}

/**
 * Build a clean, de-duplicated hashtag list, capped for the platform.
 * @param {string[]} phrases
 * @param {{ platform?: keyof typeof PLATFORMS, max?: number }} [options]
 */
export function hashtags(phrases, options = {}) {
  const max = options.max ?? PLATFORMS[options.platform ?? "instagram"]?.hashtags ?? 5;
  const seen = new Set();
  const out = [];
  for (const p of phrases) {
    let tag;
    try {
      tag = hashtag(p);
    } catch {
      continue;
    }
    const key = hashtagKey(tag);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= max) break;
  }
  return out;
}

/** Find hashtags in text, including Arabic ones. */
export function extractHashtags(text) {
  return [...String(text).matchAll(/(^|[^\p{L}\p{N}_&])(#[\p{L}\p{M}\p{N}_]*[\p{L}][\p{L}\p{M}\p{N}_]*)/gu)].map((m) => m[2]);
}

/** Find @mentions in text. */
export function extractMentions(text) {
  return [...String(text).matchAll(/(^|[^\p{L}\p{N}_.@])@([A-Za-z0-9_.]{1,30})/gu)].map((m) => `@${m[2]}`);
}

const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

/** Characters as people see them (an emoji with skin tone counts as 1). */
export function countCharacters(text) {
  const s = String(text);
  if (!segmenter) return [...s].length;
  let n = 0;
  for (const _ of segmenter.segment(s)) n++;
  return n;
}

const URL_RE = /https?:\/\/[^\s]+|(?:www\.)[^\s]+/gi;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/**
 * Length the way X counts it: URLs count as 23, emoji as 2, most letters
 * (Latin and Arabic included) as 1, and CJK characters as 2.
 */
export function xLength(text) {
  const s = String(text).replace(URL_RE, "x".repeat(23));
  let n = 0;
  const parts = segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : [...s];
  for (const g of parts) {
    if (EMOJI_RE.test(g)) {
      n += 2;
      continue;
    }
    const cp = g.codePointAt(0);
    const light = cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
    n += light ? 1 : 2;
  }
  return n;
}

/**
 * The part of a caption people see before "…more" (approximate; apps vary by screen).
 * Cuts on a word and stops at the first line break.
 */
export function previewText(text, chars = 125) {
  const firstLine = String(text).trim().split(/\n/)[0];
  if (countCharacters(firstLine) <= chars) return firstLine;
  const cut = Array.from(segmenter ? segmenter.segment(firstLine) : firstLine, (x) => (typeof x === "string" ? x : x.segment))
    .slice(0, chars)
    .join("");
  const at = cut.lastIndexOf(" ");
  return `${(at > chars * 0.6 ? cut.slice(0, at) : cut).trim()}…`;
}

/**
 * Check a caption against a platform's limits.
 * @param {string} text
 * @param {keyof typeof PLATFORMS} platform
 * @returns {{ platform: string, length: number, limit: number, remaining: number, ok: boolean, hashtags: string[], hashtagLimit?: number, mentions: string[], preview?: string, problems: { ar: string, en: string }[] }}
 */
export function checkPost(text, platform = "instagram") {
  const p = PLATFORMS[platform];
  if (!p) throw new RangeError(`Unknown platform ${platform}. Use: ${Object.keys(PLATFORMS).join(", ")}`);
  const length = p.weighted ? xLength(text) : countCharacters(text);
  const tags = extractHashtags(text);
  const mentions = extractMentions(text);
  const problems = [];
  if (length > p.caption) {
    problems.push({ ar: `النص أطول من المسموح بـ ${length - p.caption} حرف.`, en: `Text is ${length - p.caption} characters over the limit.` });
  }
  if (p.hashtags && tags.length > p.hashtags) {
    problems.push({ ar: `${p.name} بيسمح بـ ${p.hashtags} هاشتاقات بس، عندك ${tags.length}.`, en: `${p.name} allows ${p.hashtags} hashtags; you have ${tags.length}.` });
  }
  if (p.mentions && mentions.length > p.mentions) {
    problems.push({ ar: `منشنات أكثر من ${p.mentions}.`, en: `More than ${p.mentions} mentions.` });
  }
  if (new RegExp(INVISIBLE.source).test(text)) {
    problems.push({ ar: "في رموز مخفية بالنص (من النسخ واللصق)، نظّفه بـ cleanCaption.", en: "Hidden characters found (often from copy-paste); run cleanCaption." });
  }
  return {
    platform: p.name,
    length,
    limit: p.caption,
    remaining: p.caption - length,
    ok: problems.length === 0,
    hashtags: tags,
    ...(p.hashtags ? { hashtagLimit: p.hashtags } : {}),
    mentions,
    ...(p.preview ? { preview: previewText(text, p.preview) } : {}),
    problems,
  };
}

/**
 * Remove invisible characters that sneak in from copy-paste or AI tools
 * (zero-width spaces, direction marks, BOM), trim trailing spaces and extra blank lines.
 * Keeps ZWNJ (used in Persian and Urdu).
 */
export function cleanCaption(text) {
  return String(text)
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Keep empty lines in Instagram captions: the app collapses blank lines, so each
 * empty line gets an invisible braille blank (U+2800) that the app keeps.
 */
export function keepLineBreaks(text) {
  return cleanCaption(text)
    .split("\n")
    .map((line) => (line.trim() === "" ? "\u2800" : line))
    .join("\n");
}

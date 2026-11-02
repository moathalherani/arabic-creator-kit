import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const DATA = require("./hooks.json");

/** The five hook families used across the dataset. */
export const CATEGORIES = Object.freeze(["shock", "curiosity", "promise", "challenge", "story"]);

/** Arabic labels for each category. */
export const CATEGORY_LABELS = Object.freeze({
  shock: { ar: "صدمة", en: "Shock" },
  curiosity: { ar: "فضول", en: "Curiosity" },
  promise: { ar: "وعد", en: "Promise" },
  challenge: { ar: "تحدّي", en: "Challenge" },
  story: { ar: "قصة", en: "Story" },
});

/** Dialect codes present in the dataset. Contributions for more dialects are welcome. */
export const DIALECTS = Object.freeze({
  jo: "Jordanian (أردني)",
  eg: "Egyptian (مصري)",
  gulf: "Gulf (خليجي)",
  sy: "Syrian (سوري)",
  ma: "Maghrebi (مغاربي)",
  msa: "Modern Standard Arabic (فصحى)",
});

/**
 * How much each part of a short video contributes to how well it performs.
 * A rule of thumb used by the author when reviewing Reels, not a measured statistic.
 */
export const VIDEO_WEIGHTS = Object.freeze([
  { key: "hook", ar: "الهوك", en: "Hook", weight: 40 },
  { key: "delivery", ar: "التقديم", en: "Delivery", weight: 20 },
  { key: "audio", ar: "الصوت", en: "Audio", weight: 15 },
  { key: "lighting", ar: "الإضاءة", en: "Lighting", weight: 10 },
  { key: "tone", ar: "النبرة", en: "Tone", weight: 10 },
  { key: "wardrobe", ar: "اللبس", en: "Wardrobe", weight: 5 },
]);

/** Every hook in the dataset (frozen copies). */
export const hooks = Object.freeze(DATA.map((h) => Object.freeze({ ...h })));

function assertCategory(category) {
  if (category !== undefined && !CATEGORIES.includes(category)) {
    throw new RangeError(`Unknown category "${category}". Use one of: ${CATEGORIES.join(", ")}`);
  }
}

/**
 * Filter hooks.
 * @param {{category?: string, dialect?: string, search?: string}} [options]
 */
export function getHooks(options = {}) {
  const { category, dialect, search } = options;
  assertCategory(category);
  const needle = search ? normalize(search) : null;
  return hooks.filter(
    (h) =>
      (!category || h.category === category) &&
      (!dialect || h.dialect === dialect) &&
      (!needle || normalize(h.ar).includes(needle) || h.en.toLowerCase().includes(needle)),
  );
}

/** Get a single hook by its id, e.g. "shock-001". */
export function getHookById(id) {
  return hooks.find((h) => h.id === id);
}

/**
 * Pick a random hook.
 * @param {{category?: string, dialect?: string, random?: () => number}} [options]
 */
export function randomHook(options = {}) {
  const list = getHooks(options);
  if (list.length === 0) return undefined;
  const rnd = options.random ?? Math.random;
  return list[Math.floor(rnd() * list.length) % list.length];
}

/** Fill-in-the-blank hook templates. Placeholders use {curly} names. */
export const templates = Object.freeze([
  { id: "t-days", category: "story", ar: "جرّبت {thing} لمدة {days} يوم… والنتيجة صدمتني.", en: "I tried {thing} for {days} days and the result shocked me." },
  { id: "t-mistake", category: "shock", ar: "غلطة وحدة بـ{topic} كلّفتني {cost}.", en: "One mistake in {topic} cost me {cost}." },
  { id: "t-stop", category: "challenge", ar: "وقف إذا بتعمل {activity}.", en: "Stop if you do {activity}." },
  { id: "t-seconds", category: "promise", ar: "في {seconds} ثانية رح تتعلّم {skill}.", en: "In {seconds} seconds you'll learn {skill}." },
  { id: "t-secret", category: "curiosity", ar: "في سبب خفي بيخلي {thing} {result}… ومحدا بيحكي عنه.", en: "There's a hidden reason {thing} {result}, and nobody talks about it." },
  { id: "t-diff", category: "curiosity", ar: "الفرق بين {bad} و{good}… {small_thing} وحدة.", en: "The difference between {bad} and {good} is one {small_thing}." },
  { id: "t-save", category: "promise", ar: "خليني أوفّر عليك {time} من {pain}.", en: "Let me save you {time} of {pain}." },
  { id: "t-before", category: "shock", ar: "ما تشتري {product} قبل ما تشوف هذا.", en: "Don't buy {product} before you see this." },
  { id: "t-years", category: "story", ar: "قبل {years} سنين كنت {past}. اليوم {now}.", en: "{years} years ago I was {past}. Today {now}." },
  { id: "t-under", category: "challenge", ar: "إذا عندك أقل من {number} {unit}، ما تتخطّى هالفيديو.", en: "Under {number} {unit}? Don't skip this." },
]);

/**
 * Replace {placeholders} in a template string or template object.
 * Missing values throw, so a half-filled hook is never published by accident.
 * @param {string | {ar: string, en: string}} template
 * @param {Record<string, string | number>} values
 * @param {"ar" | "en"} [lang="ar"]
 */
export function fillTemplate(template, values, lang = "ar") {
  const text = typeof template === "string" ? template : template[lang];
  if (typeof text !== "string") throw new TypeError("Template text not found");
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    if (values[key] === undefined || values[key] === null || values[key] === "") {
      throw new Error(`Missing value for {${key}}`);
    }
    return String(values[key]);
  });
}

const ARABIC_DIACRITICS = /[ؗ-ًؚ-ْٰـ]/g;

/** Light Arabic normalization for search: strips tashkeel/tatweel and unifies alef/ya/ta marbuta. */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

const WEAK_OPENERS = [
  /^(مرحبا|مرحباً|أهلا|أهلاً|اهلا|هلا|السلام عليكم|يا جماعة|يا شباب|اليوم رح أحكي|في هذا الفيديو|بهالفيديو)/,
  /^(hi|hey|hello|welcome|in this video|today i('|’)?m going to|so,? today)/i,
];
const YOU_AR = new Set(["انت", "إنت", "أنت", "انتي", "إنتي", "أنتم", "انتو", "إنتو", "إلك", "الك", "إلكم", "لك", "لكم"]);
const YOU_EN = new Set(["you", "your", "you're", "youre", "you’re", "yourself"]);

/** True when the line addresses the viewer (pronoun or Arabic 2nd-person suffix -ك / -كم). */
function addressesViewer(words) {
  return words.some((raw) => {
    const w = raw.replace(/[^\p{L}'’]/gu, "");
    const lower = w.toLowerCase();
    if (YOU_EN.has(lower) || YOU_AR.has(w) || YOU_AR.has(w.replace(/^[وفب]/, ""))) return true;
    return /[؀-ۿ]/.test(w) && w.length >= 4 && /(ك|كم)$/.test(w);
  });
}
const NUMBER = /[0-9٠-٩]/;

/**
 * Score an opening line from 0 to 100 with actionable tips (Arabic and English).
 * Heuristic, transparent and deterministic: it checks length, a weak opener,
 * talking to the viewer, a concrete number, tension (question / ellipsis / contrast).
 * @param {string} text
 */
export function scoreHook(text) {
  const clean = String(text).trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const tips = [];
  let score = 40;

  if (words.length === 0) return { score: 0, words: 0, tips: [{ ar: "الهوك فاضي.", en: "The hook is empty." }] };

  if (words.length <= 12) score += 20;
  else if (words.length <= 18) {
    score += 8;
    tips.push({ ar: "قصّره لـ 12 كلمة أو أقل عشان ينقال بأول 3 ثواني.", en: "Cut it to 12 words or fewer so it fits the first 3 seconds." });
  } else {
    score -= 10;
    tips.push({ ar: "طويل كثير. الهوك جملة وحدة بتنقال بأول 3 ثواني.", en: "Too long. A hook is one line said in the first 3 seconds." });
  }

  if (WEAK_OPENERS.some((r) => r.test(clean))) {
    score -= 30;
    tips.push({ ar: "ابدأ بالفكرة مباشرة، مش بالسلام أو التعريف.", en: "Start with the idea, not a greeting or an introduction." });
  }

  if (addressesViewer(words)) score += 10;
  else tips.push({ ar: "احكي مع المشاهد مباشرة (إنت، عندك، إلك).", en: "Talk to the viewer directly (you, your)." });

  if (NUMBER.test(clean)) score += 15;
  else tips.push({ ar: "حط رقم حقيقي (مدة، نتيجة، عدد) بيعطي مصداقية.", en: "Add a real number (time, result, count) for credibility." });

  const CONTRAST = new Set(["بس", "لكن", "لولا", "بينما", "but", "until", "yet", "instead"]);
  const hasContrast = words.some((w) => CONTRAST.has(w.replace(/[^\p{L}]/gu, "").toLowerCase()));
  if (/[?؟…]|\.\.\./.test(clean) || hasContrast) score += 15;
  else tips.push({ ar: "زيد توتر: سؤال، أو (…) أو مقارنة بتخلي المشاهد يكمّل.", en: "Add tension: a question, an ellipsis or a contrast that makes them stay." });

  return { score: Math.max(0, Math.min(100, score)), words: words.length, tips };
}

export default { hooks, CATEGORIES, CATEGORY_LABELS, DIALECTS, VIDEO_WEIGHTS, templates, getHooks, getHookById, randomHook, fillTemplate, scoreHook, normalize };

// arabic-seo: small, dependency-free helpers for Arabic + English websites.

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin 0-9. */
export function toLatinDigits(text) {
  return String(text).replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

/** Convert Latin digits to Arabic-Indic digits. */
export function toArabicDigits(text) {
  return String(text).replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Remove tashkeel (diacritics) and tatweel (ـ). */
export function stripTashkeel(text) {
  return String(text).replace(TASHKEEL, "").replace(TATWEEL, "");
}

/**
 * Normalize Arabic for search and comparison: no tashkeel/tatweel, unified alef forms,
 * ى → ي, ة → ه, Latin digits, collapsed whitespace, lower-cased Latin.
 */
export function normalizeArabic(text) {
  return toLatinDigits(stripTashkeel(text))
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const TRANSLIT = {
  ا: "a", أ: "a", إ: "e", آ: "a", ٱ: "a", ء: "", ؤ: "o", ئ: "e",
  ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "a", و: "w", ي: "y", ى: "a", پ: "p", چ: "ch", گ: "g", ڤ: "v",
};

/** Rough, readable Arabic → Latin transliteration for slugs (not a scholarly standard). */
export function transliterate(text) {
  return stripTashkeel(text).replace(/[ء-يپچگڤ]/g, (c) => TRANSLIT[c] ?? "");
}

/**
 * Make a URL slug that keeps Arabic readable (browsers show it decoded) or, with
 * `transliterate: true`, converts it to Latin letters.
 * @param {string} text
 * @param {{ transliterate?: boolean, maxLength?: number, separator?: string }} [options]
 */
export function slugify(text, options = {}) {
  const { transliterate: latin = false, maxLength = 80, separator = "-" } = options;
  let s = toLatinDigits(stripTashkeel(String(text)));
  if (latin) s = transliterate(s);
  s = s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, separator)
    .replace(new RegExp(`\\${separator}+`, "g"), separator)
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, "g"), "");
  if (s.length > maxLength) {
    const cut = s.slice(0, maxLength);
    const at = cut.lastIndexOf(separator);
    s = at > maxLength / 2 ? cut.slice(0, at) : cut;
  }
  return s;
}

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-\uFEFF]/;
const LTR_CHAR = /[A-Za-zÀ-ɏ]/;

/** Direction of text by its first strong character: "rtl" or "ltr" (fallback when none). */
export function detectDirection(text, fallback = "ltr") {
  for (const ch of String(text)) {
    if (RTL_CHAR.test(ch)) return "rtl";
    if (LTR_CHAR.test(ch)) return "ltr";
  }
  return fallback;
}

/** Share of letters that are Arabic, from 0 to 1. */
export function arabicRatio(text) {
  let ar = 0;
  let letters = 0;
  for (const ch of String(text)) {
    if (/\p{L}/u.test(ch)) {
      letters++;
      if (/[؀-ۿݐ-ݿࢠ-ࣿ]/.test(ch)) ar++;
    }
  }
  return letters ? ar / letters : 0;
}

/**
 * Trim text to a meta description without cutting a word in half.
 * @param {string} text
 * @param {number} [max=155]
 */
export function metaDescription(text, max = 155) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s،,.؛:;!؟?-]+$/u, "")}…`;
}

/**
 * Estimated reading time in minutes (minimum 1). Arabic is read a little slower
 * than English; defaults are 180 wpm for Arabic and 230 wpm for English.
 */
export function readingTime(text, options = {}) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  const wpm = options.wpm ?? (arabicRatio(text) >= 0.5 ? 180 : 230);
  return Math.max(1, Math.round(words / wpm));
}

/**
 * Build hreflang alternates for one page.
 * @param {Record<string, string>} alternates  e.g. { ar: "https://x.com/ar/a", en: "https://x.com/en/a" }
 * @param {{ xDefault?: string }} [options]  x-default URL, or a locale key from `alternates`
 * @returns {{ rel: "alternate", hreflang: string, href: string }[]}
 */
export function hreflangLinks(alternates, options = {}) {
  const entries = Object.entries(alternates);
  if (entries.length === 0) throw new Error("hreflangLinks needs at least one locale");
  const links = entries.map(([hreflang, href]) => {
    assertAbsoluteUrl(href, hreflang);
    if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(hreflang)) throw new Error(`Invalid hreflang "${hreflang}"`);
    return { rel: "alternate", hreflang, href };
  });
  const { xDefault } = options;
  if (xDefault) {
    const href = alternates[xDefault] ?? xDefault;
    assertAbsoluteUrl(href, "x-default");
    links.push({ rel: "alternate", hreflang: "x-default", href });
  }
  return links;
}

/** hreflang alternates as HTML <link> tags. */
export function hreflangHtml(alternates, options) {
  return hreflangLinks(alternates, options)
    .map((l) => `<link rel="alternate" hreflang="${escapeAttr(l.hreflang)}" href="${escapeAttr(l.href)}" />`)
    .join("\n");
}

function assertAbsoluteUrl(href, label) {
  try {
    const u = new URL(href);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
  } catch {
    throw new Error(`"${label}" must be an absolute http(s) URL, got "${href}"`);
  }
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clean(obj) {
  if (Array.isArray(obj)) return obj.map(clean).filter((v) => v !== undefined);
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const c = clean(v);
      if (c !== undefined && c !== null && c !== "" && !(Array.isArray(c) && c.length === 0)) out[k] = c;
    }
    return out;
  }
  return obj instanceof Date ? obj.toISOString() : obj;
}

/** schema.org Person. */
export function personJsonLd({ name, alternateName, url, image, jobTitle, sameAs, worksFor, email } = {}) {
  if (!name) throw new Error("personJsonLd: name is required");
  return clean({
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    alternateName,
    url,
    image,
    jobTitle,
    email,
    sameAs,
    worksFor: worksFor && (typeof worksFor === "string" ? { "@type": "Organization", name: worksFor } : worksFor),
  });
}

/** schema.org Article / BlogPosting with language and author. */
export function articleJsonLd({ headline, description, url, image, inLanguage, datePublished, dateModified, author, type = "Article" } = {}) {
  if (!headline) throw new Error("articleJsonLd: headline is required");
  return clean({
    "@context": "https://schema.org",
    "@type": type,
    headline: headline.length > 110 ? metaDescription(headline, 110) : headline,
    description,
    url,
    mainEntityOfPage: url,
    image,
    inLanguage: inLanguage ?? (arabicRatio(headline) >= 0.5 ? "ar" : "en"),
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: author && (typeof author === "string" ? { "@type": "Person", name: author } : author),
  });
}

/** schema.org FAQPage from [{ question, answer }]. */
export function faqJsonLd(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("faqJsonLd: pass at least one { question, answer }");
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => {
      if (!question || !answer) throw new Error("faqJsonLd: every item needs question and answer");
      return { "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } };
    }),
  };
}

/** schema.org BreadcrumbList from [{ name, url }]. */
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, url }, i) => clean({ "@type": "ListItem", position: i + 1, name, item: url })),
  };
}

/** schema.org VideoObject (Reels, Shorts, YouTube). */
export function videoJsonLd({ name, description, thumbnailUrl, uploadDate, contentUrl, embedUrl, duration, inLanguage } = {}) {
  if (!name || !thumbnailUrl || !uploadDate) throw new Error("videoJsonLd: name, thumbnailUrl and uploadDate are required");
  return clean({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description: description ?? name,
    thumbnailUrl,
    uploadDate,
    contentUrl,
    embedUrl,
    duration: typeof duration === "number" ? secondsToIsoDuration(duration) : duration,
    inLanguage: inLanguage ?? (arabicRatio(name) >= 0.5 ? "ar" : "en"),
  });
}

/** 95 → "PT1M35S" */
export function secondsToIsoDuration(total) {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${sec || (!h && !m) ? `${sec}S` : ""}`;
}

/**
 * Serialize JSON-LD for a <script> tag safely: escapes "<", ">", "&" and the
 * U+2028/U+2029 separators so page content can never close the tag early.
 */
export function jsonLdString(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Full <script type="application/ld+json"> tag. */
export function jsonLdScript(data) {
  return `<script type="application/ld+json">${jsonLdString(data)}</script>`;
}

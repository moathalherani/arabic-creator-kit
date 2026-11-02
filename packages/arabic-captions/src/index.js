// arabic-captions: turn subtitle files into short, punchy keyword captions for
// Reels / TikTok / Shorts, with correct Arabic + English (bidi) rendering.

const LRI = "\u2066"; // left-to-right isolate
const PDI = "\u2069"; // pop directional isolate
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** "00:01:02,500" | "01:02.5" | "1:02:03.004" → milliseconds */
export function parseTimestamp(ts) {
  const m = String(ts).trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!m) throw new Error(`Invalid timestamp "${ts}"`);
  const [, h = "0", min, s, frac = "0"] = m;
  return ((Number(h) * 60 + Number(min)) * 60 + Number(s)) * 1000 + Number(frac.padEnd(3, "0"));
}

/** milliseconds → "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT) */
export function formatTimestamp(ms, separator = ",") {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const f = t % 1000;
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}${separator}${p(f, 3)}`;
}

/**
 * Parse SRT or WebVTT text into cues. Accepts CRLF, BOM, missing indexes and VTT headers/notes.
 * @returns {{ start: number, end: number, text: string }[]}
 */
export function parseSubtitles(input) {
  const text = String(input).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = text.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i === -1) continue; // WEBVTT header, NOTE, STYLE, stray index
    const [a, b] = lines[i].split("-->");
    const start = parseTimestamp(a);
    const end = parseTimestamp(b.trim().split(/\s+/)[0]);
    const body = lines
      .slice(i + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/\{\\[^}]*\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (body && end > start) cues.push({ start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start);
}

/** Cues → SRT text. */
export function toSrt(cues) {
  return cues.map((c, i) => `${i + 1}\n${formatTimestamp(c.start)} --> ${formatTimestamp(c.end)}\n${c.text}\n`).join("\n");
}

/** Cues → WebVTT text. */
export function toVtt(cues) {
  return `WEBVTT\n\n${cues.map((c) => `${formatTimestamp(c.start, ".")} --> ${formatTimestamp(c.end, ".")}\n${c.text}\n`).join("\n")}`;
}

/** Arabic-Indic / Persian digits → 0-9. Creators usually want Latin digits on screen. */
export function toLatinDigits(text) {
  return String(text).replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

/**
 * Wrap runs of Latin letters and numbers in Unicode directional isolates so a
 * line like "جرّبت iPhone 17 لمدة 30 يوم" keeps its word order in every player.
 * Lines without Arabic are returned unchanged.
 */
export function fixBidi(text) {
  const s = String(text).replace(/[\u2066-\u2069]/g, "");
  if (!/[؀-ۿ]/.test(s)) return s;
  return isolateLatin(s);
}

function isolateLatin(s) {
  return s.replace(/[A-Za-z0-9][A-Za-z0-9 .,:%+\-'’/]*[A-Za-z0-9%]|[A-Za-z0-9]/g, (run) => `${LRI}${run}${PDI}`);
}

const FILLERS_AR = ["يعني", "اممم", "امم", "ااا", "آآآ", "اه", "إيه", "ايه يعني", "طيب يعني", "المهم يعني"];
const FILLERS_EN = ["um", "uh", "uhm", "erm", "like,", "you know,"];

/** Remove spoken fillers (يعني، اممم، um, uh…). Pass your own list to override. */
export function removeFillers(text, fillers = [...FILLERS_AR, ...FILLERS_EN]) {
  let out = ` ${String(text)} `;
  for (const f of [...fillers].sort((a, b) => b.length - a.length)) {
    const esc = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<=[\\s،,.؟?!])${esc}(?=[\\s،,.؟?!])`, "giu"), " ");
  }
  return out
    .replace(/\s+([،,.؟?!])/g, "$1")
    .replace(/([،,])(?:\s*[،,])+/g, "$1").replace(/\s+/g, " ").replace(/^[\s،,]+|[\s،,]+$/g, "").trim();
}

const STOP_AR = new Set(
  ("في من على عن الى إلى و يا هاد هذا هاي هذه هذي اللي الذي التي ان أن إن كان كانت رح راح بس لا ما مش مو هو هي " +
    "انا أنا انت إنت انتي إنتي احنا إحنا نحن كل شو ليش كيف وين مع عند لما اذا إذا لو قد ثم او أو بعد قبل كمان " +
    "كثير شوي عشان لانه لأنه هيك هلق هسا هسه يعني اشي إشي ف وال بال لل عشان حتى لسا لسه انو إنو اني إني").split(" "),
);
const STOP_EN = new Set(
  ("a an the and or but if to of in on at for with from by is are was were be been it this that these those i you " +
    "he she we they me my your our their so just very really what when where why how do does did not no yes can will").split(" "),
);

function bare(word) {
  return word.replace(/[^\p{L}\p{N}%]/gu, "");
}

function isStop(word) {
  const w = bare(word);
  if (!w) return true;
  const lower = w.toLowerCase();
  return STOP_AR.has(w) || STOP_EN.has(lower) || STOP_AR.has(w.replace(/^[وفب]/, ""));
}

/**
 * Pick the word to highlight: numbers first, then Latin words (brand / product names
 * creators say in English), then the longest non-stopword.
 * @returns {number} index into `words`, or -1
 */
export function pickKeyword(words) {
  let best = -1;
  let bestScore = -Infinity;
  words.forEach((word, i) => {
    const w = bare(toLatinDigits(word));
    if (!w || isStop(word)) return;
    let score = w.length;
    if (/\d/.test(w)) score += 100;
    else if (/^[A-Za-z]/.test(w)) score += 50;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/**
 * Split cues into short keyword captions (default 3 words), timing each chunk by its
 * share of characters, converting digits to Latin and marking one keyword per chunk.
 * @param {{start:number,end:number,text:string}[]} cues
 * @param {{ maxWords?: number, minDuration?: number, latinDigits?: boolean, fillers?: boolean | string[] }} [options]
 * @returns {{ start: number, end: number, text: string, words: string[], keyword: number }[]}
 */
export function keywordCaptions(cues, options = {}) {
  const { maxWords = 3, minDuration = 250, latinDigits = true, fillers = true } = options;
  if (!Number.isInteger(maxWords) || maxWords < 1) throw new RangeError("maxWords must be a positive integer");
  const out = [];
  for (const cue of cues) {
    let text = latinDigits ? toLatinDigits(cue.text) : cue.text;
    if (fillers) text = removeFillers(text, Array.isArray(fillers) ? fillers : undefined);
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWords) chunks.push(words.slice(i, i + maxWords));
    // avoid a lonely single word at the end
    if (chunks.length > 1 && chunks.at(-1).length === 1 && chunks.at(-2).length < maxWords + 1) {
      chunks.at(-2).push(...chunks.pop());
    }
    const weights = chunks.map((c) => c.join(" ").length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    const span = cue.end - cue.start;
    let t = cue.start;
    chunks.forEach((chunk, i) => {
      const end = i === chunks.length - 1 ? cue.end : Math.round(t + (span * weights[i]) / total);
      out.push({ start: t, end: Math.max(end, t + Math.min(minDuration, cue.end - t)), text: chunk.join(" "), words: chunk, keyword: pickKeyword(chunk) });
      t = end;
    });
  }
  return out;
}

/** "#7FB069" → ASS "&H0069B07F&" (ASS colors are BGR). */
export function hexToAssColor(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) throw new Error(`Invalid hex color "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => m[1].slice(i, i + 2).toUpperCase());
  return `&H00${b}${g}${r}&`;
}

function assTime(ms) {
  const t = Math.max(0, Math.round(ms / 10));
  const h = Math.floor(t / 360000);
  const m = Math.floor((t % 360000) / 6000);
  const s = Math.floor((t % 6000) / 100);
  const cs = t % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/**
 * Keyword captions → Advanced SubStation (.ass) for burning in with ffmpeg
 * (`ffmpeg -i in.mp4 -vf ass=captions.ass out.mp4`). The keyword is colored.
 * @param {ReturnType<typeof keywordCaptions>} captions
 * @param {{ font?: string, fontSize?: number, color?: string, highlight?: string, width?: number, height?: number, marginV?: number, bidi?: boolean }} [style]
 */
export function toAss(captions, style = {}) {
  const { font = "Changa", fontSize = 84, color = "#FFFFFF", highlight = "#7FB069", width = 1080, height = 1920, marginV = 520, bidi = true } = style;
  const primary = hexToAssColor(color);
  const hi = hexToAssColor(highlight);
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${font},${fontSize},${primary},${primary},&H00000000&,&H64000000&,-1,0,0,0,100,100,0,0,1,4,0,2,60,60,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const events = captions.map((c) => {
    const words = c.words ?? c.text.split(/\s+/);
    const rtlLine = /[\u0600-\u06FF]/.test(words.join(" "));
    const line = words
      .map((w, i) => {
        const safe = w.replace(/[{}\\]/g, "");
        const text = bidi && rtlLine ? isolateLatin(safe) : safe;
        return i === c.keyword ? `{\\c${hi}}${text}{\\c${primary}}` : text;
      })
      .join(" ");
    return `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${line}`;
  });
  return `${header.join("\n")}\n${events.join("\n")}\n`;
}

// arabic-tafqeet: numbers and money amounts in Arabic words (تفقيط),
// the way they are written on invoices, cheques and contracts.

const ONES_M = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
const ONES_F = ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع", "عشر"];
const TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDRED_PREFIX = ["", "", "", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثمان", "تسع"];

/** Scale words: thousand, million, billion (milliard), trillion. */
const SCALES = [
  null,
  { one: "ألف", two: "ألفان", plural: "آلاف", acc: "ألفًا" },
  { one: "مليون", two: "مليونان", plural: "ملايين", acc: "مليونًا" },
  { one: "مليار", two: "ملياران", plural: "مليارات", acc: "مليارًا" },
  { one: "تريليون", two: "تريليونان", plural: "تريليونات", acc: "تريليونًا" },
];

function hundredsWord(h, { construct = false, hundred = "مائة" } = {}) {
  if (h === 0) return "";
  if (h === 1) return hundred;
  if (h === 2) return construct ? `${hundred.slice(0, -1)}تا` : `${hundred.slice(0, -1)}تان`;
  return `${HUNDRED_PREFIX[h]}${hundred}`;
}

function below100(n, gender) {
  const f = gender === "f";
  if (n === 0) return "";
  if (n <= 10) return (f ? ONES_F : ONES_M)[n];
  if (n === 11) return f ? "إحدى عشرة" : "أحد عشر";
  if (n === 12) return f ? "اثنتا عشرة" : "اثنا عشر";
  if (n < 20) return f ? `${ONES_F[n - 10]} عشرة` : `${ONES_M[n - 10]} عشر`;
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return TENS[t];
  const unit = u === 1 ? (f ? "إحدى" : "واحد") : (f ? ONES_F : ONES_M)[u];
  return `${unit} و${TENS[t]}`;
}

function below1000(n, gender, opts) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [hundredsWord(h, opts), below100(r, gender)].filter(Boolean).join(" و");
}

function scaleChunk(n, scale, opts) {
  const s = SCALES[scale];
  if (n === 1) return s.one;
  if (n === 2) return s.two;
  if (n <= 10) return `${ONES_M[n]} ${s.plural}`;
  if (n < 100) return `${below100(n, "m")} ${s.acc}`;
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (r === 0) return `${hundredsWord(h, { ...opts, construct: true })} ${s.one}`;
  if (r === 1) return `${hundredsWord(h, { ...opts, construct: true })} ${s.one} و${s.one}`;
  if (r === 2) return `${hundredsWord(h, { ...opts, construct: true })} ${s.one} و${s.two}`;
  const form = r <= 10 ? s.plural : s.acc;
  return `${hundredsWord(h, opts)} و${below100(r, "m")} ${form}`;
}

function toSafeInteger(value) {
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new TypeError(`Expected a whole number, got ${value}`);
  if (n < 0) throw new RangeError("Negative numbers are not supported; pass the absolute value");
  if (n > Number.MAX_SAFE_INTEGER) throw new RangeError("Number too large");
  return n;
}

/**
 * Write a whole number in Arabic words.
 * @param {number|bigint|string} value 0 … 999,999,999,999,999
 * @param {{ gender?: "m" | "f", hundred?: "مائة" | "مئة" }} [options]
 *   gender: of the thing being counted (درهم masculine, ليرة feminine). Default "m".
 *   hundred: traditional "مائة" (default, common on cheques) or modern "مئة".
 * @example toWords(1500) // "ألف وخمسمائة"
 */
export function toWords(value, options = {}) {
  const n = toSafeInteger(value);
  const gender = options.gender === "f" ? "f" : "m";
  const opts = { hundred: options.hundred === "مئة" ? "مئة" : "مائة" };
  if (n === 0) return "صفر";
  if (n >= 1e15) throw new RangeError("Numbers up to 999 trillion are supported");
  const parts = [];
  let rest = n;
  for (let scale = 4; scale >= 1; scale--) {
    const unit = 1000 ** scale;
    const chunk = Math.floor(rest / unit);
    rest %= unit;
    if (chunk) parts.push(scaleChunk(chunk, scale, opts));
  }
  if (rest) parts.push(below1000(rest, gender, opts));
  return parts.join(" و");
}

/**
 * Currencies: unit and sub-unit with grammatical forms.
 * one = singular, two = dual, plural = 3–10, acc = 11–99 (tamyeez), gender of the noun.
 */
export const CURRENCIES = Object.freeze({
  AED: { name: "درهم إماراتي", digits: 2, unit: { one: "درهم", two: "درهمان", plural: "دراهم", acc: "درهمًا", gender: "m" }, sub: { one: "فلس", two: "فلسان", plural: "فلوس", acc: "فلسًا", gender: "m" } },
  SAR: { name: "ريال سعودي", digits: 2, unit: { one: "ريال", two: "ريالان", plural: "ريالات", acc: "ريالًا", gender: "m" }, sub: { one: "هللة", two: "هللتان", plural: "هللات", acc: "هللة", gender: "f" } },
  QAR: { name: "ريال قطري", digits: 2, unit: { one: "ريال", two: "ريالان", plural: "ريالات", acc: "ريالًا", gender: "m" }, sub: { one: "درهم", two: "درهمان", plural: "دراهم", acc: "درهمًا", gender: "m" } },
  OMR: { name: "ريال عماني", digits: 3, unit: { one: "ريال", two: "ريالان", plural: "ريالات", acc: "ريالًا", gender: "m" }, sub: { one: "بيسة", two: "بيستان", plural: "بيسات", acc: "بيسة", gender: "f" } },
  KWD: { name: "دينار كويتي", digits: 3, unit: { one: "دينار", two: "ديناران", plural: "دنانير", acc: "دينارًا", gender: "m" }, sub: { one: "فلس", two: "فلسان", plural: "فلوس", acc: "فلسًا", gender: "m" } },
  BHD: { name: "دينار بحريني", digits: 3, unit: { one: "دينار", two: "ديناران", plural: "دنانير", acc: "دينارًا", gender: "m" }, sub: { one: "فلس", two: "فلسان", plural: "فلوس", acc: "فلسًا", gender: "m" } },
  JOD: { name: "دينار أردني", digits: 3, unit: { one: "دينار", two: "ديناران", plural: "دنانير", acc: "دينارًا", gender: "m" }, sub: { one: "فلس", two: "فلسان", plural: "فلوس", acc: "فلسًا", gender: "m" } },
  EGP: { name: "جنيه مصري", digits: 2, unit: { one: "جنيه", two: "جنيهان", plural: "جنيهات", acc: "جنيهًا", gender: "m" }, sub: { one: "قرش", two: "قرشان", plural: "قروش", acc: "قرشًا", gender: "m" } },
  USD: { name: "دولار أمريكي", digits: 2, unit: { one: "دولار", two: "دولاران", plural: "دولارات", acc: "دولارًا", gender: "m" }, sub: { one: "سنت", two: "سنتان", plural: "سنتات", acc: "سنتًا", gender: "m" } },
  EUR: { name: "يورو", digits: 2, unit: { one: "يورو", two: "اثنان يورو", plural: "يورو", acc: "يورو", gender: "m" }, sub: { one: "سنت", two: "سنتان", plural: "سنتات", acc: "سنتًا", gender: "m" } },
  LBP: { name: "ليرة لبنانية", digits: 0, unit: { one: "ليرة", two: "ليرتان", plural: "ليرات", acc: "ليرة", gender: "f" } },
});

/**
 * Count a noun in Arabic: number words + the right form of the noun.
 * @param {number} value whole number
 * @param {{ one: string, two: string, plural: string, acc: string, gender?: "m" | "f" }} noun
 * @example countNoun(3, { one: "سيارة", two: "سيارتان", plural: "سيارات", acc: "سيارة", gender: "f" }) // "ثلاث سيارات"
 */
export function countNoun(value, noun, options = {}) {
  const n = toSafeInteger(value);
  const gender = noun.gender === "f" ? "f" : "m";
  if (n === 0) return `صفر ${noun.one}`;
  if (n === 1) return `${noun.one} ${gender === "f" ? "واحدة" : "واحد"}`;
  if (n === 2) return noun.two;
  const r = n % 100;
  const form = r >= 3 && r <= 10 ? noun.plural : r >= 11 ? noun.acc : noun.one;
  return `${toWords(n, { ...options, gender })} ${form}`;
}

function splitAmount(value, digits) {
  const str = typeof value === "string" ? value.replace(/[,\s٬]/g, "") : String(value);
  if (!/^\d+(\.\d+)?$/.test(str)) throw new TypeError(`Invalid amount "${value}"`);
  const [intPart, frac = ""] = str.split(".");
  if (digits === 0) return [BigInt(intPart) + (frac[0] >= "5" ? 1n : 0n), 0n];
  // round half up on the string, no floating point errors
  const scaled = BigInt(intPart + frac.padEnd(digits + 1, "0").slice(0, digits + 1));
  const rounded = (scaled + 5n) / 10n;
  const base = 10n ** BigInt(digits);
  return [rounded / base, rounded % base];
}

/**
 * Write a money amount in Arabic words.
 * @param {number|string} value e.g. 1500, "25.5", "1,250.75"
 * @param {{ currency?: keyof typeof CURRENCIES, only?: boolean, hundred?: "مائة" | "مئة" }} [options]
 *   only: wrap as «فقط … لا غير» like on cheques (default false)
 * @example amountToWords(25.5, { currency: "AED" }) // "خمسة وعشرون درهمًا وخمسون فلسًا"
 */
export function amountToWords(value, options = {}) {
  const code = (options.currency ?? "AED").toUpperCase();
  const cur = CURRENCIES[code];
  if (!cur) throw new RangeError(`Unknown currency ${code}. Supported: ${Object.keys(CURRENCIES).join(", ")}`);
  const [whole, part] = splitAmount(value, cur.digits);
  const opts = { hundred: options.hundred };
  const pieces = [];
  if (whole > 0n || part === 0n) pieces.push(countNoun(Number(whole), cur.unit, opts));
  if (part > 0n) pieces.push(countNoun(Number(part), cur.sub, opts));
  const text = pieces.join(" و");
  return options.only ? `فقط ${text} لا غير` : text;
}

/** Ordinal numbers 1–10 (الأول، الثاني …) for steps and rankings. */
export function ordinal(n, gender = "m") {
  const M = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
  const F = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"];
  const i = toSafeInteger(n);
  if (i < 1 || i > 10) throw new RangeError("ordinal supports 1 to 10");
  return (gender === "f" ? F : M)[i];
}

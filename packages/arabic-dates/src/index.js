// arabic-dates: Arabic dates for content and apps: month names per region,
// Hijri (Umm al-Qura) dates, upcoming Islamic occasions and "منذ 3 أيام" relative time.

/** Gregorian month names by region. */
export const MONTHS = Object.freeze({
  // Egypt, Gulf, Sudan, Libya, Yemen and most media
  standard: Object.freeze(["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]),
  // Jordan, Palestine, Syria, Lebanon, Iraq
  levant: Object.freeze(["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"]),
  // Algeria, Tunisia
  maghreb: Object.freeze(["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]),
});

export const HIJRI_MONTHS = Object.freeze(["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"]);

export const WEEKDAYS = Object.freeze(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]);

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const digitsOut = (n, arabicDigits) => (arabicDigits ? String(n).replace(/\d/g, (d) => ARABIC_INDIC[d]) : String(n));

function toDate(d) {
  const date = d instanceof Date ? new Date(d.getTime()) : new Date(d);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid date: ${d}`);
  return date;
}

/**
 * Format a Gregorian date in Arabic.
 * @param {Date|string|number} date
 * @param {{ months?: "standard" | "levant" | "maghreb" | "both", weekday?: boolean, arabicDigits?: boolean, timeZone?: string }} [options]
 *   months "both" gives «تشرين الثاني (نوفمبر)». Default timeZone is UTC so output is stable on servers.
 * @example formatDate("2026-11-02", { months: "levant", weekday: true }) // "الاثنين 2 تشرين الثاني 2026"
 */
export function formatDate(date, options = {}) {
  const { months = "standard", weekday = false, arabicDigits = false, timeZone = "UTC" } = options;
  const p = partsIn(toDate(date), timeZone);
  const monthName =
    months === "both" ? `${MONTHS.levant[p.month - 1]} (${MONTHS.standard[p.month - 1]})` : (MONTHS[months] ?? MONTHS.standard)[p.month - 1];
  const text = `${digitsOut(p.day, arabicDigits)} ${monthName} ${digitsOut(p.year, arabicDigits)}`;
  return weekday ? `${WEEKDAYS[p.weekday]} ${text}` : text;
}

function partsIn(date, timeZone) {
  const f = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", { timeZone, year: "numeric", month: "numeric", day: "numeric", weekday: "short" });
  const parts = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), weekday };
}

const HIJRI_FMT = new Map();
function hijriFormatter(timeZone) {
  if (!HIJRI_FMT.has(timeZone)) {
    HIJRI_FMT.set(
      timeZone,
      new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", { timeZone, year: "numeric", month: "numeric", day: "numeric" }),
    );
  }
  return HIJRI_FMT.get(timeZone);
}

/**
 * Convert a Gregorian date to Hijri using the Umm al-Qura calendar (Saudi Arabia's official calendar).
 * Actual observance of months like Ramadan can differ by a day per country (moon sighting).
 * @returns {{ year: number, month: number, day: number, monthName: string }}
 */
export function toHijri(date, options = {}) {
  const { timeZone = "UTC" } = options;
  const parts = Object.fromEntries(hijriFormatter(timeZone).formatToParts(toDate(date)).map((x) => [x.type, x.value]));
  const year = Number(parts.year ?? parts.relatedYear);
  const month = Number(parts.month);
  const day = Number(parts.day);
  if (!year || !month || !day) throw new Error("This JavaScript runtime has no Islamic calendar support (needs full ICU)");
  return { year, month, day, monthName: HIJRI_MONTHS[month - 1] };
}

/**
 * Format a Hijri date in Arabic, e.g. "11 جمادى الأولى 1448 هـ".
 * @param {Date|string|number} date
 * @param {{ arabicDigits?: boolean, suffix?: boolean, timeZone?: string }} [options]
 */
export function formatHijri(date, options = {}) {
  const { arabicDigits = false, suffix = true } = options;
  const h = toHijri(date, options);
  return `${digitsOut(h.day, arabicDigits)} ${h.monthName} ${digitsOut(h.year, arabicDigits)}${suffix ? " هـ" : ""}`;
}

/**
 * Convert a Hijri (Umm al-Qura) date to a Gregorian Date at 00:00 UTC.
 * @param {number} year Hijri year (≈1300–1600 supported by the calendar data)
 * @param {number} month 1–12
 * @param {number} day 1–30
 */
export function fromHijri(year, month, day) {
  if (![year, month, day].every(Number.isInteger) || month < 1 || month > 12 || day < 1 || day > 30) {
    throw new RangeError("Invalid Hijri date");
  }
  // first estimate from the mean lunar year, then walk to the exact day
  const approx = Date.UTC(622, 6, 16) + ((year - 1) * 354.36707 + (month - 1) * 29.530589 + (day - 1)) * 86400000;
  const target = year * 10000 + month * 100 + day;
  let t = Math.round(approx / 86400000) * 86400000;
  let dir = 0;
  for (let i = 0; i < 120; i++) {
    const h = toHijri(new Date(t));
    const cur = h.year * 10000 + h.month * 100 + h.day;
    if (cur === target) return new Date(t);
    const step = cur < target ? 1 : -1;
    if (dir && step !== dir) break; // jumped over the target: that day does not exist
    dir = step;
    t += step * 86400000;
  }
  throw new RangeError(`Hijri date ${year}-${month}-${day} does not exist in the Umm al-Qura calendar`);
}

/**
 * Expected dates of the main Islamic occasions that start in a Gregorian year,
 * based on Umm al-Qura. Treat them as planning dates: official dates depend on
 * moon sighting and can shift by a day per country.
 * @param {number} gregorianYear
 * @returns {{ key: string, ar: string, en: string, date: Date, hijri: string }[]}
 */
export function islamicOccasions(gregorianYear) {
  const defs = [
    { key: "hijri-new-year", ar: "رأس السنة الهجرية", en: "Islamic New Year", m: 1, d: 1 },
    { key: "mawlid", ar: "المولد النبوي", en: "Mawlid", m: 3, d: 12 },
    { key: "isra-miraj", ar: "الإسراء والمعراج", en: "Isra and Mi'raj", m: 7, d: 27 },
    { key: "ramadan", ar: "بداية رمضان", en: "Ramadan begins", m: 9, d: 1 },
    { key: "eid-al-fitr", ar: "عيد الفطر", en: "Eid al-Fitr", m: 10, d: 1 },
    { key: "arafah", ar: "يوم عرفة", en: "Day of Arafah", m: 12, d: 9 },
    { key: "eid-al-adha", ar: "عيد الأضحى", en: "Eid al-Adha", m: 12, d: 10 },
  ];
  const startHijri = toHijri(new Date(Date.UTC(gregorianYear, 0, 1))).year;
  const out = [];
  for (const hy of [startHijri, startHijri + 1]) {
    for (const def of defs) {
      const date = fromHijri(hy, def.m, def.d);
      if (date.getUTCFullYear() === gregorianYear) {
        out.push({ key: def.key, ar: def.ar, en: def.en, date, hijri: `${def.d} ${HIJRI_MONTHS[def.m - 1]} ${hy} هـ` });
      }
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

const UNITS = {
  second: { one: "ثانية", two: "ثانيتين", plural: "ثوانٍ", acc: "ثانية" },
  minute: { one: "دقيقة", two: "دقيقتين", plural: "دقائق", acc: "دقيقة" },
  hour: { one: "ساعة", two: "ساعتين", plural: "ساعات", acc: "ساعة" },
  day: { one: "يوم", two: "يومين", plural: "أيام", acc: "يومًا" },
  week: { one: "أسبوع", two: "أسبوعين", plural: "أسابيع", acc: "أسبوعًا" },
  month: { one: "شهر", two: "شهرين", plural: "أشهر", acc: "شهرًا" },
  year: { one: "سنة", two: "سنتين", plural: "سنوات", acc: "سنة" },
};

function phrase(n, unit, arabicDigits) {
  const u = UNITS[unit];
  if (n === 1) return u.one;
  if (n === 2) return u.two;
  const r = n % 100;
  const form = r >= 3 && r <= 10 ? u.plural : r >= 11 ? u.acc : u.one;
  return `${digitsOut(n, arabicDigits)} ${form}`;
}

/**
 * Relative time in Arabic: «منذ 3 أيام», «بعد ساعتين», or Levantine «قبل 3 أيام», «مبارح».
 * @param {Date|string|number} date
 * @param {{ now?: Date|string|number, style?: "msa" | "levant", arabicDigits?: boolean }} [options]
 */
export function timeAgo(date, options = {}) {
  const { now = Date.now(), style = "msa", arabicDigits = false } = options;
  const diff = Math.round((toDate(now).getTime() - toDate(date).getTime()) / 1000);
  const past = diff >= 0;
  const s = Math.abs(diff);
  const lev = style === "levant";
  if (s < 45) return lev ? "هلأ" : "الآن";
  const steps = [
    ["minute", 60, 45 * 60],
    ["hour", 3600, 22 * 3600],
    ["day", 86400, 6.5 * 86400],
    ["week", 7 * 86400, 26 * 86400],
    ["month", 30.44 * 86400, 330 * 86400],
    ["year", 365.25 * 86400, Infinity],
  ];
  for (const [unit, size, limit] of steps) {
    if (s < limit) {
      const n = Math.max(1, Math.round(s / size));
      if (unit === "day" && n === 1) return past ? (lev ? "مبارح" : "أمس") : lev ? "بكرا" : "غدًا";
      const pre = past ? (lev ? "قبل" : "منذ") : "بعد";
      return `${pre} ${phrase(n, unit, arabicDigits)}`;
    }
  }
  return "";
}

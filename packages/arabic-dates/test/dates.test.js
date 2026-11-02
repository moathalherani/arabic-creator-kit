import { test } from "node:test";
import assert from "node:assert/strict";
import { MONTHS, formatDate, toHijri, formatHijri, fromHijri, islamicOccasions, timeAgo } from "../src/index.js";

test("month tables are complete", () => {
  for (const list of Object.values(MONTHS)) assert.equal(list.length, 12);
});

test("formatDate by region", () => {
  assert.equal(formatDate("2026-11-02", { months: "levant", weekday: true }), "الاثنين 2 تشرين الثاني 2026");
  assert.equal(formatDate("2026-11-02"), "2 نوفمبر 2026");
  assert.equal(formatDate("2026-11-02", { months: "both" }), "2 تشرين الثاني (نوفمبر) 2026");
  assert.equal(formatDate("2026-08-15", { months: "maghreb" }), "15 أوت 2026");
  assert.equal(formatDate("2026-11-02", { arabicDigits: true }), "٢ نوفمبر ٢٠٢٦");
  assert.equal(formatDate("2026-11-01T22:30:00Z", { timeZone: "Asia/Dubai" }), "2 نوفمبر 2026");
  assert.throws(() => formatDate("not a date"), TypeError);
});

test("Hijri conversion (Umm al-Qura)", () => {
  assert.deepEqual(toHijri("2026-02-18"), { year: 1447, month: 9, day: 1, monthName: "رمضان" });
  assert.deepEqual(toHijri("2026-06-16"), { year: 1448, month: 1, day: 1, monthName: "محرم" });
  assert.equal(formatHijri("2026-11-02"), "22 جمادى الأولى 1448 هـ");
  assert.equal(formatHijri("2026-11-02", { arabicDigits: true, suffix: false }), "٢٢ جمادى الأولى ١٤٤٨");
  assert.equal(fromHijri(1447, 9, 1).toISOString().slice(0, 10), "2026-02-18");
  assert.equal(fromHijri(1448, 1, 1).toISOString().slice(0, 10), "2026-06-16");
});

test("fromHijri round trips and rejects missing days", () => {
  for (let m = 1; m <= 12; m++) {
    const d = fromHijri(1448, m, 15);
    assert.deepEqual([toHijri(d).year, toHijri(d).month, toHijri(d).day], [1448, m, 15]);
  }
  let missing = 0;
  for (let m = 1; m <= 12; m++) {
    try {
      fromHijri(1448, m, 30);
    } catch {
      missing++;
    }
  }
  assert.ok(missing >= 4 && missing <= 8, `29-day months in 1448: ${missing}`);
  assert.throws(() => fromHijri(1448, 13, 1), RangeError);
});

test("islamic occasions", () => {
  const list = islamicOccasions(2027);
  const ramadan = list.find((o) => o.key === "ramadan");
  assert.equal(ramadan.date.toISOString().slice(0, 10), "2027-02-08");
  assert.equal(ramadan.hijri, "1 رمضان 1448 هـ");
  for (let i = 1; i < list.length; i++) assert.ok(list[i].date >= list[i - 1].date);
  for (const o of list) assert.equal(o.date.getUTCFullYear(), 2027);
});

test("timeAgo with dual and plural forms", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  const ago = (s) => new Date(now - s * 1000);
  const t = (s, style) => timeAgo(ago(s), { now, style });
  assert.equal(t(10), "الآن");
  assert.equal(t(10, "levant"), "هلأ");
  assert.equal(t(60), "منذ دقيقة");
  assert.equal(t(120), "منذ دقيقتين");
  assert.equal(t(300), "منذ 5 دقائق");
  assert.equal(t(11 * 60), "منذ 11 دقيقة");
  assert.equal(t(7200), "منذ ساعتين");
  assert.equal(t(26 * 3600), "أمس");
  assert.equal(t(26 * 3600, "levant"), "مبارح");
  assert.equal(t(3 * 86400), "منذ 3 أيام");
  assert.equal(t(3 * 86400, "levant"), "قبل 3 أيام");
  assert.equal(t(14 * 86400), "منذ أسبوعين");
  assert.equal(t(800 * 86400), "منذ سنتين");
  assert.equal(t(-7200), "بعد ساعتين");
  assert.equal(t(-26 * 3600), "غدًا");
  assert.equal(timeAgo(ago(300), { now, arabicDigits: true }), "منذ ٥ دقائق");
});

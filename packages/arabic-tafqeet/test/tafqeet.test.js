import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { toWords, amountToWords, countNoun, ordinal, CURRENCIES } from "../src/index.js";

const cases = {
  0: "صفر",
  1: "واحد",
  11: "أحد عشر",
  12: "اثنا عشر",
  15: "خمسة عشر",
  21: "واحد وعشرون",
  100: "مائة",
  200: "مائتان",
  305: "ثلاثمائة وخمسة",
  800: "ثمانمائة",
  1000: "ألف",
  1500: "ألف وخمسمائة",
  2000: "ألفان",
  3000: "ثلاثة آلاف",
  11000: "أحد عشر ألفًا",
  100000: "مائة ألف",
  101000: "مائة ألف وألف",
  105000: "مائة وخمسة آلاف",
  200000: "مائتا ألف",
  250000: "مائتان وخمسون ألفًا",
  1000000: "مليون",
  2500000: "مليونان وخمسمائة ألف",
  3000000: "ثلاثة ملايين",
  11000000: "أحد عشر مليونًا",
  1234567890: "مليار ومائتان وأربعة وثلاثون مليونًا وخمسمائة وسبعة وستون ألفًا وثمانمائة وتسعون",
};

test("whole numbers", () => {
  for (const [n, words] of Object.entries(cases)) assert.equal(toWords(Number(n)), words, n);
});

test("feminine counting", () => {
  assert.equal(toWords(1, { gender: "f" }), "واحدة");
  assert.equal(toWords(8, { gender: "f" }), "ثماني");
  assert.equal(toWords(11, { gender: "f" }), "إحدى عشرة");
  assert.equal(toWords(12, { gender: "f" }), "اثنتا عشرة");
  assert.equal(toWords(18, { gender: "f" }), "ثماني عشرة");
  assert.equal(toWords(21, { gender: "f" }), "إحدى وعشرون");
});

test("modern hundred spelling", () => {
  assert.equal(toWords(200, { hundred: "مئة" }), "مئتان");
  assert.equal(toWords(200000, { hundred: "مئة" }), "مئتا ألف");
  assert.equal(toWords(300, { hundred: "مئة" }), "ثلاثمئة");
});

test("invalid input", () => {
  assert.throws(() => toWords(-1), RangeError);
  assert.throws(() => toWords(1.5), TypeError);
  assert.throws(() => toWords(1e15), RangeError);
  assert.throws(() => amountToWords("abc"), TypeError);
  assert.throws(() => amountToWords(1, { currency: "XYZ" }), /Unknown currency/);
});

test("money amounts", () => {
  assert.equal(amountToWords(1), "درهم واحد");
  assert.equal(amountToWords(2), "درهمان");
  assert.equal(amountToWords(3), "ثلاثة دراهم");
  assert.equal(amountToWords(11), "أحد عشر درهمًا");
  assert.equal(amountToWords(1500), "ألف وخمسمائة درهم");
  assert.equal(amountToWords(25.5), "خمسة وعشرون درهمًا وخمسون فلسًا");
  assert.equal(amountToWords("1,250.75"), "ألف ومائتان وخمسون درهمًا وخمسة وسبعون فلسًا");
  assert.equal(amountToWords(0.5), "خمسون فلسًا");
  assert.equal(amountToWords(0), "صفر درهم");
  assert.equal(amountToWords(1.005), "درهم واحد وفلس واحد", "rounds half up without float errors");
  assert.equal(amountToWords(0.75, { currency: "SAR" }), "خمس وسبعون هللة");
  assert.equal(amountToWords(103.003, { currency: "jod" }), "مائة وثلاثة دنانير وثلاثة فلوس");
  assert.equal(amountToWords(2.02, { currency: "USD" }), "دولاران وسنتان");
  assert.equal(amountToWords(1500, { only: true }), "فقط ألف وخمسمائة درهم لا غير");
  for (const code of Object.keys(CURRENCIES)) assert.ok(amountToWords(1234.5, { currency: code }).length > 5, code);
});

test("countNoun and ordinals", () => {
  const car = { one: "سيارة", two: "سيارتان", plural: "سيارات", acc: "سيارة", gender: "f" };
  assert.equal(countNoun(1, car), "سيارة واحدة");
  assert.equal(countNoun(3, car), "ثلاث سيارات");
  assert.equal(countNoun(15, car), "خمس عشرة سيارة");
  assert.equal(countNoun(100, car), "مائة سيارة");
  assert.equal(ordinal(3), "الثالث");
  assert.equal(ordinal(3, "f"), "الثالثة");
  assert.throws(() => ordinal(11));
});

test("CLI", () => {
  const cli = fileURLToPath(new URL("../src/cli.js", import.meta.url));
  const run = (...a) => execFileSync(process.execPath, [cli, ...a], { encoding: "utf8" }).trim();
  assert.equal(run("1500"), "ألف وخمسمائة درهم");
  assert.equal(run("25.50", "--currency", "SAR"), "خمسة وعشرون ريالًا وخمسون هللة");
  assert.equal(run("21", "--plain", "--f"), "إحدى وعشرون");
});

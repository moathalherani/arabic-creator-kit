import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toLatinDigits,
  toArabicDigits,
  stripTashkeel,
  normalizeArabic,
  slugify,
  transliterate,
  detectDirection,
  arabicRatio,
  metaDescription,
  readingTime,
  hreflangLinks,
  hreflangHtml,
  personJsonLd,
  articleJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
  videoJsonLd,
  secondsToIsoDuration,
  jsonLdString,
  jsonLdScript,
} from "../src/index.js";

test("digits", () => {
  assert.equal(toLatinDigits("سعر ٢٠٢٦ و۴۵"), "سعر 2026 و45");
  assert.equal(toArabicDigits("BYD 2026"), "BYD ٢٠٢٦");
});

test("tashkeel and normalization", () => {
  assert.equal(stripTashkeel("مُهَنْدِسٌ ـــ"), "مهندس ");
  assert.equal(normalizeArabic("  إِنَّ المكتبةَ  أكبرُ "), "ان المكتبه اكبر");
});

test("slugify keeps Arabic readable", () => {
  assert.equal(slugify("دليل تطبيقات BYD الكامل ٢٠٢٦!"), "دليل-تطبيقات-byd-الكامل-2026");
  assert.equal(slugify("  مَرْحَباً   بالعالم  "), "مرحبا-بالعالم");
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("Crème brûlée"), "creme-brulee");
  assert.equal(slugify("a b c", { separator: "_" }), "a_b_c");
});

test("slugify transliterates and truncates on a word", () => {
  assert.equal(slugify("سيارات كهربائية", { transliterate: true }), "syarat-khrbaeya");
  assert.match(transliterate("شمس"), /^shms$/);
  const long = slugify("كلمة ".repeat(40), { maxLength: 30 });
  assert.ok(long.length <= 30);
  assert.ok(!long.endsWith("-"));
});

test("direction and ratio", () => {
  assert.equal(detectDirection("  123 مرحبا hello"), "rtl");
  assert.equal(detectDirection("BYD سيارة"), "ltr");
  assert.equal(detectDirection("123", "rtl"), "rtl");
  assert.equal(arabicRatio("abc"), 0);
  assert.equal(arabicRatio("سلام"), 1);
});

test("meta description never cuts a word", () => {
  const text = "هذا نص طويل ".repeat(30);
  const d = metaDescription(text, 60);
  assert.ok(d.length <= 60, d);
  assert.ok(d.endsWith("…"));
  assert.ok(!d.includes("  "));
  assert.equal(metaDescription("short"), "short");
});

test("reading time", () => {
  assert.equal(readingTime("كلمة ".repeat(360)), 2);
  assert.equal(readingTime("word ".repeat(460)), 2);
  assert.equal(readingTime("one"), 1);
});

test("hreflang", () => {
  const links = hreflangLinks({ ar: "https://x.com/ar/a", en: "https://x.com/en/a" }, { xDefault: "ar" });
  assert.equal(links.length, 3);
  assert.deepEqual(links[2], { rel: "alternate", hreflang: "x-default", href: "https://x.com/ar/a" });
  assert.throws(() => hreflangLinks({ ar: "/ar/a" }), /absolute/);
  assert.throws(() => hreflangLinks({ arabic: "https://x.com" }), /Invalid hreflang/);
  assert.throws(() => hreflangLinks({}), /at least one/);
  assert.ok(hreflangLinks({ "ar-AE": "https://x.com/ae" }));
  assert.match(hreflangHtml({ en: "https://x.com/?a=1&b=2" }), /href="https:\/\/x.com\/\?a=1&amp;b=2"/);
});

test("JSON-LD builders drop empty fields", () => {
  const p = personJsonLd({ name: "Moath Alherani", alternateName: "معاذ الهريني", sameAs: [], worksFor: "Atwaar" });
  assert.equal(p["@type"], "Person");
  assert.equal(p.sameAs, undefined);
  assert.deepEqual(p.worksFor, { "@type": "Organization", name: "Atwaar" });
  assert.throws(() => personJsonLd({}), /name/);

  const a = articleJsonLd({ headline: "دليل الهوكس", datePublished: new Date("2026-11-02T00:00:00Z"), author: "Moath" });
  assert.equal(a.inLanguage, "ar");
  assert.equal(a.dateModified, "2026-11-02T00:00:00.000Z");

  const f = faqJsonLd([{ question: "شو هو الهوك؟", answer: "أول جملة بالفيديو." }]);
  assert.equal(f.mainEntity[0].acceptedAnswer.text, "أول جملة بالفيديو.");
  assert.throws(() => faqJsonLd([{ question: "x" }]), /answer/);

  const b = breadcrumbJsonLd([{ name: "الرئيسية", url: "https://x.com" }, { name: "المقال" }]);
  assert.equal(b.itemListElement[1].position, 2);
  assert.equal(b.itemListElement[1].item, undefined);

  const v = videoJsonLd({ name: "Hook test", thumbnailUrl: "https://x.com/t.jpg", uploadDate: "2026-11-02", duration: 95 });
  assert.equal(v.duration, "PT1M35S");
  assert.equal(v.inLanguage, "en");
});

test("ISO durations", () => {
  assert.equal(secondsToIsoDuration(0), "PT0S");
  assert.equal(secondsToIsoDuration(60), "PT1M");
  assert.equal(secondsToIsoDuration(3725), "PT1H2M5S");
});

test("JSON-LD serialization cannot break out of the script tag", () => {
  const evil = { name: "</script><script>alert(1)</script> & \u2028" };
  const s = jsonLdString(evil);
  assert.ok(!s.includes("<") && !s.includes(">") && !s.includes("&"));
  assert.deepEqual(JSON.parse(s), evil);
  assert.ok(jsonLdScript(evil).startsWith('<script type="application/ld+json">{'));
  assert.equal(jsonLdScript(evil).match(/<\/script>/g).length, 1);
});

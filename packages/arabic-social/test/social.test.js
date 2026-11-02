import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORMS,
  hashtag,
  hashtags,
  hashtagKey,
  extractHashtags,
  extractMentions,
  countCharacters,
  xLength,
  previewText,
  checkPost,
  cleanCaption,
  keepLineBreaks,
} from "../src/index.js";

test("hashtag builds Arabic tags", () => {
  assert.equal(hashtag("سيارات كهربائية!"), "#سيارات_كهربائية");
  assert.equal(hashtag("  #دبي  "), "#دبي");
  assert.equal(hashtag("صُنّاع المحتوى ٢٠٢٦"), "#صناع_المحتوى_2026");
  assert.equal(hashtag("BYD Seal"), "#BYD_Seal");
  assert.throws(() => hashtag("2026"));
  assert.throws(() => hashtag("!!!"));
});

test("hashtags de-duplicate across spellings and cap by platform", () => {
  const list = hashtags(["دبي", "#دبى", "سيارة كهربائية", "سياره كهربائيه", "BYD", "byd", "ريلز", "محتوى", "تقنية", "عقارات"]);
  assert.deepEqual(list, ["#دبي", "#سيارة_كهربائية", "#BYD", "#ريلز", "#محتوى"]);
  assert.equal(hashtags(["a", "b", "c"], { max: 2 }).length, 2);
  assert.equal(hashtagKey("#إمارات"), hashtagKey("امارات"));
});

test("extract hashtags and mentions", () => {
  const text = "جرّبت #BYD_Seal مع @moathalherani و #سيارات_كهربائية, email a@b.com &#123; #2026";
  assert.deepEqual(extractHashtags(text), ["#BYD_Seal", "#سيارات_كهربائية"]);
  assert.deepEqual(extractMentions(text), ["@moathalherani"]);
});

test("character counts", () => {
  assert.equal(countCharacters("مرحبا"), 5);
  assert.equal(countCharacters("👍🏽"), 1);
  assert.equal(xLength("مرحبا"), 5, "Arabic counts 1 on X");
  assert.equal(xLength("👍"), 2);
  assert.equal(xLength("شوف https://moathalherani.com/ar/moath-os/very/long/path"), 4 + 23);
  assert.equal(xLength("日本"), 4);
});

test("preview text cuts at the first line and on a word", () => {
  assert.equal(previewText("سطر أول\nسطر ثاني"), "سطر أول");
  const long = "كلمة ".repeat(60);
  const p = previewText(long, 50);
  assert.ok(p.endsWith("…"));
  assert.ok(countCharacters(p) <= 51);
});

test("checkPost per platform", () => {
  const ok = checkPost("هوك قوي\nوهاد الكابشن #دبي", "instagram");
  assert.equal(ok.ok, true);
  assert.equal(ok.preview, "هوك قوي");
  assert.equal(ok.limit, PLATFORMS.instagram.caption);

  const tooMany = checkPost("#a #b #c #d #e #f", "instagram");
  assert.equal(tooMany.ok, false);
  assert.match(tooMany.problems[0].en, /5 hashtags/);

  const x = checkPost("ا".repeat(281), "x");
  assert.equal(x.ok, false);
  assert.equal(x.remaining, -1);

  const hidden = checkPost("نص\u200Bفيه رمز", "linkedin");
  assert.equal(hidden.ok, false);
  assert.match(hidden.problems[0].en, /Hidden/);
  assert.equal(checkPost("نص عادي", "linkedin").ok, true, "regex state does not leak between calls");
  assert.throws(() => checkPost("x", "myspace"), RangeError);
});

test("cleanCaption and keepLineBreaks", () => {
  assert.equal(cleanCaption("\uFEFFسطر\u200B أول   \r\n\r\n\r\n\r\nسطر\u202Eثاني  "), "سطر أول\n\nسطرثاني");
  assert.equal(keepLineBreaks("أول\n\nثاني"), "أول\n\u2800\nثاني");
  assert.equal(cleanCaption("می\u200Cخواهم"), "می\u200Cخواهم", "keeps ZWNJ");
});

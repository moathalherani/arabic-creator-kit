import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hooks,
  CATEGORIES,
  DIALECTS,
  getHooks,
  getHookById,
  randomHook,
  templates,
  fillTemplate,
  scoreHook,
  normalize,
  VIDEO_WEIGHTS,
  ctas,
  getCtas,
  CTA_INTENTS,
} from "../src/index.js";

test("templates and CTAs are well formed", () => {
  assert.ok(templates.length >= 30);
  const ids = new Set();
  for (const t of [...templates, ...ctas]) {
    assert.ok(!ids.has(t.id), `duplicate ${t.id}`);
    ids.add(t.id);
    const ar = [...t.ar.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const en = [...t.en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(ar, en, `${t.id} placeholders must match`);
  }
  for (const i of CTA_INTENTS) assert.ok(getCtas({ intent: i }).length > 0, i);
  assert.throws(() => getCtas({ intent: "buy" }), RangeError);
  assert.equal(fillTemplate(getCtas({ intent: "comment" })[0], { keyword: "دليل", gift: "الملف" }), "اكتب «دليل» بالتعليقات وببعتلك الملف.");
});

test("dataset is well formed", () => {
  assert.ok(hooks.length >= 50);
  const ids = new Set();
  for (const h of hooks) {
    assert.ok(CATEGORIES.includes(h.category), h.id);
    assert.match(h.id, /^[a-z]+(-[a-z]+)?-\d{3}$/);
    assert.ok(!ids.has(h.id), `duplicate id ${h.id}`);
    ids.add(h.id);
    assert.ok(h.ar.trim(), h.id);
    assert.equal(typeof h.en, "string", `${h.id} en must be a string (it may be empty for community hooks)`);
    assert.ok(Object.hasOwn(DIALECTS, h.dialect), `${h.id} unknown dialect ${h.dialect}`);
    assert.match(h.ar, /[؀-ۿ]/, `${h.id} ar text must be Arabic`);
    assert.ok(h.dialect, h.id);
  }
});

test("every category has hooks", () => {
  for (const c of CATEGORIES) assert.ok(getHooks({ category: c }).length > 0, c);
});

test("filters and lookup", () => {
  assert.equal(getHookById("shock-001").category, "shock");
  assert.equal(getHookById("nope"), undefined);
  assert.throws(() => getHooks({ category: "bogus" }), RangeError);
  assert.ok(getHooks({ search: "الخوارزميه" }).length >= 1, "search ignores ta marbuta");
  assert.ok(getHooks({ search: "algorithm" }).length >= 1);
});

test("randomHook is deterministic with an injected random", () => {
  const first = randomHook({ random: () => 0 });
  assert.equal(first, hooks[0]);
  const lastStory = randomHook({ category: "story", random: () => 0.9999 });
  assert.equal(lastStory.category, "story");
  assert.equal(randomHook({ dialect: "zz" }), undefined);
});

test("templates fill and refuse missing values", () => {
  const t = templates.find((x) => x.id === "t-days");
  assert.equal(fillTemplate(t, { thing: "الصيام المتقطع", days: 30 }), "جرّبت الصيام المتقطع لمدة 30 يوم… والنتيجة صدمتني.");
  assert.equal(fillTemplate(t, { thing: "cold showers", days: 7 }, "en"), "I tried cold showers for 7 days and the result shocked me.");
  assert.throws(() => fillTemplate(t, { thing: "x" }), /days/);
  for (const tpl of templates) {
    const keysAr = [...tpl.ar.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const keysEn = [...tpl.en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(keysAr, keysEn, `${tpl.id} placeholders must match`);
  }
});

test("scoreHook rewards strong lines and flags weak ones", () => {
  const strong = scoreHook("جرّبت هالشي 30 يوم… وإنت لازم تعرف النتيجة؟");
  const weak = scoreHook("مرحبا يا جماعة اليوم رح نحكي عن موضوع مهم كثير وبتمنى يعجبكم الفيديو وما تنسوا تعملوا لايك واشتراك");
  assert.ok(strong.score >= 80, `strong=${strong.score}`);
  assert.ok(weak.score <= 30, `weak=${weak.score}`);
  assert.ok(weak.tips.length >= 2);
  assert.equal(scoreHook("").score, 0);
  const en = scoreHook("I tried this for 30 days and you won't believe it...");
  assert.ok(en.score >= 80, `en=${en.score}`);
  assert.equal(scoreHook("hello everyone, welcome back").tips.some((t) => /greeting/.test(t.en)), true);
});

test("normalize unifies common Arabic letter forms", () => {
  assert.equal(normalize("إنتَ  مدرسة"), "انت مدرسه");
});

test("video weights sum to 100", () => {
  assert.equal(VIDEO_WEIGHTS.reduce((s, w) => s + w.weight, 0), 100);
});

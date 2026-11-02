import { scoreHook, randomHook } from "./lib/arabic-hooks/index.js";
import { amountToWords, CURRENCIES } from "./lib/arabic-tafqeet/index.js";
import { parseSubtitles, keywordCaptions, toSrt, toAss, formatTimestamp, fixBidi } from "./lib/arabic-captions/index.js";
import { checkPost, hashtag, PLATFORMS } from "./lib/arabic-social/index.js";
import { slugify } from "./lib/arabic-seo/index.js";
import { renderShare } from "./share.js";
import { formatDate, formatHijri, islamicOccasions, toHijri, fromHijri, HIJRI_MONTHS } from "./lib/arabic-dates/index.js";

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.assign(n, props);
  n.append(...kids);
  return n;
};

/* hook scorer */
if ($("hook-input")) {
  function renderScore() {
    const r = scoreHook($("hook-input").value);
    const out = $("hook-score");
    out.textContent = r.score;
    out.classList.toggle("low", r.score < 60);
    $("hook-meter").style.width = `${r.score}%`;
    const tips = $("hook-tips");
    tips.replaceChildren(
      ...(r.tips.length ? r.tips.map((t) => el("li", { textContent: t.ar })) : [el("li", { className: "good", textContent: "قوي. صوّره وشوف النتيجة." })]),
    );
    const text = $("hook-input").value.trim();
    if ($("hook-share") && text && $("hook-input").dataset.touched) {
      renderShare($("hook-share"), {
        label: "تحدّى صحابك",
        text: `هوكي أخذ ${r.score}/100 بمقيّم الهوك 👀\n«${text.slice(0, 120)}»\nقيّم هوكك وشوف قديش بتاخذ #هوك_بلهجتك`,
        url: "https://moathalherani.github.io/arabic-creator-kit/hook/",
      });
    } else if ($("hook-share")) $("hook-share").replaceChildren();
  }
  $("hook-input").addEventListener("input", () => ($("hook-input").dataset.touched = "1"));
  $("hook-input").addEventListener("input", renderScore);
  $("hook-random").addEventListener("click", () => {
    const h = randomHook({ category: $("hook-category").value || undefined });
    if (h) {
      $("hook-input").value = h.ar;
      delete $("hook-input").dataset.touched;
      renderScore();
    }
  });
  renderScore();
}

/* tafqeet */
if ($("tq-amount")) {
  for (const [code, c] of Object.entries(CURRENCIES)) {
    $("tq-currency").append(el("option", { value: code, textContent: `${c.name} (${code})` }));
  }
  function renderTafqeet() {
    try {
      $("tq-out").textContent = amountToWords($("tq-amount").value.trim() || "0", {
        currency: $("tq-currency").value,
        only: $("tq-only").checked,
      });
    } catch {
      $("tq-out").textContent = "اكتب المبلغ بالأرقام، مثل 1500 أو 25.50";
    }
  }
  ["tq-amount", "tq-currency", "tq-only"].forEach((id) => $(id).addEventListener("input", renderTafqeet));
  renderTafqeet();
}

/* captions */
if ($("cap-in")) {
  let lastCaps = [];
  function renderCaptions() {
    const list = $("cap-out");
    try {
      const cues = parseSubtitles($("cap-in").value);
      lastCaps = keywordCaptions(cues, { maxWords: Math.max(1, Math.min(6, Number($("cap-words").value) || 3)) });
      if (!lastCaps.length) throw new Error("empty");
      list.replaceChildren(
        ...lastCaps.map((c) => {
          const words = c.words.flatMap((w, i) => [i ? " " : "", i === c.keyword ? el("mark", { textContent: w }) : w]);
          return el("li", {}, el("time", { textContent: formatTimestamp(c.start, ".").slice(3) }), el("span", {}, ...words));
        }),
      );
    } catch {
      lastCaps = [];
      list.replaceChildren(el("li", {}, el("time", { textContent: "" }), el("span", { textContent: "الصق ملف SRT أو VTT فيه أوقات" })));
    }
  }
  function download(name, text) {
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("cap-in").addEventListener("input", renderCaptions);
  $("cap-words").addEventListener("input", renderCaptions);
  $("cap-srt").addEventListener("click", () => lastCaps.length && download("captions.srt", toSrt(lastCaps.map((c) => ({ ...c, text: fixBidi(c.text) })))));
  $("cap-ass").addEventListener("click", () => lastCaps.length && download("captions.ass", toAss(lastCaps)));
  renderCaptions();
}

/* social */
if ($("so-in")) {
  for (const [key, p] of Object.entries(PLATFORMS)) $("so-platform").append(el("option", { value: key, textContent: p.name }));
  function renderSocial() {
    const r = checkPost($("so-in").value, $("so-platform").value);
    const pct = Math.min(100, (r.length / r.limit) * 100);
    const bar = el("div", { className: `bar${r.remaining < 0 ? " over" : ""}` }, el("span"));
    bar.firstChild.style.width = `${Math.max(pct, 1)}%`;
    const items = [
      el("div", { textContent: `${r.length} من ${r.limit} حرف${r.hashtagLimit ? `، ${r.hashtags.length} من ${r.hashtagLimit} هاشتاقات` : ""}` }),
      bar,
      ...r.problems.map((p) => el("div", { className: "problem", textContent: p.ar })),
    ];
    if (r.preview) items.push(el("div", { className: "preview", textContent: `قبل «المزيد»: ${r.preview}` }));
    if (r.ok) items.push(el("div", { textContent: "جاهز للنشر." }));
    $("so-out").replaceChildren(...items);
  }
  function renderTag() {
    try {
      $("tag-out").textContent = hashtag($("tag-in").value);
    } catch {
      $("tag-out").textContent = "الهاشتاق لازم يكون فيه حرف واحد على الأقل";
    }
  }
  ["so-in", "so-platform"].forEach((id) => $(id).addEventListener("input", renderSocial));
  $("tag-in").addEventListener("input", renderTag);
  renderSocial();
  renderTag();
}

/* seo */
if ($("slug-in")) {
  function renderSlug() {
    const v = $("slug-in").value;
    $("slug-ar").textContent = slugify(v) || "…";
    $("slug-en").textContent = slugify(v, { transliterate: true }) || "…";
  }
  $("slug-in").addEventListener("input", renderSlug);
  renderSlug();
}

/* dates */
if ($("d-hijri")) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    $("d-levant").textContent = formatDate(now, { months: "levant", weekday: true, timeZone: tz });
    $("d-standard").textContent = formatDate(now, { weekday: true, timeZone: tz });
    $("d-hijri").textContent = formatHijri(now, { timeZone: tz });
    const year = now.getFullYear();
    const upcoming = [...islamicOccasions(year), ...islamicOccasions(year + 1)].filter((o) => o.date >= new Date(now.toDateString())).slice(0, 5);
    $("d-occasions").replaceChildren(
      ...upcoming.map((o) => el("li", {}, el("span", { textContent: o.ar }), el("span", { textContent: formatDate(o.date) }))),
    );
  } catch {
    $("d-hijri").textContent = "متصفحك ما بيدعم التقويم الهجري";
  }
}

/* hijri converter */
if ($("hc-greg")) {
  for (const [i, m] of HIJRI_MONTHS.entries()) $("hc-month").append(el("option", { value: i + 1, textContent: m }));
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  $("hc-greg").value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const h = toHijri(new Date(`${$("hc-greg").value}T00:00:00Z`));
  $("hc-year").value = h.year;
  $("hc-month").value = h.month;
  $("hc-day").value = h.day;
  const g2h = () => {
    try {
      const d = new Date(`${$("hc-greg").value}T00:00:00Z`);
      $("hc-greg-out").textContent = `${formatHijri(d)}، ${formatDate(d, { weekday: true, months: "both" })}`;
    } catch {
      $("hc-greg-out").textContent = "اختار تاريخ صحيح";
    }
  };
  const h2g = () => {
    try {
      const d = fromHijri(Number($("hc-year").value), Number($("hc-month").value), Number($("hc-day").value));
      $("hc-hijri-out").textContent = formatDate(d, { weekday: true, months: "both" });
    } catch {
      $("hc-hijri-out").textContent = "هالتاريخ مش موجود بتقويم أم القرى (الشهر ممكن يكون 29 يوم)";
    }
  };
  $("hc-greg").addEventListener("input", g2h);
  ["hc-year", "hc-month", "hc-day"].forEach((id) => $(id).addEventListener("input", h2g));
  g2h();
  h2g();
}

/* copy buttons */
document.querySelectorAll("[data-copy]").forEach((b) =>
  b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($(b.dataset.copy).textContent);
      b.textContent = "انتسخ";
    } catch {
      b.textContent = "حدّد النص وانسخه";
    }
    setTimeout(() => (b.textContent = "انسخ"), 1600);
  }),
);

/* skills list (generated at build time) */
if ($("skills-list")) {
  fetch(new URL("skills/index.json", import.meta.url))
    .then((r) => (r.ok ? r.json() : []))
    .then((skills) => {
      $("skills-list").replaceChildren(
        ...skills.map((s) =>
          el("li", {}, el("a", { href: new URL(`skills/${s.name}.zip`, import.meta.url).href, download: "", textContent: s.name }), el("span", { textContent: s.summary })),
        ),
      );
    })
    .catch(() => {});
}

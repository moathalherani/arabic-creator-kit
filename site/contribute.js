// "Add your hook" page: turns the form into one JSON file and opens GitHub's new-file editor
// with it filled in, so a contributor only has to press "Commit changes…" then "Create pull request".
import { scoreHook, hooks, CATEGORY_LABELS } from "./lib/arabic-hooks/index.js";
import { renderShare } from "./share.js";

const REPO = "https://github.com/moathalherani/arabic-creator-kit";
const $ = (id) => document.getElementById(id);
const DIALECT_AR = { eg: "مصري", gulf: "خليجي", sy: "سوري", ma: "مغاربي", msa: "فصحى", jo: "أردني" };
const squash = (s) => s.replace(/[\u064B-\u0652\u0640]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");
const known = new Set(hooks.map((h) => squash(h.ar)));

/* how many hooks each dialect has, so people see where they are needed */
const counts = $("dialect-counts");
for (const code of Object.keys(DIALECT_AR)) {
  const n = hooks.filter((h) => h.dialect === code).length;
  const li = document.createElement("li");
  li.className = n ? "" : "empty";
  li.innerHTML = `<b>${DIALECT_AR[code]}</b><span>${n ? `${n} هوك` : "ولا هوك لسا"}</span>`;
  counts.append(li);
}

for (const code of Object.keys(DIALECT_AR)) $("c-dialect").append(new Option(DIALECT_AR[code], code));
for (const [code, label] of Object.entries(CATEGORY_LABELS)) $("c-category").append(new Option(label.ar, code));

const fileName = () => `${$("c-dialect").value}-${$("c-category").value}-${Date.now().toString(36)}.json`;

function entry() {
  const e = { category: $("c-category").value, dialect: $("c-dialect").value, ar: $("c-ar").value.trim() };
  const en = $("c-en").value.trim();
  if (en) e.en = en;
  return e;
}

function problems(e) {
  const out = [];
  if (!e.ar) return ["اكتب الهوك أول."];
  if (!/[\u0600-\u06FF]/.test(e.ar)) out.push("الهوك لازم يكون بالعربي.");
  if (e.ar.length > 160) out.push("طويل. الهوك سطر واحد قصير.");
  if (/https?:\/\/|www\.|@\w/.test(e.ar)) out.push("بلا روابط أو منشن.");
  if (known.has(squash(e.ar))) out.push("هاد الهوك موجود عنا من قبل.");
  if (!DIALECT_AR[e.dialect]) out.push("اختار لهجتك.");
  return out;
}

function render() {
  const e = entry();
  const p = problems(e);
  const r = scoreHook(e.ar);
  $("c-score").textContent = e.ar ? String(r.score) : "–";
  $("c-score").classList.toggle("low", e.ar && r.score < 60);
  const li = (text, className = "") => Object.assign(document.createElement("li"), { textContent: text, className });
  $("c-tips").replaceChildren(...(!e.ar ? [] : r.tips.length ? r.tips.map((t) => li(t.ar)) : [li("قوي. ابعته.", "good")]));
  const json = `${JSON.stringify(e, null, 2)}\n`;
  $("c-json").textContent = json;
  $("c-problems").replaceChildren(...p.map((m) => Object.assign(document.createElement("li"), { textContent: m })));
  const ok = p.length === 0;
  const go = $("c-go");
  go.setAttribute("aria-disabled", String(!ok));
  go.tabIndex = ok ? 0 : -1;
  go.href = ok ? `${REPO}/new/main/contrib/hooks?filename=${encodeURIComponent(fileName())}&value=${encodeURIComponent(json)}` : "#";
  $("c-copy").disabled = !ok;
  if (ok) {
    renderShare($("c-share"), {
      label: "تحدّى صحابك",
      text: `كتبت هوك بال${DIALECT_AR[e.dialect]} وأخذ ${r.score}/100 😎\n«${e.ar.slice(0, 120)}»\nمين بيكتب أقوى؟ ضيف هوكك بلهجتك #هوك_بلهجتك`,
      url: "https://moathalherani.github.io/arabic-creator-kit/contribute/",
    });
  } else $("c-share").replaceChildren();
}

$("c-go").addEventListener("click", (ev) => {
  if ($("c-go").getAttribute("aria-disabled") === "true") ev.preventDefault();
});
$("c-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("c-json").textContent);
    $("c-copy").textContent = "انتسخ ✓";
    setTimeout(() => ($("c-copy").textContent = "انسخ الملف"), 1500);
  } catch {
    /* clipboard can be blocked; the JSON stays visible to copy by hand */
  }
});
for (const id of ["c-ar", "c-en", "c-dialect", "c-category"]) $(id).addEventListener("input", render);

const params = new URLSearchParams(location.search);
if (params.get("dialect") && DIALECT_AR[params.get("dialect")]) $("c-dialect").value = params.get("dialect");
render();

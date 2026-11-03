// Prompt library page: filter, search, copy, and a form that opens GitHub's new-file
// editor with prompts/<slug>.md filled in.
import { slugify } from "./lib/arabic-seo/index.js";

const REPO = "https://github.com/moathalherani/arabic-creator-kit";
const $ = (id) => document.getElementById(id);
const cards = [...document.querySelectorAll(".prompt")];
let cat = "";

function filter() {
  const q = $("p-search").value.trim();
  for (const c of cards) {
    const show = (!cat || c.dataset.cat === cat) && (!q || c.textContent.includes(q));
    c.hidden = !show;
  }
}
$("p-search").addEventListener("input", filter);
$("p-cats").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  cat = b.dataset.cat;
  for (const x of $("p-cats").querySelectorAll("button")) x.classList.toggle("on", x === b);
  filter();
});

for (const c of cards) {
  const btn = c.querySelector(".copy");
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(c.querySelector("pre").textContent);
      btn.textContent = "انتسخ ✓";
      setTimeout(() => (btn.textContent = "انسخ"), 1500);
    } catch {
      /* clipboard can be blocked; the text stays selectable */
    }
  });
}

/* add your prompt */
const titles = new Set(cards.map((c) => c.querySelector("h2").textContent.trim()));
function render() {
  const t = $("a-title").value.trim();
  const f = $("a-for").value.trim();
  const b = $("a-body").value.trim();
  const p = [];
  if (!t) p.push("اكتب عنوان.");
  else if (titles.has(t)) p.push("في برومبت بنفس العنوان، غيّره.");
  if (!f) p.push("اكتب لشو البرومبت بسطر.");
  if (b.length < 60) p.push("البرومبت قصير، وضّح أكثر شو بدك.");
  else if (!/[؀-ۿ]/.test(b)) p.push("البرومبت لازم يكون بالعربي.");
  if (/<script|javascript:/i.test(t + f + b)) p.push("بلا كود HTML.");
  $("a-problems").replaceChildren(...p.map((m) => Object.assign(document.createElement("li"), { textContent: m })));
  const ok = p.length === 0;
  const go = $("a-go");
  go.setAttribute("aria-disabled", String(!ok));
  if (ok) {
    const slug = `${slugify(t, { transliterate: true, maxLength: 40 }) || "prompt"}-${Date.now().toString(36)}`.replace(/[^a-z0-9-]/g, "");
    const md = `---\ntitle: ${t.replace(/\n/g, " ")}\ncategory: ${$("a-cat").value}\nfor: ${f.replace(/\n/g, " ")}\n---\n\n${b}\n`;
    go.href = `${REPO}/new/main/prompts?filename=${encodeURIComponent(`${slug}.md`)}&value=${encodeURIComponent(md)}`;
  } else go.href = "#";
}
for (const id of ["a-title", "a-cat", "a-for", "a-body"]) $(id).addEventListener("input", render);
$("a-go").addEventListener("click", (e) => {
  if ($("a-go").getAttribute("aria-disabled") === "true") e.preventDefault();
});
render();

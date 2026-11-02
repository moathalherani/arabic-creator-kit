// Builds the GitHub Pages site into _site/: the home playground, one search landing page
// per tool, a skills page, the package sources the browser imports, one ZIP per Claude Skill,
// and sitemap.xml.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { faqJsonLd, breadcrumbJsonLd, jsonLdScript, hreflangHtml } from "../packages/arabic-seo/src/index.js";
import { pages } from "./site-pages.js";

const BASE = "https://moathalherani.github.io/arabic-creator-kit/";
const REPO = "https://github.com/moathalherani/arabic-creator-kit";
const root = new URL("..", import.meta.url).pathname;
const out = join(root, "_site");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "site"), out, { recursive: true });

for (const pkg of readdirSync(join(root, "packages"))) {
  const src = join(root, "packages", pkg, "src");
  if (!existsSync(src)) continue;
  const dest = join(out, "lib", pkg);
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) if (f.endsWith(".js") && f !== "cli.js") cpSync(join(src, f), join(dest, f));
}

/* ---------- skills ---------- */
const AR = {
  "arabic-hook-writer": "5 هوكس بلهجتك مع تقييم وتحسين",
  "arabic-reel-script": "سكربت ريل جاهز للتصوير بالثواني",
  "arabic-linkedin-post": "بوست لينكدإن من قصة شغل حقيقية",
  "arabic-youtube-titles": "عناوين يوتيوب ونص الصورة والوصف",
  "arabic-keyword-captions": "كابشن بالكلمات محروق على الفيديو",
  "arabic-carousel": "كاروسيل انستقرام سلايد بسلايد",
  "arabic-car-review": "ريفيو سيارة صادق بأرقام موثقة",
  "arabic-property-listing": "إعلان عقار بالعربي والإنجليزي",
  "arabic-brand-pitch": "إيميل تعاون لبراند مع المتابعات",
  "arabic-content-calendar": "خطة محتوى شهرية مع رمضان والمواسم",
  "arabic-comment-replies": "ردود على التعليقات حسب الأولوية",
  "arabic-x-thread": "ثريد لـ X أو Threads ضمن الحد",
  "arabic-podcast-notes": "ملخص حلقة وفصول ومقاطع للريلز",
};
const skillsDir = join(root, "skills");
const zipDir = join(out, "skills");
mkdirSync(zipDir, { recursive: true });
const skills = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory()).sort();
for (const name of skills) execFileSync("zip", ["-qr", join(zipDir, `${name}.zip`), name], { cwd: skillsDir });
execFileSync("zip", ["-qr", join(zipDir, "arabic-creator-skills.zip"), ...skills], { cwd: skillsDir });
writeFileSync(join(zipDir, "index.json"), JSON.stringify(skills.map((name) => ({ name, summary: AR[name] ?? "" })), null, 2));

/* ---------- sections taken from the home page ---------- */
const home = readFileSync(join(root, "site", "index.html"), "utf8");
const grab = (id) => {
  const m = home.match(new RegExp(`<section class="tool" aria-labelledby="${id}">[\\s\\S]*?</section>`));
  if (!m) throw new Error(`section ${id} not found`);
  return m[0];
};
const scorer = home.match(/<div class="scorer" id="scorer">[\s\S]*?\n      <\/div>\n    <\/section>/)[0].replace(/\n    <\/section>$/, "");
const sections = {
  scorer: `<section class="tool solo">${scorer}</section>`,
  tafqeet: grab("t-tafqeet"),
  captions: grab("t-captions"),
  social: grab("t-social"),
  seo: grab("t-seo"),
  dates: grab("t-dates"),
  hijriConverter: `<section class="tool" aria-labelledby="t-hc">
        <div class="tool-head">
          <h2 id="t-hc">حوّل التاريخ</h2>
          <p>من ميلادي لهجري، ومن هجري لميلادي، حسب تقويم أم القرى.</p>
          <code dir="ltr">npm i arabic-dates</code>
        </div>
        <div class="tool-body">
          <label class="field-label" for="hc-greg">ميلادي</label>
          <input id="hc-greg" type="date" dir="ltr">
          <output id="hc-greg-out" class="result big" aria-live="polite"></output>
          <label class="field-label" for="hc-day">هجري</label>
          <div class="row">
            <input id="hc-day" type="number" min="1" max="30" aria-label="اليوم" dir="ltr">
            <select id="hc-month" aria-label="الشهر"></select>
            <input id="hc-year" type="number" min="1300" max="1600" aria-label="السنة" dir="ltr">
          </div>
          <output id="hc-hijri-out" class="result big" aria-live="polite"></output>
        </div>
      </section>`,
};

const list = pages(sections, new Date());
const NAV = [
  ["hook/", "تقييم الهوك"],
  ["tafqeet/", "المبلغ بالحروف"],
  ["captions/", "كابشن الريلز"],
  ["hashtags/", "الهاشتاقات"],
  ["hijri/", "التاريخ الهجري"],
  ["slug/", "رابط عربي"],
  ["skills/", "Claude Skills"],
  ["contribute/", "ضيف هوكك"],
];
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Noto+Kufi+Arabic:wght@600;800&display=swap" rel="stylesheet">`;
const ICON = home.match(/<link rel="icon"[^>]*>/)[0];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function head({ title, description, url, depth, jsonld, image = "og.png" }) {
  const up = "../".repeat(depth);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  ${hreflangHtml({ ar: url }, { xDefault: "ar" }).replace(/\n/g, "\n  ")}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:creator" content="@moathalherani">
  ${FONTS}
  <link rel="stylesheet" href="${up}style.css">
  ${ICON}
  ${jsonld.map(jsonLdScript).join("\n  ")}
</head>`;
}

function header(depth, current) {
  const up = "../".repeat(depth);
  return `<header class="top">
    <a class="brand" href="${up || "./"}">Arabic Creator Kit</a>
    <nav aria-label="الأدوات">
      ${NAV.map(([href, label]) => `<a href="${up}${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("\n      ")}
      <a href="${REPO}">GitHub</a>
    </nav>
  </header>`;
}

const FOOT = `<footer class="foot">
    <p>صنعه <a href="https://moathalherani.com">المهندس معاذ الهريني</a>، ومفتوح المصدر برخصة MIT.</p>
    <p><a href="${REPO}">الكود على GitHub</a></p>
  </footer>`;

const webApp = (name, url, description) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name,
  url,
  description,
  inLanguage: "ar",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Moath Alherani", alternateName: "معاذ الهريني", url: "https://moathalherani.com" },
});

function faqHtml(faq) {
  return `<section class="faq" aria-labelledby="faq-title"><h2 id="faq-title">أسئلة شائعة</h2>${faq
    .map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`)
    .join("")}</section>`;
}

function related(depth, self) {
  const up = "../".repeat(depth);
  return `<nav class="related" aria-label="أدوات ثانية"><h2>أدوات ثانية</h2><ul>${NAV.filter(([h]) => h !== self)
    .map(([href, label]) => `<li><a href="${up}${href}">${label}</a></li>`)
    .join("")}</ul></nav>`;
}

const urls = [BASE];
for (const p of list) {
  const url = `${BASE}${p.slug}/`;
  urls.push(url);
  const html = `${head({
    title: `${p.title} | Arabic Creator Kit`,
    description: p.description,
    url,
    depth: 1,
    jsonld: [
      webApp(p.h1, url, p.description),
      faqJsonLd(p.faq),
      breadcrumbJsonLd([{ name: "Arabic Creator Kit", url: BASE }, { name: p.h1, url }]),
    ],
  })}
<body>
  ${header(1, `${p.slug}/`)}
  <main>
    <section class="page-head">
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </section>
    ${p.tool}
    <section class="page-body">${p.body}</section>
    ${faqHtml(p.faq)}
    ${related(1, `${p.slug}/`)}
  </main>
  ${FOOT}
  <script type="module" src="../app.js"></script>
</body>
</html>
`;
  mkdirSync(join(out, p.slug), { recursive: true });
  writeFileSync(join(out, p.slug, "index.html"), html);
}

/* skills page */
const skillsUrl = `${BASE}skills/`;
urls.push(skillsUrl);
const skillsDesc = "13 مهارة جاهزة لـ Claude بالعربي لصنّاع المحتوى: هوكس، سكربت ريل، كاروسيل، عناوين يوتيوب، لينكدإن، ثريد، كابشن، وأكثر. نزّلها مجانًا.";
const skillsFaq = [
  { question: "شو هي Claude Skill؟", answer: "ملف تعليمات بيعلّم Claude يعمل شغلة معيّنة بطريقة ثابتة، مثل كتابة هوك أو سكربت ريل بلهجتك." },
  { question: "كيف بركّبها بتطبيق Claude؟", answer: "نزّل ملف ZIP، وافتح Settings ثم Capabilities ثم Skills واختار Upload skill. لازم يكون Code execution مفعّل." },
  { question: "وبـ Claude Code؟", answer: "انسخ مجلد الـ Skill لـ ~/.claude/skills، وClaude بيستخدمه لحاله لما يلزم." },
];
const skillsHtml = `${head({
  title: "Claude Skills بالعربي لصنّاع المحتوى | Arabic Creator Kit",
  description: skillsDesc,
  url: skillsUrl,
  depth: 1,
  jsonld: [webApp("Claude Skills بالعربي", skillsUrl, skillsDesc), faqJsonLd(skillsFaq)],
})}
<body>
  ${header(1, "skills/")}
  <main>
    <section class="page-head">
      <h1>13 مهارة جاهزة لـ Claude بالعربي</h1>
      <p class="lead">كل مهارة (Skill) بتعلّم Claude يكتب نوع محتوى معيّن بلهجتك وبقواعد واضحة. نزّل اللي بدك ياها أو نزّلهم كلهم.</p>
      <a class="btn" href="arabic-creator-skills.zip" download>نزّل الكل</a>
    </section>
    <section class="skills">
      <ul class="skills-list">${skills
        .map((s) => `<li><a href="${s}.zip" download>${s}</a><span>${esc(AR[s] ?? "")}</span></li>`)
        .join("")}</ul>
    </section>
    ${faqHtml(skillsFaq)}
    ${related(1, "skills/")}
  </main>
  ${FOOT}
</body>
</html>
`;
writeFileSync(join(zipDir, "index.html"), skillsHtml);

/* contribute page: write a hook, open GitHub with the file ready */
const cUrl = `${BASE}contribute/`;
urls.push(cUrl);
const cDesc = "ضيف هوك بلهجتك لمكتبة هوكس عربية مفتوحة المصدر. اكتبه، اختار اللهجة، وبكبسة بيفتحلك GitHub والملف جاهز. اسمك بينضاف للمساهمين.";
const cFaq = [
  { question: "لازم أعرف برمجة؟", answer: "لا. بتكتب الهوك هون، وبتكبس زر، وGitHub بيعمل الباقي. بس بدك حساب GitHub مجاني." },
  { question: "شو بصير بعد ما أبعته؟", answer: "بنراجعه، وإذا تمام بندمجه. بعدها بيصير جزء من حزمة arabic-hooks على npm ومن أداة تقييم الهوك، واسمك بيطلع بقائمة المساهمين." },
  { question: "شو بيعتبر هوك منيح؟", answer: "جملة وحدة قصيرة (12 كلمة أو أقل)، بتبلش بالفكرة مش بالسلام، وفيها سؤال أو رقم أو مقارنة بتخلي المشاهد يكمّل. لازم تكون من كتابتك." },
  { question: "ما بدي أعمل حساب GitHub", answer: "ابعته بتعليق على آخر ريل بإنستغرام @moath.alherani مع هاشتاق #هوك_بلهجتك، أو افتح Issue اسمه «هوكس بلهجتي» على GitHub، وبنضيفه إحنا باسمك." },
];
const cHtml = `${head({
  title: "ضيف هوكك بلهجتك | Arabic Creator Kit",
  description: cDesc,
  url: cUrl,
  depth: 1,
  image: "og-contribute.png",
  jsonld: [faqJsonLd(cFaq), breadcrumbJsonLd([{ name: "Arabic Creator Kit", url: BASE }, { name: "ضيف هوكك", url: cUrl }])],
})}
<body>
  ${header(1, "contribute/")}
  <main>
    <section class="page-head">
      <h1>ضيف هوكك بلهجتك</h1>
      <p class="challenge-tag">#هوك_بلهجتك</p>
      <p class="lead">المكتبة فيها هوكس أردنية بس. بدنا مصري وخليجي وسوري ومغاربي وفصحى. اكتب هوك واحد من عندك، واسمك بينضاف للمساهمين بالمشروع.</p>
      <ul class="dialect-counts" id="dialect-counts" aria-label="عدد الهوكس بكل لهجة"></ul>
    </section>
    <section class="tool solo contribute-tool" aria-labelledby="c-title">
      <div class="scorer">
        <h2 id="c-title" class="visually-hidden">اكتب الهوك</h2>
        <label class="field-label" for="c-ar">الهوك (سطر واحد، من كتابتك)</label>
        <textarea id="c-ar" rows="2" maxlength="200" placeholder="مثلاً: في سبب محدش بيقولهولك عن الريلز…"></textarea>
        <div class="row">
          <label class="stack"><span class="field-label">اللهجة</span><select id="c-dialect"><option value="">اختار</option></select></label>
          <label class="stack"><span class="field-label">النوع</span><select id="c-category"></select></label>
        </div>
        <label class="field-label" for="c-en">الترجمة بالإنجليزي (اختياري)</label>
        <input id="c-en" dir="ltr" maxlength="200" placeholder="There's a reason nobody tells you about reels…">
        <div class="scorer-out">
          <output class="score" id="c-score" aria-live="polite">–</output>
          <div class="score-side"><ul class="tips" id="c-tips"></ul></div>
        </div>
        <ul class="problems" id="c-problems" aria-live="polite"></ul>
        <div class="row">
          <a class="btn" id="c-go" href="#" target="_blank" rel="noopener" aria-disabled="true">افتح GitHub والملف جاهز</a>
          <button class="btn ghost" id="c-copy" type="button" disabled>انسخ الملف</button>
        </div>
        <details class="json-preview"><summary>شوف الملف</summary><pre dir="ltr" id="c-json"></pre></details>
        <div class="share" id="c-share" aria-label="شارك الهوك"></div>
      </div>
    </section>
    <section class="page-body wall-section" aria-labelledby="wall-title">
      <h2 id="wall-title">جدار المساهمين</h2>
      <p class="lead" id="wall-lead"></p>
      <ul class="wall" id="wall"></ul>
    </section>
    <section class="page-body">
      <h2>3 خطوات وبس</h2>
      <ol class="steps">
        <li><b>اكتب الهوك</b> فوق واختار لهجتك. الرقم بيقلك قديش قوي.</li>
        <li><b>اكبس «افتح GitHub»</b>. إذا ما عندك حساب اعمل واحد مجاني. الملف بيكون مكتوب جاهز.</li>
        <li><b>اكبس Commit changes ثم Propose changes ثم Create pull request</b>. خلص، بنراجعه وبندمجه.</li>
      </ol>
      <p>بعد الدمج الهوك بيصير جزء من <a href="https://www.npmjs.com/package/arabic-hooks">arabic-hooks</a> ومن <a href="../hook/">أداة تقييم الهوك</a>، واسمك بيطلع بـ <a href="${REPO}/graphs/contributors">قائمة المساهمين</a>.</p>
      <p>بتعرف تبرمج؟ في كمان <a href="${REPO}/contribute">مهام سهلة للمبتدئين</a> و<a href="${REPO}/blob/main/CONTRIBUTING.md">دليل المساهمة</a>.</p>
      <h2>المساهمين</h2>
      <a href="${REPO}/graphs/contributors"><img class="contributors" src="https://contrib.rocks/image?repo=moathalherani/arabic-creator-kit" alt="صور المساهمين بالمشروع" loading="lazy"></a>
    </section>
    ${faqHtml(cFaq)}
    ${related(1, "contribute/")}
  </main>
  ${FOOT}
  <script type="module" src="../contribute.js"></script>
</body>
</html>
`;
mkdirSync(join(out, "contribute"), { recursive: true });
writeFileSync(join(out, "contribute", "index.html"), cHtml);

/* home: add SEO head tags and the tools index */
const homeUrl = BASE;
const homeDesc = "أدوات مجانية ومفتوحة المصدر لصنّاع المحتوى العرب: قيّم الهوك، اكتب المبلغ بالحروف، كابشن للريلز، هاشتاقات، تاريخ هجري و13 Claude Skill.";
let homeOut = home
  .replace(/<meta property="og:title"[^>]*>\n\s*<meta property="og:description"[^>]*>/, `<link rel="canonical" href="${homeUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_AR">
  <meta property="og:title" content="Arabic Creator Kit · أدوات صنّاع المحتوى العرب">
  <meta property="og:description" content="${esc(homeDesc)}">
  <meta property="og:url" content="${homeUrl}">
  <meta property="og:image" content="${BASE}og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:creator" content="@moathalherani">`)
  .replace("</head>", `  ${jsonLdScript({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Arabic Creator Kit",
    alternateName: "أدوات صنّاع المحتوى العرب",
    url: homeUrl,
    inLanguage: "ar",
    author: { "@type": "Person", name: "Moath Alherani", url: "https://moathalherani.com" },
  })}\n</head>`)
  .replace('<div id="tools">', `<nav class="tool-index" aria-label="كل الأدوات"><ul>${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></nav>\n    <div id="tools">`);
writeFileSync(join(out, "index.html"), homeOut);

/* sitemap */
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);
writeFileSync(join(out, ".nojekyll"), "");
console.log(`Built _site: home + ${list.length} tool pages + skills page, ${skills.length} skills, ${urls.length} URLs in sitemap`);

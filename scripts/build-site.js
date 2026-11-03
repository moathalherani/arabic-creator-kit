// Builds the GitHub Pages site into _site/: the home playground, one search landing page
// per tool, a skills page, the package sources the browser imports, one ZIP per Claude Skill,
// and sitemap.xml.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { faqJsonLd, breadcrumbJsonLd, jsonLdScript, hreflangHtml } from "../packages/arabic-seo/src/index.js";
import { pages } from "./site-pages.js";
import { readPrompts, PROMPT_CATEGORIES } from "./prompts.js";

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
  ["autocaptions/", "كابشن أوتوماتيك"],
  ["prompts/", "برومبتات عربية"],
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

/* auto-captions page: the Colab tool in autocaptions/ */
{
  const url = `${BASE}autocaptions/`;
  urls.push(url);
  const colab = "https://colab.research.google.com/github/moathalherani/arabic-creator-kit/blob/main/autocaptions/Arabic_AutoCaptions.ipynb";
  const desc = "كابشن عربي أوتوماتيك ومجاني لفيديوهاتك: كلمات مفتاحية محروقة على الفيديو، بيفهم اللهجات، وبيحط الإنجليزي والأرقام بترتيبها الصحيح. بيشتغل من المتصفح على Google Colab.";
  const faq = [
    { question: "مجاني فعلًا؟", answer: "آه. الأداة مفتوحة المصدر، وGoogle Colab بيعطيك GPU مجاني يكفي لفيديوهات الريلز. ما في اشتراك ولا علامة مائية." },
    { question: "بيفهم لهجتي؟", answer: "بيفهم الفصحى واللهجات الأردنية والمصرية والخليجية والشامية والمغاربية بدرجات مختلفة. إذا في كلمات أو أسماء بتحكيها كثير، اكتبها بخانة الكلمات المساعدة." },
    { question: "بقدر أعدّل الكابشن بعدين؟", answer: "آه. مع الفيديو بينزل ملف .srt وملف .ass، بتفتحهم بأي برنامج مونتاج وبتعدّل الكلمات أو التوقيت." },
    { question: "وين بيروح الفيديو تبعي؟", answer: "على جلسة Colab الخاصة فيك على حساب Google تبعك، وبينمسح لما تسكّر الجلسة. ما بيوصلنا إشي." },
  ];
  const html = `${head({
    title: "كابشن عربي أوتوماتيك مجاني للريلز وتيك توك | Arabic Creator Kit",
    description: desc,
    url,
    depth: 1,
    jsonld: [webApp("كابشن عربي أوتوماتيك", url, desc), faqJsonLd(faq), breadcrumbJsonLd([{ name: "Arabic Creator Kit", url: BASE }, { name: "كابشن عربي أوتوماتيك", url }])],
  })}
<body>
  ${header(1, "autocaptions/")}
  <main>
    <section class="page-head">
      <h1>كابشن عربي أوتوماتيك، مجانًا</h1>
      <p class="lead">حط الفيديو، وبيرجعلك مع كابشن كلمات مفتاحية بالعربي محروق عليه، والكلمة الأقوى بلون. بدل ما تدفع اشتراك شهري لأداة كابشن، أو تكتب الكابشن كلمة كلمة.</p>
      <div class="row"><a class="btn" href="${colab}" target="_blank" rel="noopener">افتحه بـ Google Colab</a><a class="btn ghost" href="${REPO}/tree/main/autocaptions">الكود على GitHub</a></div>
    </section>
    <section class="page-body">
      <picture><source media="(max-width: 600px)" srcset="preview-mobile.png" width="720" height="400"><img class="ac-preview" src="preview.png" width="1324" height="258" alt="ثلاث لقطات من فيديو عليه كابشن عربي: مرحبا جربت iPhone، و17 لمدة 30 يوم، والنتيجة صدمتني، والكلمة الأقوى بلون أخضر"></picture>
      <h2>شو بيعمل</h2>
      <ul class="steps">
        <li>بيسمع الفيديو وبيكتب الكلام بالعربي، مع وقت كل كلمة.</li>
        <li>بيقسم الكلام لكابشن قصير، من كلمة لثلاث كلمات، بيطلع مع صوتك بالضبط.</li>
        <li>بيلوّن الكلمة الأقوى: الأرقام أول، بعدين الكلمات الإنجليزي، بعدين أطول كلمة.</li>
        <li>بيشيل «يعني» و«اممم»، وبيكتب الأرقام 0-9.</li>
        <li>بيحط الكلمات الإنجليزي والأرقام بمكانها الصح جوا الجملة العربية، وهاي مشكلة معروفة ببرامج المونتاج.</li>
      </ul>
      <h2>3 خطوات</h2>
      <ol class="steps">
        <li>اكبس «افتحه بـ Google Colab»، ومن القائمة اختار Runtime ثم Change runtime type ثم T4 GPU.</li>
        <li>اكبس ▶️ على الخلايا بالترتيب، وارفع الفيديو لما يطلب منك.</li>
        <li>بعد دقيقة أو دقيقتين، بينزلك الفيديو جاهز مع ملف .srt.</li>
      </ol>
      <p>بتحب تشغّله على جهازك؟ <a href="${REPO}/tree/main/autocaptions#use-it-on-your-computer">الشرح هون</a>. بدك تحسّنه للهجتك؟ <a href="${REPO}/issues">ساهم معنا</a>.</p>
    </section>
    ${faqHtml(faq)}
    ${related(1, "autocaptions/")}
  </main>
  ${FOOT}
</body>
</html>
`;
  mkdirSync(join(out, "autocaptions"), { recursive: true });
  writeFileSync(join(out, "autocaptions", "index.html"), html);
  cpSync(join(root, "autocaptions", "docs", "preview.png"), join(out, "autocaptions", "preview.png"));
  cpSync(join(root, "autocaptions", "docs", "preview-mobile.png"), join(out, "autocaptions", "preview-mobile.png"));
}

/* prompts page: the Arabic prompt library from prompts/*.md */
const catOrder = Object.keys(PROMPT_CATEGORIES);
const firstPrompts = ["hook-writer", "reel-script", "caption-writer", "youtube-titles"];
const rank = (x) => (firstPrompts.includes(x.slug) ? firstPrompts.indexOf(x.slug) - 100 : 0);
const prompts = readPrompts().sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || rank(a) - rank(b) || a.title.localeCompare(b.title, "ar"));
const pUrl = `${BASE}prompts/`;
urls.push(pUrl);
const pDesc = `${prompts.length} برومبت عربي جاهز لـ ChatGPT وClaude: هوكات، سكربت ريل، كابشن، إيميلات، لينكدإن، دراسة وأكثر. انسخه بكبسة، أو ضيف برومبتك واسمك بينضاف للمساهمين.`;
const pFaq = [
  { question: "شو هو البرومبت؟", answer: "هو التعليمات اللي بتكتبها لـ ChatGPT أو Claude. كل ما كان أوضح، كل ما كانت النتيجة أحسن. البرومبتات هون جاهزة، بس بدّل اللي بين [ ] بمعلوماتك." },
  { question: "بيشتغلوا مع ChatGPT وClaude وGemini؟", answer: "آه، مع أي مساعد ذكاء اصطناعي. زر «جرّبه بـ Claude» بيفتحلك البرومبت جاهز بمحادثة جديدة." },
  { question: "كيف بضيف برومبت؟", answer: "عبّي النموذج تحت الصفحة واكبس «افتح GitHub والملف جاهز». بعد ما ندمجه بيطلع هون، واسمك بيصير من مساهمين المشروع." },
  { question: "مسموح أستخدمهم بشغلي؟", answer: "آه. المشروع مفتوح المصدر بترخيص MIT، استخدمهم وعدّل عليهم براحتك." },
];
const card = (x) => `<article class="prompt" data-cat="${x.category}" id="${x.slug}">
        <div class="prompt-head"><span class="tag">${esc(PROMPT_CATEGORIES[x.category])}</span><h2><a href="${x.slug}/">${esc(x.title)}</a></h2><p>${esc(x.for)}</p></div>
        <pre>${esc(x.body)}</pre>
        <div class="row"><button type="button" class="btn copy">انسخ</button><a class="btn ghost" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(x.body)}">جرّبه بـ Claude</a><a class="chip" href="${REPO}/blob/main/prompts/${x.slug}.md">عدّل على GitHub</a></div>
      </article>`;
const pHtml = `${head({
  title: "برومبتات عربية جاهزة لـ ChatGPT وClaude | Arabic Creator Kit",
  description: pDesc,
  url: pUrl,
  depth: 1,
  jsonld: [webApp("برومبتات عربية", pUrl, pDesc), faqJsonLd(pFaq), breadcrumbJsonLd([{ name: "Arabic Creator Kit", url: BASE }, { name: "برومبتات عربية", url: pUrl }])],
})}
<body>
  ${header(1, "prompts/")}
  <main>
    <section class="page-head">
      <h1>${prompts.length} برومبت عربي جاهز</h1>
      <p class="lead">لـ ChatGPT وClaude وأي مساعد ذكاء اصطناعي. انسخ، بدّل اللي بين [ ] بمعلوماتك، وخلص. وإذا عندك برومبت بيشتغل معك، ضيفه واسمك بينضاف للمساهمين.</p>
      <div class="row prompt-tools">
        <input id="p-search" type="search" placeholder="دوّر: هوك، إيميل، دراسة…" aria-label="دوّر على برومبت">
        <a class="btn" href="#add">ضيف برومبتك</a>
      </div>
      <div class="chips" id="p-cats" role="group" aria-label="الأقسام">
        <button type="button" class="chip on" data-cat="">الكل</button>
        ${Object.entries(PROMPT_CATEGORIES).map(([k, v]) => `<button type="button" class="chip" data-cat="${k}">${v}</button>`).join("\n        ")}
      </div>
    </section>
    <section class="prompts" id="p-list">
      ${prompts.map(card).join("\n      ")}
    </section>
    <section class="page-body" id="add" aria-labelledby="add-title">
      <h2 id="add-title">ضيف برومبتك</h2>
      <p>اكتب برومبت بتستخدمه وبيعطيك نتيجة حلوة. اكبس الزر وGitHub بيفتح والملف جاهز، بعدها Commit changes ثم Create pull request.</p>
      <div class="scorer add-form">
        <label class="field-label" for="a-title">العنوان</label>
        <input id="a-title" maxlength="60" placeholder="مثلًا: كاتب وصف منتجات">
        <div class="row">
          <label class="stack"><span class="field-label">القسم</span><select id="a-cat">${Object.entries(PROMPT_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
          <label class="stack"><span class="field-label">لشو؟ (سطر قصير)</span><input id="a-for" maxlength="80" placeholder="وصف بيبيع للمتجر"></label>
        </div>
        <label class="field-label" for="a-body">البرومبت (حط [ ] حول الأشياء اللي بتتغير)</label>
        <textarea id="a-body" rows="7" maxlength="3000"></textarea>
        <ul class="problems" id="a-problems" aria-live="polite"></ul>
        <div class="row"><a class="btn" id="a-go" href="#" target="_blank" rel="noopener" aria-disabled="true">افتح GitHub والملف جاهز</a></div>
      </div>
      <p class="note">بعض البرومبتات مستوحاة من مكتبة <a href="https://github.com/f/prompts.chat">prompts.chat</a> (ملكية عامة CC0)، ومكتوبة من جديد بالعربي لصنّاع المحتوى العرب.</p>
    </section>
    ${faqHtml(pFaq)}
    ${related(1, "prompts/")}
  </main>
  ${FOOT}
  <script type="module" src="../prompts.js"></script>
</body>
</html>
`;
mkdirSync(join(out, "prompts"), { recursive: true });
writeFileSync(join(out, "prompts", "index.html"), pHtml);

/* one page per prompt, so each can be found on search engines */
for (const x of prompts) {
  const url = `${BASE}prompts/${x.slug}/`;
  urls.push(url);
  const desc = `برومبت عربي جاهز لـ ChatGPT وClaude: ${x.title}، ${x.for}. انسخه بكبسة وبدّل اللي بين [ ] بمعلوماتك.`;
  const rel = prompts.filter((y) => y.category === x.category && y.slug !== x.slug).slice(0, 4);
  const html = `${head({
    title: `برومبت ${x.title} بالعربي لـ ChatGPT وClaude`,
    description: desc,
    url,
    depth: 2,
    jsonld: [
      { "@context": "https://schema.org", "@type": "CreativeWork", name: x.title, description: x.for, text: x.body, inLanguage: "ar", url, license: "https://opensource.org/licenses/MIT", author: { "@type": "Person", name: "Moath Alherani", url: "https://moathalherani.com" } },
      breadcrumbJsonLd([{ name: "Arabic Creator Kit", url: BASE }, { name: "برومبتات عربية", url: pUrl }, { name: x.title, url }]),
    ],
  })}
<body>
  ${header(2, "prompts/")}
  <main>
    <section class="page-head">
      <p class="crumbs"><a href="../">برومبتات عربية</a> · ${esc(PROMPT_CATEGORIES[x.category])}</p>
      <h1>برومبت ${esc(x.title)}</h1>
      <p class="lead">${esc(x.for)}. برومبت عربي جاهز لـ ChatGPT وClaude وأي مساعد ذكاء اصطناعي.</p>
    </section>
    <section class="prompts single">
      <article class="prompt">
        <pre id="text">${esc(x.body)}</pre>
        <div class="row"><button type="button" class="btn copy" id="copy">انسخ البرومبت</button><a class="btn ghost" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(x.body)}">جرّبه بـ Claude</a><a class="btn ghost" target="_blank" rel="noopener" href="https://chatgpt.com/?q=${encodeURIComponent(x.body)}">جرّبه بـ ChatGPT</a></div>
      </article>
    </section>
    <section class="page-body">
      <h2>كيف تستخدمه</h2>
      <ol class="steps">
        <li>اكبس «انسخ البرومبت» أو افتحه مباشرة بـ Claude أو ChatGPT.</li>
        <li>بدّل كل إشي بين [ ] بمعلوماتك: الموضوع، الجمهور، اللهجة.</li>
        <li>إذا ما عجبتك النتيجة، اطلب «أقصر» أو «بلهجة ثانية» أو «اعطيني 3 نسخ ثانية».</li>
      </ol>
      <p>بدك تحسّنه؟ <a href="${REPO}/blob/main/prompts/${x.slug}.md">عدّل عليه على GitHub</a>، أو <a href="../#add">ضيف برومبتك</a> واسمك بينضاف للمساهمين.</p>
    </section>
    ${rel.length ? `<nav class="related" aria-label="برومبتات مشابهة"><h2>برومبتات مشابهة</h2><ul>${rel.map((y) => `<li><a href="../${y.slug}/">${esc(y.title)}</a></li>`).join("")}<li><a href="../">كل البرومبتات</a></li></ul></nav>` : ""}
  </main>
  ${FOOT}
  <script type="module">
    const b = document.getElementById("copy");
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(document.getElementById("text").textContent); b.textContent = "انتسخ ✓"; setTimeout(() => (b.textContent = "انسخ البرومبت"), 1500); } catch {}
    });
  </script>
</body>
</html>
`;
  mkdirSync(join(out, "prompts", x.slug), { recursive: true });
  writeFileSync(join(out, "prompts", x.slug, "index.html"), html);
}

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

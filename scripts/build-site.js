// Builds the GitHub Pages site into _site/: the playground, the package sources
// it imports in the browser, and one ZIP per Claude Skill (plus one with all of them).
import { cpSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

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
  for (const f of readdirSync(src)) {
    if (f.endsWith(".js") && f !== "cli.js") cpSync(join(src, f), join(dest, f));
  }
}

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
for (const name of skills) {
  execFileSync("zip", ["-qr", join(zipDir, `${name}.zip`), name], { cwd: skillsDir });
}
execFileSync("zip", ["-qr", join(zipDir, "arabic-creator-skills.zip"), ...skills], { cwd: skillsDir });
writeFileSync(join(zipDir, "index.json"), JSON.stringify(skills.map((name) => ({ name, summary: AR[name] ?? "" })), null, 2));
writeFileSync(join(out, ".nojekyll"), "");

console.log(`Built _site with ${skills.length} skills`);

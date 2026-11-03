// Keeps the arabic-reel-designer skill in step with the Motion Studio templates: the template list
// in its SKILL.md and the field table in scripts/make_link.py are generated from site/motion/templates.
//
//   node scripts/sync-reel-skill.js           rewrite both files
//   node scripts/sync-reel-skill.js --check   fail if they are out of date (CI)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tdir = join(root, "site", "motion", "templates");
const skill = join(root, "skills", "arabic-reel-designer");
const templates = [];
for (const f of readdirSync(tdir).filter((f) => f.endsWith(".js") && f !== "index.js").sort()) {
  templates.push((await import(join(tdir, f))).default);
}
const textFields = (t) => t.fields.filter((f) => f.type !== "image");

const list = templates
  .map((t) => {
    const fields = textFields(t).map((f) => `  - \`${f.key}\`: ${f.label}. Example: ${JSON.stringify(f.default ?? "")}`);
    return [`- **\`${t.id}\`** (${t.name}): ${t.description}`, ...fields].join("\n");
  })
  .join("\n");
const table = `TEMPLATES = {\n${templates.map((t) => `    ${JSON.stringify(t.id)}: [${textFields(t).map((f) => JSON.stringify(f.key)).join(", ")}],`).join("\n")}\n}`;

const files = [
  [join(skill, "SKILL.md"), /<!-- templates:start -->[\s\S]*<!-- templates:end -->/, `<!-- templates:start -->\n${list}\n<!-- templates:end -->`],
  [join(skill, "scripts", "make_link.py"), /# templates:start\n[\s\S]*# templates:end/, `# templates:start\n${table}\n# templates:end`],
];
let stale = false;
for (const [file, re, block] of files) {
  const src = readFileSync(file, "utf8");
  if (!re.test(src)) throw new Error(`markers missing in ${file}`);
  const next = src.replace(re, () => block);
  if (next === src) continue;
  if (process.argv.includes("--check")) {
    console.error(`✗ ${file.slice(root.length)} is out of date: run node scripts/sync-reel-skill.js`);
    stale = true;
  } else writeFileSync(file, next);
}
if (stale) process.exit(1);
console.log(`✓ arabic-reel-designer skill lists ${templates.length} templates`);

// Keeps the arabic-reel-designer skill and the MCP server in step with the Motion Studio templates:
// the template list in the skill's SKILL.md, the field table in its scripts/make_link.py and
// packages/arabic-creator-mcp/src/templates.js are generated from site/motion/templates.
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

const mcpList = JSON.stringify(
  templates.map((t) => ({ id: t.id, name: t.name, description: t.description, fields: textFields(t).map((f) => ({ key: f.key, label: f.label })) })),
  null,
  2,
);

const files = [
  [join(skill, "SKILL.md"), /<!-- templates:start -->[\s\S]*<!-- templates:end -->/, `<!-- templates:start -->\n${list}\n<!-- templates:end -->`],
  [join(skill, "scripts", "make_link.py"), /# templates:start\n[\s\S]*# templates:end/, `# templates:start\n${table}\n# templates:end`],
  [join(root, "packages", "arabic-creator-mcp", "src", "templates.js"), /\/\/ templates:start\n[\s\S]*\/\/ templates:end/, `// templates:start\nexport default ${mcpList};\n// templates:end`],
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
console.log(`✓ reel-designer skill and MCP server list ${templates.length} templates`);

// Checks every Motion Studio template in site/motion/templates/ (CI runs this).
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const dir = fileURLToPath(new URL("../site/motion/templates/", import.meta.url));
const TYPES = new Set(["text", "textarea", "number", "image"]);
let failed = 0;
const files = readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "index.js");
for (const f of files) {
  const problems = [];
  let t;
  try {
    t = (await import(pathToFileURL(join(dir, f)).href)).default;
  } catch (e) {
    problems.push(`does not load: ${e.message}`);
  }
  if (t) {
    if (t.id !== f.slice(0, -3)) problems.push(`id "${t.id}" must equal the file name "${f.slice(0, -3)}"`);
    if (!t.name || !t.description) problems.push("name and description are required");
    if (!(t.duration > 0 && t.duration <= 8)) problems.push("duration must be between 0 and 8 seconds");
    if (typeof t.draw !== "function") problems.push("draw(ctx, t, props, env) is required");
    if (!Array.isArray(t.fields) || !t.fields.length) problems.push("fields must list at least one input");
    for (const fl of t.fields ?? []) {
      if (!fl.key || !fl.label || !TYPES.has(fl.type)) problems.push(`field ${JSON.stringify(fl.key)} needs key, label and a type (${[...TYPES].join(", ")})`);
    }
    if (!Array.isArray(t.cues)) problems.push("cues must be an array (it can be empty)");
  }
  if (problems.length) {
    failed++;
    for (const p of problems) console.error(`✗ site/motion/templates/${f}: ${p}`);
  }
}
if (failed) process.exit(1);
console.log(`✓ ${files.length} motion templates`);

// Validates prompts/*.md (CI runs this on every pull request).
import { readPrompts, promptProblems } from "./prompts.js";

let failed = 0;
const prompts = readPrompts();
const titles = new Map();
for (const p of prompts) {
  const problems = promptProblems(p);
  if (titles.has(p.title)) problems.push(`same title as prompts/${titles.get(p.title)}.md`);
  titles.set(p.title, p.slug);
  if (problems.length) {
    failed++;
    for (const msg of problems) console.error(`✗ prompts/${p.slug}.md: ${msg}`);
  }
}
if (failed) process.exit(1);
console.log(`✓ ${prompts.length} prompts`);

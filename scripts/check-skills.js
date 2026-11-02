// Validates every skills/*/SKILL.md: frontmatter present, name matches the folder,
// description is useful and within limits.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../skills/", import.meta.url).pathname;
let failed = 0;
const dirs = readdirSync(root).filter((d) => statSync(join(root, d)).isDirectory());

for (const dir of dirs) {
  const file = join(root, dir, "SKILL.md");
  const problems = [];
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    problems.push("missing SKILL.md");
  }
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (text && !fm) problems.push("missing --- frontmatter ---");
  if (fm) {
    const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (name !== dir) problems.push(`name "${name}" must equal folder "${dir}"`);
    if (!/^[a-z0-9-]{1,64}$/.test(name ?? "")) problems.push("name must be lowercase letters, digits and dashes (max 64)");
    if (!desc || desc.length < 40) problems.push("description too short (say what it does and when to use it)");
    if (desc && desc.length > 1024) problems.push("description over 1024 characters");
    if (desc && /[<>]/.test(desc)) problems.push("description must not contain < or >");
    if (desc && /: |#/.test(desc) && !/^["']/.test(desc)) problems.push('description contains ": " or "#", which breaks YAML; rephrase or quote it');
    if (text.slice(fm[0].length).trim().length < 200) problems.push("body is too thin");
  }
  if (problems.length) {
    failed++;
    console.error(`✗ ${dir}\n  - ${problems.join("\n  - ")}`);
  } else console.log(`✓ ${dir}`);
}

if (dirs.length === 0) {
  console.error("No skills found");
  process.exit(1);
}
process.exit(failed ? 1 : 0);

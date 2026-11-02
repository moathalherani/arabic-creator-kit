// Community hooks arrive as small JSON files in contrib/hooks/ (one hook per file, usually
// proposed from the "add your hook" page on the site, which opens GitHub's new-file editor).
//
//   node scripts/merge-hooks.js --check   validate the files (CI runs this on every pull request)
//   node scripts/merge-hooks.js           validate, give each hook the next free id, append it to
//                                         packages/arabic-hooks/src/hooks-data.js and delete the file
//
// The Pages workflow runs the second form after a pull request is merged and commits the result.
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "contrib", "hooks");
const dataFile = join(root, "packages", "arabic-hooks", "src", "hooks-data.js");
const { CATEGORIES, DIALECTS } = await import(join(root, "packages", "arabic-hooks", "src", "index.js"));
const { default: hooks } = await import(join(root, "packages", "arabic-hooks", "src", "hooks-data.js"));

const KEYS = new Set(["category", "dialect", "ar", "en"]);
const squash = (s) => s.replace(/[\u064B-\u0652\u0640]/g, "").replace(/[^\p{L}\p{N}]+/gu, "");

/** Returns a list of problems with one parsed contribution (empty when it is fine). */
export function problems(entry, seen) {
  const out = [];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return ["the file must hold one JSON object"];
  for (const k of Object.keys(entry)) if (!KEYS.has(k)) out.push(`unknown field "${k}" (allowed: category, dialect, ar, en)`);
  if (!CATEGORIES.includes(entry.category)) out.push(`category must be one of ${CATEGORIES.join(", ")}`);
  if (!Object.hasOwn(DIALECTS, entry.dialect)) out.push(`dialect must be one of ${Object.keys(DIALECTS).join(", ")}`);
  if (typeof entry.ar !== "string" || !/[\u0600-\u06FF]/.test(entry.ar)) out.push(`"ar" must be the hook in Arabic`);
  else {
    if (entry.ar.length > 160) out.push(`"ar" is longer than 160 characters; a hook should be one short line`);
    if (/https?:\/\/|www\.|@\w/.test(entry.ar)) out.push(`"ar" must not contain links or mentions`);
    if (seen.has(squash(entry.ar))) out.push(`this hook is already in the dataset`);
  }
  if (entry.en !== undefined && (typeof entry.en !== "string" || entry.en.length > 200)) out.push(`"en" must be a short English translation (or left out)`);
  return out;
}

const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];
const seen = new Set(hooks.map((h) => squash(h.ar)));
const ids = new Set(hooks.map((h) => h.id));
const accepted = [];
let failed = false;

for (const f of files) {
  let entry;
  try {
    entry = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch (e) {
    console.error(`✗ contrib/hooks/${f}: not valid JSON (${e.message})`);
    failed = true;
    continue;
  }
  const p = problems(entry, seen);
  if (p.length) {
    for (const msg of p) console.error(`✗ contrib/hooks/${f}: ${msg}`);
    failed = true;
    continue;
  }
  seen.add(squash(entry.ar));
  accepted.push({ file: f, entry });
  console.log(`✓ contrib/hooks/${f}`);
}

if (failed) process.exit(1);
if (!files.length) console.log("No community hooks waiting in contrib/hooks/.");
if (process.argv.includes("--check") || !accepted.length) process.exit(0);

function nextId(category, dialect) {
  const prefix = dialect === "jo" ? `${category}-` : `${category}-${dialect}-`;
  let n = 1;
  for (const id of ids) {
    const m = id.startsWith(prefix) && id.slice(prefix.length).match(/^(\d{3})$/);
    if (m) n = Math.max(n, Number(m[1]) + 1);
  }
  const id = `${prefix}${String(n).padStart(3, "0")}`;
  ids.add(id);
  return id;
}

/** GitHub login of whoever added the file, from the commit's noreply email (or nothing). */
function author(file) {
  try {
    const [sha, email] = execFileSync("git", ["log", "--diff-filter=A", "--format=%H %ae", "-1", "--", join("contrib", "hooks", file)], { cwd: root, encoding: "utf8" }).trim().split(" ");
    let login = email?.match(/^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$/)?.[1];
    // In GitHub Actions, ask the API which account made the commit (works when the email is public too).
    if (!login && sha && process.env.GITHUB_REPOSITORY && process.env.GH_TOKEN) {
      login = execFileSync("gh", ["api", `repos/${process.env.GITHUB_REPOSITORY}/commits/${sha}`, "-q", ".author.login // empty"], { encoding: "utf8" }).trim() || undefined;
    }
    return login && /^[A-Za-z0-9-]+$/.test(login) && !/\[bot\]|^github-actions$/.test(login) ? login : undefined;
  } catch {
    return undefined;
  }
}

const blocks = accepted.map(({ file, entry }) => {
  const h = { id: nextId(entry.category, entry.dialect), category: entry.category, dialect: entry.dialect, ar: entry.ar.trim(), en: (entry.en ?? "").trim() };
  const by = author(file);
  if (by) h.by = by;
  return JSON.stringify(h, null, 2).replace(/^/gm, "  ");
});
const src = readFileSync(dataFile, "utf8");
const end = src.lastIndexOf("\n];");
if (end < 0) throw new Error("could not find the end of the hooks array");
writeFileSync(dataFile, `${src.slice(0, end)},\n${blocks.join(",\n")}${src.slice(end)}`);
for (const { file } of accepted) unlinkSync(join(dir, file));
console.log(`Merged ${accepted.length} community hook(s) into hooks-data.js`);

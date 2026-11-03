// Reads and validates the Arabic prompt library in prompts/*.md.
// Each file: frontmatter (title, category, for) and the prompt text as the body.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const PROMPT_CATEGORIES = Object.freeze({
  content: "صناعة محتوى",
  business: "شغل وبزنس",
  writing: "كتابة",
  learning: "تعليم",
  personal: "حياة يومية",
  tech: "تقنية",
});

const dir = fileURLToPath(new URL("../prompts/", import.meta.url));

/** Problems with one parsed prompt (empty when it is fine). */
export function promptProblems(p) {
  const out = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) out.push("file name must be lowercase latin letters, digits and dashes, ending in .md");
  if (!p.title || p.title.length > 60) out.push("title is required, 60 characters or fewer");
  if (!Object.hasOwn(PROMPT_CATEGORIES, p.category)) out.push(`category must be one of ${Object.keys(PROMPT_CATEGORIES).join(", ")}`);
  if (!p.for || p.for.length > 80) out.push('"for" is required: one short line, 80 characters or fewer');
  if (!p.body || p.body.length < 60) out.push("the prompt text is too short");
  if (p.body && p.body.length > 3000) out.push("the prompt text is longer than 3000 characters");
  if (p.body && !/[؀-ۿ]/.test(p.body)) out.push("the prompt must be written in Arabic");
  if (/<script|javascript:/i.test(`${p.title}${p.for}${p.body}`)) out.push("no HTML or scripts");
  return out;
}

export function parsePrompt(slug, text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!m) return { slug, title: "", category: "", for: "", body: "" };
  const field = (k) => m[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  return { slug, title: field("title"), category: field("category"), for: field("for"), body: m[2].trim() };
}

export function readPrompts() {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => parsePrompt(f.slice(0, -3), readFileSync(join(dir, f), "utf8")));
}

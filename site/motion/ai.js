// "Design it with ChatGPT or Claude": builds a prompt from the templates on this page, and turns
// the assistant's reply (a JSON block) back into scenes. No API keys: the person opens the chat
// themselves and pastes the answer, so it works with the free plans too.

/** The request we send. It lists every template and its text fields, so new templates show up here by themselves. */
export function buildPrompt(templates, idea, { hasVideo = false } = {}) {
  const list = templates
    .map((t) => {
      const fields = t.fields.filter((f) => f.type !== "image").map((f) => `${f.key}: ${f.label}`);
      return `- ${t.id} (${t.name}): ${fields.join("، ") || "بدون نص"}`;
    })
    .join("\n");
  return `إنت مصمم موشن جرافيك لريلز عربية. صمملي فيديو عن:
«${String(idea).trim() || "فكرة من عندك عن صناعة المحتوى"}»

استخدم هالقوالب بس (الاسم بالإنجليزي هو id):
${list}

القواعد:
- من 4 لـ 7 مشاهد. أول مشهد hook قوي بدون سلام ولا مقدمة، وآخر مشهد follow.
- اللهجة أردنية، جمل قصيرة بتنقرا بثانيتين.
- أي كلمة إنجليزية (AI, YouTube, Hook…) بالأحرف الإنجليزية، والأرقام إنجليزية 0-9.
- لا تخترع أرقام أو إحصائيات. إذا ما في رقم حقيقي، اختار قالب ما بيحتاج رقم.
- الحقول اللي فيها أكثر من عنصر: كل عنصر بسطر لحاله (\\n)، وافصل الأجزاء بـ |.
${hasVideo ? "- عندي فيديو، فحط لكل مشهد start بالثواني (متى يطلع).\n" : ""}
رد بـ JSON بس، بهالشكل بالضبط وبدون أي شرح:
{"scenes":[{"template":"hook","text":"…","keyword":"…"},{"template":"steps","title":"…","steps":"…\\n…\\n…"},{"template":"follow"}]}`;
}

/** Pulls the first JSON object or array out of a reply (with or without ``` fences). */
function extractJson(reply) {
  const s = String(reply);
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : s;
  const start = body.search(/[[{]/);
  if (start < 0) throw new Error("no json");
  // walk to the matching closing bracket, ignoring brackets inside strings
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return JSON.parse(body.slice(start, i + 1).replace(/[\u201C\u201D]/g, '"'));
    }
  }
  throw new Error("unclosed json");
}

/**
 * Turns the reply into scenes: [{ template, props, start }]. Unknown templates and fields are
 * skipped; text is cut to a sane length. Throws when nothing usable is found.
 */
export function parseDesign(reply, templates) {
  const data = extractJson(reply);
  const list = Array.isArray(data) ? data : Array.isArray(data?.scenes) ? data.scenes : null;
  if (!list) throw new Error("no scenes");
  const scenes = [];
  for (const raw of list.slice(0, 12)) {
    if (!raw || typeof raw !== "object") continue;
    const id = String(raw.template ?? raw.id ?? raw.type ?? "").trim().toLowerCase();
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) continue;
    const src = raw.props && typeof raw.props === "object" ? { ...raw, ...raw.props } : raw;
    const props = {};
    for (const f of tpl.fields) {
      if (f.type === "image") continue;
      let v = src[f.key];
      if (Array.isArray(v)) v = v.map((x) => (Array.isArray(x) ? x.join(" | ") : String(x))).join("\n");
      if (typeof v === "number") v = String(v);
      if (typeof v === "string") props[f.key] = v.replace(/\\n/g, "\n").slice(0, 600);
    }
    const start = Number(raw.start);
    scenes.push({ template: tpl, props, start: Number.isFinite(start) && start >= 0 ? start : null });
  }
  if (!scenes.length) throw new Error("no known templates");
  return scenes;
}

export const chatLinks = (prompt) => ({
  chatgpt: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  claude: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
});

import { enter, layoutWords, prog, ease, shake, ring } from "../engine.js";

export default {
  id: "hook",
  name: "هوك بالكلمات",
  description: "أول جملة بالفيديو، كلمة كلمة، والكلمة الأقوى بلونك مع هزة خفيفة.",
  duration: 3.2,
  fields: [
    { key: "text", label: "الهوك", type: "text", default: "الفرق بين مليون مشاهدة و100 مشاهدة… جملة وحدة" },
    { key: "keyword", label: "الكلمة الملونة", type: "text", default: "جملة" },
  ],
  cues: [
    { t: 0, sfx: "Riser" },
    { t: 0.35, sfx: "Deep Drop", note: "على أول كلمة قوية" },
  ],
  draw(ctx, t, props, env) {
    const size = env.u * (env.H > env.W ? 9.5 : 7.5);
    const words = layoutWords(ctx, env, props.text, size, env.W * 0.82);
    const kw = String(props.keyword || "").trim();
    const kwIndex = words.findIndex((w) => kw && w.word.replace(/[.,،…!?؟]/g, "").includes(kw));
    const step = Math.min(0.12, 1.9 / Math.max(1, words.length)); // long hooks: faster so every word lands
    const kwAt = 0.25 + Math.max(0, kwIndex) * step;
    ctx.save();
    enter(ctx, env, t);
    if (kwIndex >= 0) shake(ctx, env, t, kwAt, 1.2);
    const out = 1 - prog(t, 2.85, 0.35);
    for (const w of words) {
      const p = prog(t, 0.25 + w.i * step, 0.28);
      if (p <= 0) continue;
      const isKw = w.i === kwIndex;
      const s = 1 + (1 - ease.back(p)) * 0.45;
      ctx.save();
      ctx.globalAlpha = Math.min(p * 1.6, 1) * out;
      ctx.translate(w.x, w.y);
      ctx.scale(s, s);
      ctx.font = `800 ${size}px ${env.font}`;
      ctx.direction = env.rtl(w.word) ? "rtl" : "ltr";
      ctx.textAlign = "center";
      ctx.fillStyle = isKw ? env.accent : env.theme.ink;
      ctx.fillText(w.word, 0, 0);
      if (isKw) {
        const lp = ease.out(prog(t, kwAt + 0.15, 0.3));
        ctx.fillRect(-w.w / 2, size * 0.55, w.w * lp, size * 0.09);
      }
      ctx.restore();
    }
    ctx.restore();
    if (kwIndex >= 0) ring(ctx, env, env.W / 2, env.H * 0.72, prog(t, kwAt, 0.7));
  },
};

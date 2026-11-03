import { enter, prog, ease, text, wrapLines } from "../engine.js";

export default {
  id: "quote",
  name: "اقتباس",
  description: "جملة مهمة أو رأي حدا، بعلامات اقتباس كبيرة واسم صاحبها.",
  duration: 4,
  fields: [
    { key: "quote", label: "الجملة", type: "textarea", default: "أحسن وقت تبلش فيه كان امبارح، وثاني أحسن وقت هو اليوم." },
    { key: "author", label: "مين قالها (اختياري)", type: "text", default: "" },
  ],
  cues: [{ t: 0.2, sfx: "Whoosh" }],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 3.65, 0.35);
    const size = env.u * (env.H > env.W ? 6.6 : 5.4);
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    ctx.font = `700 ${size}px ${env.font}`;
    const lines = wrapLines(ctx, props.quote, env.W * 0.78);
    const lh = size * 1.45;
    const top = env.H / 2 - (lines.length * lh) / 2;
    const qp = ease.back(prog(t, 0.1, 0.4));
    ctx.save();
    ctx.globalAlpha *= Math.min(1, qp);
    text(ctx, env, "”", env.W / 2, top - size * 1.1, { size: size * 3.2 * (0.6 + 0.4 * qp), weight: 800, color: env.accent });
    ctx.restore();
    lines.forEach((ln, i) => {
      const p = prog(t, 0.35 + i * 0.22, 0.35);
      ctx.save();
      ctx.globalAlpha *= p;
      text(ctx, env, ln, env.W / 2, top + lh * (i + 0.5) + (1 - ease.out(p)) * env.u * 2, { size, weight: 700 });
      ctx.restore();
    });
    if (props.author) {
      ctx.save();
      ctx.globalAlpha *= prog(t, 0.6 + lines.length * 0.22, 0.4);
      text(ctx, env, props.author, env.W / 2, top + lines.length * lh + size * 0.9, { size: size * 0.7, weight: 600, color: env.theme.muted });
      ctx.restore();
    }
    ctx.restore();
  },
};

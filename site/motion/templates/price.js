import { enter, prog, ease, text, shake, ring } from "../engine.js";

export default {
  id: "price",
  name: "سعر",
  description: "السعر بيضرب على الشاشة، ومعه السعر القديم مشطوب إذا في خصم.",
  duration: 3.2,
  fields: [
    { key: "label", label: "فوق السعر", type: "text", default: "السعر بالإمارات" },
    { key: "price", label: "السعر", type: "text", default: "149,900" },
    { key: "currency", label: "العملة", type: "text", default: "AED" },
    { key: "old", label: "السعر القديم (اختياري)", type: "text", default: "" },
  ],
  cues: [{ t: 0.6, sfx: "Impact", note: "لما يضرب السعر" }],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 2.85, 0.35);
    const big = env.u * (env.H > env.W ? 17 : 13);
    ctx.save();
    enter(ctx, env, t);
    shake(ctx, env, t, 0.6, 1.2);
    ctx.globalAlpha *= out;
    text(ctx, env, props.label, env.W / 2, env.H / 2 - big * 1.05, { size: env.u * 5.2, weight: 700, color: env.theme.muted });
    const p = prog(t, 0.45, 0.25);
    const s = 1.6 - 0.6 * ease.out(p);
    ctx.save();
    ctx.translate(env.W / 2, env.H / 2);
    ctx.scale(s, s);
    ctx.globalAlpha *= Math.min(1, p * 2);
    text(ctx, env, props.price, 0, 0, { size: big, weight: 800, color: env.accent });
    ctx.restore();
    text(ctx, env, props.currency, env.W / 2, env.H / 2 + big * 0.85, { size: env.u * 6, weight: 800 });
    if (props.old) {
      const op = prog(t, 1.0, 0.35);
      ctx.save();
      ctx.globalAlpha *= op;
      const oy = env.H / 2 + big * 1.45;
      text(ctx, env, props.old, env.W / 2, oy, { size: env.u * 5, weight: 600, color: env.theme.muted });
      ctx.font = `600 ${env.u * 5}px ${env.font}`;
      const ow = ctx.measureText(props.old).width;
      ctx.fillStyle = env.danger;
      ctx.fillRect(env.W / 2 - (ow / 2) * ease.out(op), oy - env.u * 0.3, ow * ease.out(op), env.u * 0.6);
      ctx.restore();
    }
    ctx.restore();
    ring(ctx, env, env.W / 2, env.H / 2 + big * 1.9, prog(t, 0.6, 0.8));
  },
};

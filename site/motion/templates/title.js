import { enter, prog, ease, text } from "../engine.js";

export default {
  id: "title",
  name: "عنوان كبير",
  description: "عنوان قسم جديد بالفيديو، مع رقم صغير وخط بيرسم تحته.",
  duration: 2.8,
  fields: [
    { key: "kicker", label: "فوق العنوان (اختياري)", type: "text", default: "الخطوة 1" },
    { key: "title", label: "العنوان", type: "text", default: "الهوك" },
    { key: "sub", label: "تحت العنوان (اختياري)", type: "text", default: "أول 3 ثواني بتقرر كل إشي" },
  ],
  cues: [{ t: 0.1, sfx: "Whoosh" }, { t: 0.45, sfx: "Pop" }],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 2.45, 0.35);
    const big = env.u * (env.H > env.W ? 15 : 12);
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    const kp = ease.out(prog(t, 0.15, 0.4));
    if (props.kicker) {
      ctx.save();
      ctx.globalAlpha *= kp;
      text(ctx, env, props.kicker, env.W / 2, env.H / 2 - big * 0.95 + (1 - kp) * env.u * 3, { size: env.u * 4.6, weight: 700, color: env.accent });
      ctx.restore();
    }
    const tp = ease.back(prog(t, 0.3, 0.45));
    ctx.save();
    ctx.translate(env.W / 2, env.H / 2);
    ctx.scale(0.7 + 0.3 * tp, 0.7 + 0.3 * tp);
    ctx.globalAlpha *= Math.min(1, tp * 1.5);
    text(ctx, env, props.title, 0, 0, { size: big, weight: 800 });
    ctx.restore();
    ctx.font = `800 ${big}px ${env.font}`;
    const w = Math.min(ctx.measureText(props.title).width, env.W * 0.8);
    const lp = ease.inOut(prog(t, 0.6, 0.5));
    ctx.fillStyle = env.accent;
    ctx.fillRect(env.W / 2 - (w / 2) * lp, env.H / 2 + big * 0.62, w * lp, env.u * 0.9);
    if (props.sub) {
      ctx.save();
      ctx.globalAlpha *= prog(t, 0.85, 0.4);
      text(ctx, env, props.sub, env.W / 2, env.H / 2 + big * 1.15, { size: env.u * 4.8, weight: 600, color: env.theme.muted });
      ctx.restore();
    }
    ctx.restore();
  },
};

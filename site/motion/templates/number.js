import { enter, prog, ease, shake, ring, text } from "../engine.js";

export default {
  id: "number",
  name: "رقم كبير",
  description: "الرقم بيعدّ لحد ما يوصل، وبيضرب مع صوت Impact. للنتايج والإحصائيات.",
  duration: 3.2,
  fields: [
    { key: "label", label: "فوق الرقم", type: "text", default: "جربت iPhone لمدة" },
    { key: "number", label: "الرقم", type: "number", default: "30" },
    { key: "suffix", label: "بعد الرقم", type: "text", default: "يوم" },
  ],
  cues: [
    { t: 0.3, sfx: "Whoosh" },
    { t: 1.3, sfx: "Impact", note: "لما يوقف الرقم" },
  ],
  draw(ctx, t, props, env) {
    const raw = String(props.number ?? "").replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x660).replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x6f0).replace(/٫/g, ".");
    const clean = raw.replace(/[^0-9.-]/g, "");
    const target = Number(clean) || 0;
    const decimals = (clean.split(".")[1] || "").length;
    const p = ease.out(prog(t, 0.3, 1.0));
    const value = (target * p).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const out = 1 - prog(t, 2.85, 0.35);
    ctx.save();
    enter(ctx, env, t);
    shake(ctx, env, t, 1.3, 1.4);
    ctx.globalAlpha *= out;
    const big = env.u * (env.H > env.W ? 34 : 26);
    const hit = prog(t, 1.3, 0.25);
    const pop = 1 + Math.sin(Math.PI * hit) * 0.08;
    text(ctx, env, props.label, env.W / 2, env.H / 2 - big * 0.85, { size: env.u * 6.5, weight: 700, color: env.theme.muted });
    ctx.save();
    ctx.translate(env.W / 2, env.H / 2 + big * 0.05);
    ctx.scale(pop, pop);
    text(ctx, env, `${value}`, 0, 0, { size: big, weight: 800, color: env.accent });
    ctx.restore();
    text(ctx, env, props.suffix, env.W / 2, env.H / 2 + big * 0.85, { size: env.u * 9, weight: 800 });
    ctx.restore();
    ring(ctx, env, env.W / 2, env.H / 2 + big * 1.4, prog(t, 1.3, 0.8));
  },
};

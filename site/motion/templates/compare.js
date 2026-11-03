import { enter, prog, ease, text, card } from "../engine.js";

export default {
  id: "compare",
  name: "مقارنة",
  description: "شغلتين جنب بعض (سيارتين، تلفونين، خطتين)، وكل سطر بيطلع لحاله والأحسن بلونك.",
  duration: 5,
  fields: [
    { key: "a", label: "الأول", type: "text", default: "تلفون A" },
    { key: "b", label: "الثاني", type: "text", default: "تلفون B" },
    { key: "rows", label: "الأسطر: الاسم | الأول | الثاني (حط * جنب الأحسن)", type: "textarea", default: "السعر | أرخص* | أغلى\nالبطارية | يوم كامل* | نص يوم\nالكاميرا | منيحة | أقوى*" },
  ],
  cues: [{ t: 0.1, sfx: "Whoosh" }, { t: 0.8, sfx: "Pop", note: "مع كل سطر" }],
  draw(ctx, t, props, env) {
    const rows = String(props.rows).split("\n").map((r) => r.split("|").map((c) => c.trim())).filter((r) => r.length >= 3).slice(0, 6);
    const out = 1 - prog(t, 4.65, 0.35);
    const w = env.W * 0.88;
    const x = (env.W - w) / 2;
    const rowH = env.u * 11;
    const headH = env.u * 12;
    const h = headH + rows.length * rowH + env.u * 4;
    const y = env.H / 2 - h / 2;
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    card(ctx, env, x, y, w, h, null);
    // columns: label (start side), A, B — right to left
    const colLabel = x + w - env.u * 5;
    const colA = x + w * 0.45;
    const colB = x + w * 0.18;
    text(ctx, env, props.a, colA, y + headH / 2 + env.u, { size: env.u * 4.4, weight: 800 });
    text(ctx, env, props.b, colB, y + headH / 2 + env.u, { size: env.u * 4.4, weight: 800 });
    ctx.fillStyle = env.theme.muted;
    ctx.globalAlpha *= 0.3;
    ctx.fillRect(x + env.u * 4, y + headH, w - env.u * 8, env.u * 0.3);
    ctx.globalAlpha /= 0.3;
    rows.forEach((r, i) => {
      const p = prog(t, 0.8 + i * 0.5, 0.35);
      if (p <= 0) return;
      const ry = y + headH + env.u * 2 + i * rowH + rowH / 2;
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate(0, (1 - ease.out(p)) * env.u * 3);
      text(ctx, env, r[0], colLabel, ry, { size: env.u * 4, weight: 600, color: env.theme.muted, align: "right" });
      for (const [val, cx] of [[r[1], colA], [r[2], colB]]) {
        const best = val.endsWith("*");
        const v = best ? val.slice(0, -1).trim() : val;
        if (best) {
          ctx.save();
          ctx.fillStyle = env.accent;
          ctx.globalAlpha *= 0.16;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(cx - w * 0.12, ry - rowH * 0.36, w * 0.24, rowH * 0.72, env.u * 2) : ctx.rect(cx - w * 0.12, ry - rowH * 0.36, w * 0.24, rowH * 0.72);
          ctx.fill();
          ctx.restore();
        }
        text(ctx, env, v, cx, ry, { size: env.u * 4.6, weight: 800, color: best ? env.accent : env.theme.ink });
      }
      ctx.restore();
    });
    ctx.restore();
  },
};

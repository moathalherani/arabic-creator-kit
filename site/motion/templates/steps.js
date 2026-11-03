import { enter, prog, ease, text, card } from "../engine.js";

export default {
  id: "steps",
  name: "خطوات",
  description: "عنوان وخطوات بتطلع وحدة وحدة مع رقم لكل خطوة.",
  duration: 4.5,
  fields: [
    { key: "title", label: "العنوان", type: "text", default: "3 خطوات لهوك قوي" },
    { key: "steps", label: "الخطوات (كل خطوة بسطر)", type: "textarea", default: "شيل السلام\nابدأ بالفكرة\nحط سؤال أو رقم" },
  ],
  cues: [
    { t: 0.1, sfx: "Whoosh" },
    { t: 0.7, sfx: "Pop", note: "مع كل خطوة" },
  ],
  draw(ctx, t, props, env) {
    const steps = String(props.steps).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    const out = 1 - prog(t, 4.15, 0.35);
    const rowH = env.u * 15;
    const total = env.u * 18 + steps.length * rowH;
    const top = env.H / 2 - total / 2;
    const w = env.W * 0.82;
    const x = (env.W - w) / 2;
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    text(ctx, env, props.title, env.W / 2, top + env.u * 5, { size: env.u * 7.5, weight: 800 });
    steps.forEach((s, i) => {
      const p = prog(t, 0.7 + i * 0.55, 0.35);
      if (p <= 0) return;
      const y = top + env.u * 16 + i * rowH;
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate((1 - ease.out(p)) * env.u * 12, 0);
      card(ctx, env, x, y, w, rowH - env.u * 3, null);
      const bx = x + w - env.u * 7.5;
      const by = y + (rowH - env.u * 3) / 2;
      ctx.fillStyle = env.accent;
      ctx.beginPath();
      ctx.arc(bx, by, env.u * 4, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, env, String(i + 1), bx, by + env.u * 0.3, { size: env.u * 4.6, weight: 800, color: "#fff" });
      text(ctx, env, s, bx - env.u * 7, by, { size: env.u * 5.4, weight: 700, align: "right" });
      ctx.restore();
    });
    ctx.restore();
  },
};

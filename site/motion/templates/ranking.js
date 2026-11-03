import { enter, prog, ease, text, card, shake } from "../engine.js";

// Top-N countdown: the last place shows first, number 1 lands last with a hit.
export default {
  id: "ranking",
  name: "أفضل 3",
  description: "ترتيب بيطلع من الأخير للأول، ورقم 1 بيضرب بالآخر.",
  duration: 5,
  fields: [
    { key: "title", label: "العنوان", type: "text", default: "أفضل 3 أدوات مجانية لصناع المحتوى" },
    { key: "items", label: "الترتيب (رقم 1 أول سطر)", type: "textarea", default: "استوديو الموشن\nالكابشن الأوتوماتيك\nمكتبة البرومبتات" },
  ],
  cues: [
    { t: 0.1, sfx: "Whoosh" },
    { t: 0.8, sfx: "Pop", note: "مع كل مركز" },
    { t: 2.65, sfx: "Deep Drop", note: "رقم 1" },
  ],
  draw(ctx, t, props, env) {
    const items = String(props.items ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 5);
    const n = items.length;
    const u = env.u;
    const out = 1 - prog(t, this.duration - 0.35, 0.35);
    // reveal times: last place first; number 1 waits a beat longer
    const at = (i) => (i === 0 ? 0.8 + (n - 1) * 0.6 + 0.25 : 0.8 + (n - 1 - i) * 0.6);
    const rowH = u * 15;
    const firstH = u * 19;
    const w = Math.min(env.W * 0.84, u * 90);
    const x = (env.W - w) / 2;
    const total = u * 16 + firstH + (n - 1) * rowH;
    const top = env.H / 2 - total / 2;
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    if (n) shake(ctx, env, t, at(0), 1.2);
    // shrink the title until it fits on one line
    let ts = u * (n > 3 ? 6 : 6.8);
    ctx.font = `800 ${ts}px ${env.font}`;
    const tw = ctx.measureText(String(props.title ?? "")).width;
    if (tw > w) ts *= w / tw;
    text(ctx, env, props.title, env.W / 2, top + u * 5, { size: ts, weight: 800 });
    items.forEach((item, i) => {
      const p = prog(t, at(i), i === 0 ? 0.4 : 0.32);
      if (p <= 0) return;
      const big = i === 0;
      const h = (big ? firstH : rowH) - u * 3;
      const y = top + u * 16 + (big ? 0 : firstH + (i - 1) * rowH);
      ctx.save();
      ctx.globalAlpha *= Math.min(1, p * 2);
      const s = big ? 0.7 + 0.3 * ease.back(p) : 1;
      ctx.translate(env.W / 2, y + h / 2);
      ctx.scale(s, s);
      ctx.translate(-env.W / 2, -(y + h / 2));
      if (!big) ctx.translate((1 - ease.out(p)) * -u * 14, 0);
      card(ctx, env, x, y, w, h, big ? env.accent : null);
      const r = big ? u * 6 : u * 4.4;
      const bx = x + w - u * 4 - r;
      const by = y + h / 2;
      ctx.fillStyle = big ? env.accent : env.theme.bg;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, env, String(i + 1), bx, by + u * 0.4, { size: r * 1.15, weight: 800, color: big ? env.onAccent : env.theme.ink });
      ctx.font = `800 ${big ? u * 6 : u * 5}px ${env.font}`;
      let label = item;
      const maxW = bx - r - u * 3 - (x + u * 3);
      while (label.length > 4 && ctx.measureText(label).width > maxW) label = label.slice(0, -2);
      if (label !== item) label = `${label.trim()}…`;
      text(ctx, env, label, bx - r - u * 3, by, { size: big ? u * 6 : u * 5, weight: 800, align: "right" });
      ctx.restore();
    });
    ctx.restore();
  },
};

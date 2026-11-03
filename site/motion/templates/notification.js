import { enter, prog, ease, text, card, roundRect } from "../engine.js";

// Phone notifications dropping in one after the other: "this is what happened after…".
export default {
  id: "notification",
  name: "إشعارات",
  description: "إشعارات تلفون بتنزل ورا بعض، للنتيجة أو المفاجأة.",
  duration: 4.6,
  fields: [
    { key: "title", label: "العنوان فوق (اختياري)", type: "text", default: "بعد أسبوع من الطريقة هاي" },
    { key: "items", label: "الإشعارات (كل سطر: التطبيق | الرسالة)", type: "textarea", default: "إنستغرام | الريل تبعك وصل 100 ألف مشاهدة\nالإيميل | براند بدو يتعاون معك\nتيك توك | 500 متابع جديد اليوم" },
  ],
  cues: [
    { t: 0.45, sfx: "Notification", note: "مع كل إشعار" },
    { t: 1.15, sfx: "Notification" },
    { t: 1.85, sfx: "Notification" },
  ],
  draw(ctx, t, props, env) {
    const items = String(props.items ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((l) => {
        const [app, ...rest] = l.split("|");
        return rest.length ? { app: app.trim(), msg: rest.join("|").trim() } : { app: "", msg: app.trim() };
      });
    const out = 1 - prog(t, this.duration - 0.35, 0.35);
    const u = env.u;
    const w = Math.min(env.W * 0.86, u * 92);
    const h = u * 15.5;
    const gap = u * 3;
    const hasTitle = String(props.title ?? "").trim() !== "";
    const titleH = hasTitle ? u * 13 : 0;
    const total = titleH + items.length * h + (items.length - 1) * gap;
    const top = env.H / 2 - total / 2;
    const x = (env.W - w) / 2;
    ctx.save();
    enter(ctx, env, t, 0.35);
    ctx.globalAlpha *= out;
    if (hasTitle) text(ctx, env, props.title, env.W / 2, top + u * 4, { size: u * 6.4, weight: 800 });
    items.forEach((it, i) => {
      const at = 0.45 + i * 0.7;
      const p = prog(t, at, 0.42);
      if (p <= 0) return;
      const y = top + titleH + i * (h + gap);
      ctx.save();
      ctx.globalAlpha *= Math.min(1, p * 2.2);
      ctx.translate(0, -(1 - ease.back(p)) * u * 16);
      // the newest one glows for a moment
      const glow = 1 - prog(t, at + 0.2, 0.6);
      card(ctx, env, x, y, w, h, glow > 0 ? env.accent : null);
      const icon = u * 9;
      const ix = x + w - u * 3 - icon;
      const iy = y + (h - icon) / 2;
      roundRect(ctx, ix, iy, icon, icon, u * 2.4);
      ctx.fillStyle = env.accent;
      ctx.fill();
      const letter = (it.app || it.msg).trim().charAt(0);
      text(ctx, env, letter, ix + icon / 2, iy + icon / 2 + u * 0.3, { size: u * 4.8, weight: 800, color: env.onAccent });
      const tx = ix - u * 3;
      const maxW = tx - (x + u * 3);
      if (it.app) {
        text(ctx, env, it.app, tx, y + h * 0.33, { size: u * 3.3, weight: 700, color: env.theme.muted, align: "right" });
        text(ctx, env, "الآن", x + u * 3.5, y + h * 0.33, { size: u * 3, weight: 600, color: env.theme.muted, align: "left" });
      }
      ctx.font = `800 ${u * 4.3}px ${env.font}`;
      let msg = it.msg;
      while (msg.length > 4 && ctx.measureText(msg).width > maxW) msg = msg.slice(0, -2);
      if (msg !== it.msg) msg = `${msg.trim()}…`;
      text(ctx, env, msg, tx, y + (it.app ? h * 0.66 : h / 2), { size: u * 4.3, weight: 800, align: "right" });
      ctx.restore();
    });
    ctx.restore();
  },
};

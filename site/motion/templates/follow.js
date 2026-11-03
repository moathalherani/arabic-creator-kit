import { enter, prog, ease, card, text } from "../engine.js";

export default {
  id: "follow",
  name: "تابعني",
  description: "كرت باسمك وحسابك وزر تابعني، لآخر الفيديو.",
  duration: 3.2,
  fields: [
    { key: "image", label: "صورتك (اختياري)", type: "image" },
    { key: "name", label: "الاسم", type: "text", default: "المهندس معاذ الهريني" },
    { key: "handle", label: "الحساب", type: "text", default: "@moath.alherani" },
    { key: "cta", label: "الزر", type: "text", default: "تابعني" },
  ],
  cues: [
    { t: 0.3, sfx: "Pop" },
    { t: 1.2, sfx: "UI Click", note: "على الزر" },
  ],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 2.85, 0.35);
    const p = prog(t, 0.2, 0.5);
    const w = env.W * 0.8;
    const h = env.u * 44;
    const x = (env.W - w) / 2;
    const y = env.H / 2 - h / 2 + (1 - ease.back(p)) * env.u * 20;
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out * Math.min(1, p * 2);
    card(ctx, env, x, y, w, h, env.accent);
    const r = env.u * 9;
    const ax = env.W / 2;
    const ay = y + env.u * 12;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.clip();
    if (props.image && props.image.width) {
      const s = Math.max((r * 2) / props.image.width, (r * 2) / props.image.height);
      ctx.drawImage(props.image, ax - (props.image.width * s) / 2, ay - (props.image.height * s) / 2, props.image.width * s, props.image.height * s);
    } else {
      ctx.fillStyle = env.accent;
      ctx.fillRect(ax - r, ay - r, r * 2, r * 2);
      text(ctx, env, String(props.name || "؟").replace(/^المهندس\s+/, "").trim().charAt(0), ax, ay + env.u, { size: env.u * 9, weight: 800, color: env.onAccent });
    }
    ctx.restore();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = env.u * 0.8;
    ctx.beginPath();
    ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, env, props.name, env.W / 2, y + env.u * 26, { size: env.u * 5.4, weight: 800 });
    text(ctx, env, props.handle, env.W / 2, y + env.u * 32, { size: env.u * 4, weight: 600, color: env.theme.muted });
    const bp = prog(t, 1.2, 0.3);
    const bs = 1 - Math.sin(Math.PI * bp) * 0.08;
    ctx.save();
    ctx.translate(env.W / 2, y + env.u * 39.5);
    ctx.scale(bs, bs);
    ctx.fillStyle = env.accent;
    const bw = env.u * 30;
    const bh = env.u * 7;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2) : ctx.rect(-bw / 2, -bh / 2, bw, bh);
    ctx.fill();
    text(ctx, env, props.cta, 0, env.u * 0.4, { size: env.u * 4.4, weight: 800, color: env.onAccent });
    ctx.restore();
    ctx.restore();
  },
};

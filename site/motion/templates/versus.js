import { enter, prog, ease, card, wrapLines, text } from "../engine.js";

function drawCard(ctx, env, y, label, body, color, mark, p, dim) {
  const w = env.W * 0.84;
  const x = (env.W - w) / 2;
  ctx.font = `700 ${env.u * 5.6}px "${env.font}"`;
  const lines = wrapLines(ctx, body, w - env.u * 22);
  const h = env.u * 17 + lines.length * env.u * 7.2;
  ctx.save();
  ctx.globalAlpha = p * (dim ? 0.45 : 1);
  ctx.translate((1 - ease.out(p)) * env.W * 0.3 * (mark === "x" ? 1 : -1), 0);
  card(ctx, env, x, y, w, h, color);
  // badge with ✗ or ✓
  const bx = x + w - env.u * 9;
  const by = y + env.u * 9;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(bx, by, env.u * 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = env.u * 1.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (mark === "x") {
    const d = env.u * 1.8;
    ctx.moveTo(bx - d, by - d); ctx.lineTo(bx + d, by + d);
    ctx.moveTo(bx + d, by - d); ctx.lineTo(bx - d, by + d);
  } else {
    ctx.moveTo(bx - env.u * 2, by); ctx.lineTo(bx - env.u * 0.5, by + env.u * 1.7); ctx.lineTo(bx + env.u * 2.2, by - env.u * 1.6);
  }
  ctx.stroke();
  text(ctx, env, label, bx - env.u * 8, by, { size: env.u * 4.2, weight: 800, color, align: "right" });
  lines.forEach((ln, i) => text(ctx, env, ln, x + w - env.u * 6, y + env.u * 19.5 + i * env.u * 7.2, { size: env.u * 5.6, weight: 700, align: "right" }));
  if (dim) {
    ctx.strokeStyle = color;
    ctx.lineWidth = env.u * 0.5;
    ctx.beginPath();
    ctx.moveTo(x + env.u * 5, y + h / 2);
    ctx.lineTo(x + w - env.u * 5, y + h / 2);
    ctx.stroke();
  }
  ctx.restore();
  return h;
}

export default {
  id: "versus",
  name: "مشكلة وحل",
  description: "كرت أحمر للغلط، بعده كرت أخضر للحل. الألوان بتوصل الفكرة من غير صوت.",
  duration: 4,
  fields: [
    { key: "problem", label: "المشكلة", type: "text", default: "بتبدأ الفيديو بـ «مرحبا يا جماعة»" },
    { key: "solution", label: "الحل", type: "text", default: "ابدأ بالفكرة مباشرة وحط سؤال" },
  ],
  cues: [
    { t: 0.2, sfx: "Glitch", note: "مع الكرت الأحمر" },
    { t: 1.6, sfx: "Ding", note: "مع الكرت الأخضر" },
  ],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 3.65, 0.35);
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    const top = env.H * (env.H > env.W ? 0.3 : 0.16);
    const h1 = drawCard(ctx, env, top, "الغلط", props.problem, env.danger, "x", prog(t, 0.2, 0.45), t > 1.6);
    drawCard(ctx, env, top + h1 + env.u * 6, "الحل", props.solution, env.accent, "v", prog(t, 1.6, 0.45), false);
    ctx.restore();
  },
};

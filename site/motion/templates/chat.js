import { enter, prog, ease, text, card, roundRect, wrapLines } from "../engine.js";

// "I asked the AI…": your question pops in, the assistant types, then the answer writes itself.
export default {
  id: "chat",
  name: "سألت الذكاء الاصطناعي",
  description: "سؤالك ورد الذكاء الاصطناعي بينكتب حرف حرف.",
  duration: 5.4,
  fields: [
    { key: "name", label: "اسم المساعد", type: "text", default: "الذكاء الاصطناعي" },
    { key: "question", label: "سؤالك", type: "text", default: "اكتبلي هوك لريل عن الإنتاجية" },
    { key: "answer", label: "الرد", type: "textarea", default: "«بتصحى الساعة 5 وما بتخلص إشي؟ المشكلة مش بالوقت.»" },
  ],
  cues: [
    { t: 0.35, sfx: "Message Sent" },
    { t: 1.75, sfx: "Typing", note: "لحد ما يخلص الرد" },
  ],
  draw(ctx, t, props, env) {
    const u = env.u;
    const out = 1 - prog(t, this.duration - 0.35, 0.35);
    const w = Math.min(env.W * 0.88, u * 94);
    const x = (env.W - w) / 2;
    const size = u * 4.4;
    const pad = u * 3.2;
    const bubbleMax = w * 0.78;
    ctx.font = `700 ${size}px ${env.font}`;
    const qLines = wrapLines(ctx, props.question ?? "", bubbleMax - pad * 2).slice(0, 3);
    const answer = String(props.answer ?? "");
    const aLines = wrapLines(ctx, answer, bubbleMax - pad * 2).slice(0, 6);
    const lh = size * 1.45;
    const qH = qLines.length * lh + pad * 1.6;
    const aH = Math.max(1, aLines.length) * lh + pad * 1.6;
    const headH = u * 13;
    const h = headH + u * 5 + qH + u * 4 + aH + u * 6;
    const y = env.H / 2 - h / 2;
    ctx.save();
    enter(ctx, env, t);
    ctx.globalAlpha *= out;
    card(ctx, env, x, y, w, h, null);
    // header: avatar + name + "online"
    const av = u * 4;
    const ax = x + w - u * 4 - av;
    const ay = y + headH / 2;
    ctx.fillStyle = env.accent;
    ctx.beginPath();
    ctx.arc(ax, ay, av, 0, Math.PI * 2);
    ctx.fill();
    // a small spark in the avatar
    ctx.save();
    ctx.translate(ax, ay);
    ctx.fillStyle = env.onAccent;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? av * 0.22 : av * 0.62;
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const typing = t > 1.1 && t < 1.85;
    text(ctx, env, props.name, ax - av - u * 2.5, ay - u * 1.6, { size: u * 4, weight: 800, align: "right" });
    text(ctx, env, typing ? "عم يكتب…" : "متصل", ax - av - u * 2.5, ay + u * 2.6, { size: u * 3, weight: 600, align: "right", color: typing ? env.accent : env.theme.muted });
    ctx.fillStyle = env.theme.line ?? "rgba(0,0,0,0.08)";
    ctx.fillRect(x, y + headH, w, Math.max(1, u * 0.15));
    // your question: on the left (outgoing side in Arabic chat apps)
    const qp = prog(t, 0.35, 0.3);
    const qy = y + headH + u * 5;
    ctx.font = `700 ${size}px ${env.font}`;
    const qW = Math.min(bubbleMax, Math.max(...qLines.map((l) => ctx.measureText(l).width), u * 10) + pad * 2);
    if (qp > 0) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, qp * 2);
      const qx = x + u * 4;
      ctx.translate(qx, qy + qH);
      ctx.scale(0.8 + 0.2 * ease.back(qp), 0.8 + 0.2 * ease.back(qp));
      ctx.translate(-qx, -(qy + qH));
      roundRect(ctx, qx, qy, qW, qH, u * 3.4);
      ctx.fillStyle = env.accent;
      ctx.fill();
      qLines.forEach((l, i) => text(ctx, env, l, qx + qW - pad, qy + pad * 0.8 + lh * (i + 0.5), { size, weight: 700, align: "right", color: env.onAccent }));
      ctx.restore();
    }
    // the reply bubble: dots first, then the text writes itself
    const ay2 = qy + qH + u * 4;
    const rx = x + w - u * 4;
    if (t > 1.1) {
      const shown = Math.floor(answer.length * prog(t, 1.85, Math.min(2.2, 0.35 + answer.length * 0.035)));
      ctx.font = `700 ${size}px ${env.font}`;
      const full = Math.min(bubbleMax, Math.max(...aLines.map((l) => ctx.measureText(l).width), u * 14) + pad * 2);
      const bw = t < 1.85 ? u * 16 : full;
      const bh = t < 1.85 ? u * 9 : aH;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, prog(t, 1.1, 0.2) * 2);
      roundRect(ctx, rx - bw, ay2, bw, bh, u * 3.4);
      ctx.fillStyle = env.theme.bg;
      ctx.fill();
      if (t < 1.85) {
        for (let k = 0; k < 3; k++) {
          const b = Math.max(0, Math.sin((t - 1.1) * 9 - k * 0.9));
          ctx.fillStyle = env.theme.muted;
          ctx.beginPath();
          ctx.arc(rx - bw / 2 + (k - 1) * u * 3, ay2 + bh / 2 - b * u * 1, u * 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        let left = shown;
        aLines.forEach((l, i) => {
          if (left <= 0) return;
          const part = l.slice(0, left);
          left -= l.length + 1;
          text(ctx, env, part, rx - pad, ay2 + pad * 0.8 + lh * (i + 0.5), { size, weight: 700, align: "right" });
        });
      }
      ctx.restore();
    }
    ctx.restore();
  },
};

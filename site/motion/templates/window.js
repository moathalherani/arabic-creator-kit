import { enter, prog, ease, roundRect, text } from "../engine.js";

export default {
  id: "window",
  name: "جوا برنامج",
  description: "المثال الحقيقي (صورة أو سكرين شوت) جوا نافذة برنامج، كأنك بتعمل مونتاج قدام الناس.",
  duration: 4,
  fields: [
    { key: "image", label: "صورة أو سكرين شوت", type: "image" },
    { key: "title", label: "اسم النافذة", type: "text", default: "المشروع" },
    { key: "caption", label: "تحت النافذة", type: "text", default: "هيك بيطلع بالآخر" },
  ],
  cues: [
    { t: 0, sfx: "Whoosh" },
    { t: 0.6, sfx: "UI Click" },
  ],
  draw(ctx, t, props, env) {
    const out = 1 - prog(t, 3.65, 0.35);
    const w = env.W * 0.86;
    const h = Math.min(w * 0.68, env.H * 0.55);
    const x = (env.W - w) / 2;
    const y = env.H / 2 - h / 2 - env.u * 4;
    const bar = env.u * 6;
    ctx.save();
    enter(ctx, env, t, 0.55);
    ctx.globalAlpha *= out;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = env.u * 6;
    ctx.shadowOffsetY = env.u * 2;
    roundRect(ctx, x, y, w, h, env.u * 2.6);
    ctx.fillStyle = "#16181B";
    ctx.fill();
    ctx.restore();
    // traffic lights + title
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + env.u * (4 + i * 3.2), y + bar / 2, env.u * 1, 0, Math.PI * 2);
      ctx.fill();
    });
    text(ctx, env, props.title, env.W / 2, y + bar / 2, { size: env.u * 2.8, weight: 600, color: "#C9CDD2" });
    // content
    ctx.save();
    roundRect(ctx, x + env.u, y + bar, w - env.u * 2, h - bar - env.u, env.u * 1.6);
    ctx.clip();
    const img = props.image;
    if (img && img.width) {
      const zoom = 1 + ease.inOut(prog(t, 0.4, 3.2)) * 0.08;
      const cw = w - env.u * 2;
      const ch = h - bar - env.u;
      const s = Math.max(cw / img.width, ch / img.height) * zoom;
      ctx.drawImage(img, x + env.u + (cw - img.width * s) / 2, y + bar + (ch - img.height * s) / 2, img.width * s, img.height * s);
    } else {
      ctx.fillStyle = "#22262A";
      ctx.fillRect(x, y + bar, w, h);
      text(ctx, env, "حط صورة أو سكرين شوت من الخانة", env.W / 2, y + h / 2 + bar / 2, { size: env.u * 3.6, weight: 600, color: "#8B939B" });
    }
    ctx.restore();
    // timeline strip with the accent block reaching the playhead
    const ty = y + h + env.u * 3;
    const tp = ease.out(prog(t, 0.6, 1.4));
    roundRect(ctx, x, ty, w, env.u * 3, env.u * 1.5);
    ctx.fillStyle = "rgba(127,127,127,0.18)";
    ctx.fill();
    roundRect(ctx, x, ty, w * 0.62 * tp, env.u * 3, env.u * 1.5);
    ctx.fillStyle = env.accent;
    ctx.fill();
    text(ctx, env, props.caption, env.W / 2, ty + env.u * 11, { size: env.u * 6, weight: 800 });
    ctx.restore();
  },
};

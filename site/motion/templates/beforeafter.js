import { enter, prog, ease, roundRect, text } from "../engine.js";

/** Draw an image to fill a rect (object-fit: cover), zoomed from the centre. */
function cover(ctx, img, x, y, w, h, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * zoom;
  ctx.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
}
const ok = (img) => img && (img.naturalWidth || img.width);

/** Small picture icon for the empty state. */
function pictureIcon(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.08;
  ctx.lineJoin = "round";
  roundRect(ctx, x - s / 2, y - s * 0.38, s, s * 0.76, s * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + s * 0.2, y - s * 0.13, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.36, y + s * 0.26);
  ctx.lineTo(x - s * 0.1, y - s * 0.04);
  ctx.lineTo(x + s * 0.08, y + s * 0.14);
  ctx.lineTo(x + s * 0.2, y + s * 0.04);
  ctx.lineTo(x + s * 0.36, y + s * 0.26);
  ctx.stroke();
  ctx.restore();
}

/** Label pill. */
function pill(ctx, env, label, x, y, size, bg, fg, alignRight) {
  ctx.font = `700 ${size}px ${env.font}`;
  const w = ctx.measureText(label).width + size * 1.8;
  const h = size * 2;
  const px = alignRight ? x - w : x;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = size * 0.6;
  ctx.shadowOffsetY = size * 0.15;
  roundRect(ctx, px, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();
  text(ctx, env, label, px + w / 2, y + h / 2 + size * 0.04, { size, weight: 700, color: fg });
}

const SWEEP = 0.8; // handle starts moving right to left
const BACK = 2.55; // handle comes back to the middle
const END = 3.25; // settles

export default {
  id: "beforeafter",
  name: "قبل وبعد",
  description: "صورتين بكرت واحد، وخط بيمسح من اليمين لليسار وبيكشف \"بعد\" فوق \"قبل\". للتعديل، الترتيب، النتيجة.",
  duration: 4.4,
  fields: [
    { key: "before", label: "صورة قبل", type: "image" },
    { key: "after", label: "صورة بعد", type: "image" },
    { key: "beforeLabel", label: "كلمة قبل", type: "text", default: "قبل" },
    { key: "afterLabel", label: "كلمة بعد", type: "text", default: "بعد" },
  ],
  cues: [
    { t: SWEEP, sfx: "Whoosh", note: "الخط بيمسح" },
    { t: END, sfx: "Ding", note: "لما يثبت بالنص" },
  ],
  draw(ctx, t, props, env) {
    const { W, H, u, theme } = env;
    const vertical = H > W;
    let cw, ch;
    if (vertical) {
      cw = W * 0.86;
      ch = Math.min(cw * 1.22, H * 0.62);
    } else {
      ch = H * 0.74;
      cw = Math.min(ch * 1.45, W * 0.84);
    }
    const x = (W - cw) / 2;
    const y = (H - ch) / 2;
    const r = u * 4;

    // divider position, 0 = left edge, 1 = right edge
    let pos = 0.94;
    if (t >= SWEEP) pos = 0.94 - ease.inOut(prog(t, SWEEP, BACK - SWEEP - 0.1)) * 0.84;
    if (t >= BACK) pos = 0.1 + ease.inOut(prog(t, BACK, END - BACK)) * 0.4;
    const dx = x + cw * pos;
    const zoom = 1 + ease.inOut(prog(t, 0.3, 3.8)) * 0.05;

    ctx.save();
    enter(ctx, env, t, 0.5);
    ctx.globalAlpha *= 1 - prog(t, this.duration - 0.35, 0.35);

    // shadow under the card
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = u * 5;
    ctx.shadowOffsetY = u * 1.6;
    roundRect(ctx, x, y, cw, ch, r);
    ctx.fillStyle = theme.card;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, x, y, cw, ch, r);
    ctx.clip();
    // before: the whole card
    if (ok(props.before)) cover(ctx, props.before, x, y, cw, ch, zoom);
    else {
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha *= 0.13;
      ctx.fillRect(x, y, cw, ch);
      ctx.restore();
      pictureIcon(ctx, x + cw * 0.25, y + ch / 2 - u * 4, u * 9, theme.muted);
      text(ctx, env, "صورة قبل", x + cw * 0.25, y + ch / 2 + u * 5, { size: u * 3.6, weight: 700, color: theme.muted });
    }
    const pillSize = u * (vertical ? 3.6 : 3.2);
    const pad = u * 3.5;
    const lp = ease.out(prog(t, 0.35, 0.45));
    // "before" pill, top left, hidden where "after" covers it
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, dx - x, ch);
    ctx.clip();
    ctx.globalAlpha *= lp;
    if (props.beforeLabel) pill(ctx, env, props.beforeLabel, x + pad, y + pad, pillSize, theme.card, theme.ink, false);
    ctx.restore();

    // after: right of the divider
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, y, x + cw - dx, ch);
    ctx.clip();
    if (ok(props.after)) cover(ctx, props.after, x, y, cw, ch, zoom);
    else {
      ctx.fillStyle = theme.card;
      ctx.fillRect(x, y, cw, ch);
      ctx.save();
      ctx.fillStyle = env.accent;
      ctx.globalAlpha *= 0.3;
      ctx.fillRect(x, y, cw, ch);
      ctx.restore();
      pictureIcon(ctx, x + cw * 0.75, y + ch / 2 - u * 4, u * 9, env.accent);
      text(ctx, env, "صورة بعد", x + cw * 0.75, y + ch / 2 + u * 5, { size: u * 3.6, weight: 700, color: env.accent });
    }
    ctx.globalAlpha *= lp;
    if (props.afterLabel) pill(ctx, env, props.afterLabel, x + cw - pad, y + pad, pillSize, env.accent, env.onAccent, true);
    ctx.restore();
    ctx.restore(); // card clip

    // white soft edge around the card
    roundRect(ctx, x, y, cw, ch, r);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = u * 0.9;
    ctx.stroke();

    // divider line + round handle
    const hp = ease.back(prog(t, 0.45, 0.4));
    ctx.save();
    ctx.globalAlpha *= Math.min(1, hp);
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = u * 1.6;
    ctx.fillStyle = "#FFFFFF";
    const lw = u * 0.6;
    ctx.fillRect(dx - lw / 2, y + ch / 2 - (ch / 2) * Math.min(1, hp), lw, ch * Math.min(1, hp));
    const hr = u * 4.6 * hp;
    ctx.beginPath();
    ctx.arc(dx, y + ch / 2, Math.max(0, hr), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (hp > 0.2) {
      // chevrons pointing both ways
      const c = u * 1.3 * hp;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, hp);
      ctx.strokeStyle = env.accent;
      ctx.lineWidth = u * 0.55;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const cy = y + ch / 2;
      ctx.beginPath();
      ctx.moveTo(dx - c * 0.5, cy - c);
      ctx.lineTo(dx - c * 1.5, cy);
      ctx.lineTo(dx - c * 0.5, cy + c);
      ctx.moveTo(dx + c * 0.5, cy - c);
      ctx.lineTo(dx + c * 1.5, cy);
      ctx.lineTo(dx + c * 0.5, cy + c);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  },
};
